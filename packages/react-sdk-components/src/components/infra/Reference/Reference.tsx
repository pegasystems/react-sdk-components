import React from "react";

// import type { PConnProps } from '../../../types/PConnProps';

// ReferenceProps can't be used until getComponentConfig() is NOT private
// interface ReferenceProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   visibility?: boolean,
//   context?: string,
//   readOnly?: boolean,
//   displayMode?: string
// }


export default function Reference(props /* : ReferenceProps */) {
  const { visibility = true, context = '', getPConnect, readOnly = false, displayMode = '' } = props;

  const pConnect = getPConnect();
  const referenceConfig = { ...pConnect.getComponentConfig() } || {};

  delete referenceConfig?.name;
  delete referenceConfig?.type;
  delete referenceConfig?.visibility;

  const viewMetadata = pConnect.getReferencedView();

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

  const viewComponent = pConnect.createComponent(viewObject, null, null, {
    pageReference: context
  });

  viewComponent.props.getPConnect().setInheritedConfig({
    ...referenceConfig,
    readOnly,
    displayMode
  });

  if (visibility !== false) {
    return <React.Fragment>{viewComponent}</React.Fragment>;
  }
  return null;
}
