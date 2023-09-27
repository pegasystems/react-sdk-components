import React from "react";

import type { PConnProps } from '../../../types/PConnProps';

interface ErrorBoundaryProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  isInternalError?: boolean
}


// Remove this and use "real" PCore type once .d.ts is fixed (currently shows 1 error)
declare const PCore: any;


export default function ErrorBoundary(props: ErrorBoundaryProps) {
  const errorMsg = PCore.getErrorHandler().getGenericFailedMessage();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Messages';
  const ERROR_TEXT = localizedVal(errorMsg, localeCategory);
  const WORK_AREA = "workarea";
  const ERROR_WHILE_RENDERING = "ERROR_WHILE_RENDERING";
  const { getPConnect, isInternalError = false } = props;

  const theErrorDiv = <div>{ERROR_TEXT}</div>

  if (!getPConnect) {
    return (
      theErrorDiv
    );
  }

  const pConn = getPConnect();

  if (!isInternalError) {
    // eslint-disable-next-line no-console
    console.error(`${localizedVal('Unable to load the component', localeCategory)} ${pConn.getComponentName()}
    ${localizedVal(`This might be due to the view meta data getting corrupted or the component file missing.
    Raw meta data for the component:`, localeCategory)} ${JSON.stringify(pConn.getRawMetadata())}`);
  }

  if (pConn.getConfigProps()["type"] === "page") {
    return (
      theErrorDiv
    );
  }

  if (
    pConn.getContainerName() === WORK_AREA ||
    pConn.isInsideList() === true ||
    pConn.getContainerName() === "modal"
  ) {
    const { publish } = PCore.getPubSubUtils();
    publish(ERROR_WHILE_RENDERING);
    return null;
  }

  return (
    theErrorDiv
  );
}
