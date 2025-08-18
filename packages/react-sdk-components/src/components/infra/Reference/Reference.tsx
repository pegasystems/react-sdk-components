import type { PConnProps } from '../../../types/PConnProps';

interface ReferenceProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  visibility?: boolean;
  context?: string;
  readOnly?: boolean;
  displayMode?: string;
}

export default function Reference(props: ReferenceProps) {
  const { visibility = true, context = '', getPConnect, readOnly = false, displayMode = '' } = props;

  const pConnect = getPConnect();
  // @ts-ignore - Property 'getComponentConfig' is private and only accessible within class 'C11nEnv'.
  const referenceConfig = { ...pConnect.getComponentConfig() } || {};

  delete referenceConfig?.name;
  delete referenceConfig?.type;
  delete referenceConfig?.visibility;

  const viewMetadata: any = pConnect.getReferencedView();

  if (!viewMetadata) {
    // console.log("View not found ", pConnect.getComponentConfig());
    return null;
  }

  const viewObject = {
    ...viewMetadata,
    config: {
      ...viewMetadata.config,
      ...referenceConfig
    }
  };

  // @ts-ignore - Argument of type 'null' is not assignable to parameter of type 'string'.
  const viewComponent: any = pConnect.createComponent(viewObject, null, null, {
    pageReference: context && context.startsWith('@CLASS') ? '' : context
  });

  viewComponent.props.getPConnect().setInheritedConfig({
    ...referenceConfig,
    readOnly,
    displayMode
  });

  if (visibility !== false) {
    return <>{viewComponent}</>;
  }
  return null;
}
