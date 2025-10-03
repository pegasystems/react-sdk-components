import type { PConnProps } from '../../../types/PConnProps';

interface SingleReferenceReadOnlyProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  config: any;
  displayAs?: string;
  ruleClass?: string;
  label?: string;
  displayMode?: string;
  type: string;
  referenceType?: string;
  hideLabel?: boolean;
  dataRelationshipContext?: string;
}

export default function SingleReferenceReadOnly(props: SingleReferenceReadOnlyProps) {
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
    config,
  } = props;

  const editableComponents = ['AutoComplete', 'SimpleTableSelect', 'Dropdown'];

  if (editableComponents.includes(type)) {
    config.caseClass = ruleClass;
    config.text = config.primaryField;
    config.caseID = config.value;
    config.contextPage = `@P .${dataRelationshipContext}`;
    config.resourceParams = {
      workID: displayAs === 'table' ? config.selectionKey : config.value,
    };
    config.resourcePayload = {
      caseClassName: ruleClass,
    };
  }

  const component = getPConnect().createComponent(
    {
      type: 'SemanticLink',
      config: {
        ...config,
        label,
        displayMode,
        referenceType,
        hideLabel,
        dataRelationshipContext,
      },
    },
    '',
    0,
    {},
  ); // 2nd, 3rd, and 4th args empty string/object/null until typedef marked correctly as optional

  return <>{component}</>;
}
