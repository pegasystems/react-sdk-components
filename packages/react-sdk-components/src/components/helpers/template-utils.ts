//  This file is adapted from React DX components/template/utils.js

export function getAllFields(pConnect: any) {
  const metadata = pConnect.getRawMetadata();
  let allFields: any[] = [];
  if (metadata.children && metadata.children.map) {
    allFields = metadata.children.map(fields => {
      const children = fields.children instanceof Array ? fields.children : [];
      return children.map(field => field.config);
    });
  }
  return allFields;
}

export function filterForFieldValueList(fields: any[]) {
  return fields
    .filter(({ visibility }) => visibility !== false)
    .map(({ value, label }) => ({
      id: label.toLowerCase(),
      name: label,
      value
    }));
}

/**
 * Determine if the current view is the view of the case step/assignment.
 * @param {Function} pConnect PConnect object for the component
 */
export function getIsAssignmentView(pConnect) {
  // Get caseInfo content from the store which contains the view info about the current assignment/step
  // TODO To be replaced with pConnect.getCaseInfo().getCurrentAssignmentView when it's available
  const assignmentViewClass = pConnect.getValue(PCore.getConstants().CASE_INFO.CASE_INFO_CLASSID);
  const assignmentViewName = pConnect.getValue(PCore.getConstants().CASE_INFO.ASSIGNMENTACTION_ID);

  const assignmentViewId = `${assignmentViewName}!${assignmentViewClass}`;

  // Get the info about the current view from pConnect
  const currentViewId = `${pConnect.getCurrentView()}!${pConnect.getCurrentClassID()}`;

  return assignmentViewId === currentViewId;
}

/**
 * A hook that gets the instructions content for a view.
 * @param {Function} pConnect PConnect object for the component
 * @param {string} [instructions="casestep"] 'casestep', 'none', or the html content of a Rule-UI-Paragraph rule (processed via core's paragraph annotation handler)
 */
export function getInstructions(pConnect, instructions: string = 'casestep'): string | undefined {
  const caseStepInstructions = PCore.getConstants().CASE_INFO.INSTRUCTIONS && pConnect.getValue(PCore.getConstants().CASE_INFO.INSTRUCTIONS);

  // Determine if this view is the current assignment/step view
  const isCurrentAssignmentView = getIsAssignmentView(pConnect);

  // Case step instructions
  if (instructions === 'casestep' && isCurrentAssignmentView && caseStepInstructions?.length) {
    return caseStepInstructions;
  }

  // No instructions
  if (instructions === 'none') {
    return undefined;
  }

  // Handle instructions as object (returned from paragraph processing)
  if (typeof instructions === 'object' && instructions !== null) {
    return (instructions as any).htmlContent;
  }

  // If the annotation wasn't processed correctly, don't return any instruction text
  if (instructions?.startsWith('@PARAGRAPH')) {
    return undefined;
  }

  // Custom instructions from the view
  // The raw metadata for `instructions` will be something like '@PARAGRAPH .SomeParagraphRule' but
  // it is evaluated by core logic to the content
  if (instructions !== 'casestep' && instructions !== 'none') {
    return instructions;
  }
  return undefined;
}

/**
 * Gets the message type for instructions to determine how they should be displayed.
 * @param {string | object | undefined | null} instructions The instructions object (from paragraph processing)
 * @returns {string | undefined} The message type from the instructions object (e.g., 'Caution', 'Information', 'Good'), or undefined if not available
 */
export function getInstructionsType(instructions): string | undefined {
  if (typeof instructions === 'object' && instructions !== null) {
    return (instructions as any).messageType;
  }
  return undefined;
}

/**
 * Gets the dismissBanner flag from instructions to determine if the banner can be dismissed.
 * @param {string | object | undefined | null} instructions The instructions object (from paragraph processing)
 * @returns {boolean} Whether the banner can be dismissed
 */
export function getDismissBanner(instructions): boolean {
  if (typeof instructions === 'object' && instructions !== null) {
    return (instructions as any).dismissBanner || false;
  }
  return false;
}

/**
 * Maps instructions type to banner variant for consistent styling
 * @param {string | undefined} instructionsType - The type of instructions (Caution, Information, Good)
 * @returns {'warning' | 'info' | 'success'} The corresponding banner variant
 */
export function mapInstructionsTypeToBannerVariant(instructionsType: string | undefined): 'warning' | 'info' | 'success' {
  switch (instructionsType) {
    case 'Caution':
      return 'warning';
    case 'Information':
      return 'info';
    case 'Good':
      return 'success';
    default:
      return 'info';
  }
}
