// import type { PConnProps } from '../../../types/PConnProps';

// Need to fix an error noted in comment below before typedefs will work correctly
// interface SingleReferenceReadOnlyProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   config: any,
//   displayAs?: string,
//   ruleClass?: string,
//   label?: string,
//   displayMode?: string,
//   type: string,
//   referenceType?: string,
//   hideLabel?: boolean,
//   dataRelationshipContext?: string
// }


export default function SingleReferenceReadOnly(props /* : SingleReferenceReadOnlyProps */) {
  const {
    getPConnect,
    displayAs = '',
    ruleClass = '',
    label = '',
    type = '',
    displayMode = '',
    referenceType = '',
    hideLabel = false,
    dataRelationshipContext = null,
    config
  } = props;

  const editableComponents = ["AutoComplete", "SimpleTableSelect", "Dropdown"];

  if (editableComponents.includes(type)) {
    config.caseClass = ruleClass;
    config.text = config.primaryField;
    config.caseID = config.value;
    config.contextPage = `@P .${dataRelationshipContext}`;
    config.resourceParams = {
      "workID": displayAs === "table" ? config.selectionKey : config.value
    };
    config.resourcePayload = {
      "caseClassName": ruleClass
    };
  }

  // Need to correct typedefs for createComponent for typedefs to work in this file
  return getPConnect().createComponent({
    type: 'SemanticLink',
    config: {
      ...config,
      label,
      displayMode,
      referenceType,
      hideLabel,
      dataRelationshipContext
    }
  });
}
