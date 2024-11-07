import { PConnProps } from '../../../types/PConnProps';

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

  const viewComponent: any = pConnect.createComponent(viewObject, '', 0, {
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
