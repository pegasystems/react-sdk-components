/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createElement, useContext, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

import createPConnectComponent from '../../../../bridge/react_pconnect';
import StoreContext from '../../../../bridge/Context/StoreContext';
import { isEmptyObject } from '../../../helpers/common-utils';
import type { PConnProps } from '../../../../types/PConnProps';
import { configureBrowserBookmark } from '../container-helpers';

interface ViewContainerProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  name?: string;
  loadingInfo?: any; // can't be boolean until setDispatchObjState expects loadingInfo to be type null
  routingInfo?: any;
  mode?: string;
  limit?: number;
}

// ViewContainer can emit View
// import View from '../View';

//
// WARNING:  It is not expected that this file should be modified.  It is part of infrastructure code that works with
// Redux and creation/update of Redux containers and PConnect.  Modifying this code could have undesireable results and
// is totally at your own risk.
//

export default function ViewContainer(props: ViewContainerProps) {
  // const { getPConnect, children, routingInfo, name } = props;
  const { getPConnect, name = '', mode = 'single', limit = 16, loadingInfo = false, routingInfo = null } = props;

  const { displayOnlyFA } = useContext<any>(StoreContext);

  const { CONTAINER_TYPE, APP } = PCore.getConstants();
  const pConn = getPConnect();
  const containerMgr: any = pConn.getContainerManager();

  const [dispatchObjState, setDispatchObjState] = useState({
    dispatchObject: { semanticURL: '', context: '', acName: '' },
    visible: false,
    loadingInfo: null,
    isLoadingInfoChange: false
  }); // was this.state in class-based ViewContainer avoiding use of just "state" as the name

  let root;

  const thePConn = typeof getPConnect === 'function' ? getPConnect() : null;

  // beginning of functions for use by ViewContainer

  function buildName() {
    const context = thePConn?.getContextName();
    let viewContainerName = name;
    if (!viewContainerName) viewContainerName = '';
    return `${context?.toUpperCase()}/${viewContainerName.toUpperCase()}`;
  }

  function prepareDispatchObject() {
    const baseContext = pConn.getContextName();
    // const { acName = "primary" } = pConn.getContainerName(); // doesn't work with 8.23 typings
    let acName = pConn.getContainerName();
    if (!acName) {
      acName = 'primary';
    }

    return {
      semanticURL: '',
      context: baseContext,
      acName
    };
  }

  // determine if or not loadingInfo prop changed on next re-render
  // function getDerivedStateFromProps(nextProps, prevState) {
  //   const { loadingInfo: prevLoadingInfo } = prevState;
  //   const { loadingInfo: nextLoadingIndfo } = nextProps;
  //   return {
  //     loadingInfo: nextLoadingIndfo,
  //     isLoadingInfoChange: prevLoadingInfo !== nextLoadingIndfo
  //   };
  // }

  // set the root component that is retrieved by PConnectHOC
  function setRootComponent(configObject) {
    const { isLoadingInfoChange } = dispatchObjState;
    if (!isLoadingInfoChange) {
      root = createElement(createPConnectComponent(), configObject);
    }
  }

  // end of functions for use by ViewContainer

  // useEffect on [] -> code that should be run once (as in old constructor and in componentDidMount)
  useEffect(() => {
    // This is adapted from the class-based ViewContainer constructor
    containerMgr.initializeContainers({
      type: mode === CONTAINER_TYPE.MULTIPLE ? CONTAINER_TYPE.MULTIPLE : CONTAINER_TYPE.SINGLE
    });

    if (mode === CONTAINER_TYPE.MULTIPLE && limit) {
      /* NOTE: setContainerLimit use is temporary. It is a non-public, unsupported API. */
      PCore.getContainerUtils().setContainerLimit(`${APP.APP}/${name}`, limit);
    }

    const dispatchObject = prepareDispatchObject();
    setDispatchObjState({
      dispatchObject,
      // PCore is defined in pxBootstrapShell - eventually will be exported in place of constellationCore
      visible: !PCore.checkIfSemanticURL(),
      loadingInfo,
      isLoadingInfoChange: false
    });

    const { visible } = dispatchObjState;
    if (visible) containerMgr.addContainerItem(dispatchObject);

    // This is adapted from the class-based ViewContainer componentDidMount
    let objectForAddContainer;
    if (PCore.checkIfSemanticURL()) {
      objectForAddContainer = prepareDispatchObject();
    } else {
      const { dispatchObject: theDispatchObject } = dispatchObjState;
      objectForAddContainer = theDispatchObject;
    }

    // Getting default view label
    const navPages = pConn.getValue('pyPortal.pyPrimaryNavPages', ''); // 2nd arg empty string until typedefs allow optional
    const defaultViewLabel = Array.isArray(navPages) && navPages[0] ? navPages[0].pyLabel : '';
    // TODO: Plan is to rename window.constellationCore to window.pega (or similar)
    //    And expose less via ui-bootstrap.js
    // PCore is defined in pxBootstrapShell - eventually will be exported in place of constellationCore

    if (!displayOnlyFA) {
      // configureForBrowserBookmark not applicable in Embedded mode
      configureBrowserBookmark(pConn);
    }
  }, []);

  // This code (that's run every time the ViewContainer is called) is adapted from the class-based ViewContainer's render

  // Looking for routingInfo

  // debugging/investigation help
  // console.log(`ViewContainer props: ${JSON.stringify(props)}`);

  const theBuildName = buildName();
  const { CREATE_DETAILS_VIEW_NAME } = PCore.getConstants();
  if (routingInfo) {
    const { accessedOrder, items } = routingInfo;
    if (accessedOrder && items) {
      const key = accessedOrder[accessedOrder.length - 1];
      let componentVisible = accessedOrder.length > 0;
      const { visible } = dispatchObjState;
      componentVisible = visible || componentVisible;
      if (items[key] && items[key].view && !isEmptyObject(items[key].view)) {
        const latestItem = items[key];
        const rootView = latestItem.view;
        const { context, name: viewName } = rootView.config;
        const config: any = { meta: rootView };
        config.options = {
          context: latestItem.context,
          pageReference: context || getPConnect().getPageReference(),
          containerName: getPConnect().getContainerName(),
          containerItemName: key,
          hasForm: viewName === CREATE_DETAILS_VIEW_NAME
        };
        const configObject: any = PCore.createPConnect(config);

        // Add in displayOnlyFA if prop is on ViewContainer
        if (displayOnlyFA) {
          configObject.displayOnlyFA = true;
        }

        setRootComponent(configObject);
        return (
          <React.Fragment key={theBuildName}>
            {componentVisible && root}
            {loadingInfo && (
              <Box textAlign='center'>
                <CircularProgress />
              </Box>
            )}
          </React.Fragment>
        );
      }
    }
  }

  // fall through return if insufficient routingInfo
  return (
    <React.Fragment key={theBuildName}>
      {loadingInfo && (
        <Box textAlign='center'>
          <CircularProgress />
        </Box>
      )}
    </React.Fragment>
  );
}
