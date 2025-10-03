import { useEffect, createElement } from 'react';

import createPConnectComponent from '../../../../bridge/react_pconnect';
import { isContainerInitialized } from '../container-helpers';

const processRootViewDetails = (rootView, containerItem, options) => {
  const {
    config: { context: viewContext, name: viewName },
  } = rootView;
  const { context: containerContext } = containerItem;
  const { parentGetPConnect } = options;
  let resolvedViewName = viewName;
  let resolvedViewContext = viewContext;

  const isAnnotedViewName = PCore.getAnnotationUtils().isProperty(viewName);
  const isAnnotedViewContext = PCore.getAnnotationUtils().isProperty(viewContext);

  // resolving annoted view context
  if (isAnnotedViewContext) {
    const viewContextProperty = PCore.getAnnotationUtils().getPropertyName(viewContext);
    resolvedViewContext = PCore.getStoreValue(
      `.${viewContextProperty}`,
      viewContextProperty.startsWith('.') ? parentGetPConnect().getPageReference() : '',
      containerContext,
    );
  }

  if (!resolvedViewContext) {
    resolvedViewContext = parentGetPConnect().getPageReference();
  }

  // resolving annoted view name
  if (isAnnotedViewName) {
    const viewNameProperty = PCore.getAnnotationUtils().getPropertyName(viewName);
    resolvedViewName = PCore.getStoreValue(`.${viewNameProperty}`, resolvedViewContext, containerContext);
  }

  /* Special case where context and viewname are dynamic values
    Use case - split for each shape

    Ex - (caseInfo.content.SCRequestWorkQueues[1]):context --> .pyViewName:viewName
  */
  if (isAnnotedViewName && isAnnotedViewContext && resolvedViewName !== '') {
    /* Allow context processor to resolve view and context when both are dynamic */
    resolvedViewName = viewName;
    resolvedViewContext = viewContext;
  }

  return {
    viewName: resolvedViewName,
    viewContext: resolvedViewContext,
  };
};

export const getPConnectOfActiveContainerItem = (containerInfo, options) => {
  const { accessedOrder, items } = containerInfo;
  const { isAssignmentView = false, parentGetPConnect } = options;
  const containerName = parentGetPConnect().getContainerName();
  const { CONTAINER_NAMES } = PCore.getContainerUtils();
  const { CREATE_DETAILS_VIEW_NAME } = PCore.getConstants();

  if (accessedOrder && items) {
    const activeContainerItemKey = accessedOrder[accessedOrder.length - 1];

    if (items[activeContainerItemKey] && items[activeContainerItemKey].view && Object.keys(items[activeContainerItemKey].view).length > 0) {
      const activeContainerItem = items[activeContainerItemKey];
      const target = activeContainerItemKey.substring(0, activeContainerItemKey.lastIndexOf('_'));

      const { view: rootView, context } = activeContainerItem;
      const { viewName, viewContext } = processRootViewDetails(rootView, activeContainerItem, { parentGetPConnect });

      if (!viewName) return null;

      const config = {
        meta: rootView,
        options: {
          context,
          pageReference: viewContext || parentGetPConnect().getPageReference(),
          containerName,
          containerItemID: activeContainerItemKey,
          parentPageReference: parentGetPConnect().getPageReference(),
          hasForm:
            isAssignmentView ||
            containerName === CONTAINER_NAMES.WORKAREA ||
            containerName === CONTAINER_NAMES.MODAL ||
            viewName === CREATE_DETAILS_VIEW_NAME,
          target,
        },
      };

      return PCore.createPConnect(config).getPConnect;
    }
  }
  return null;
};

export const getActiveContainerRootViewElement = (containerInfo, options) => {
  const getPConnect = getPConnectOfActiveContainerItem(containerInfo, options);
  if (getPConnect) {
    return createElement(createPConnectComponent(), { getPConnect });
  }
  return null;
};

export const getActiveContainerItemID = (containerInfo) => {
  const { accessedOrder } = containerInfo;
  if (accessedOrder && accessedOrder.length > 0) {
    return accessedOrder[accessedOrder.length - 1];
  }
  return '';
};

export const useContainerInitializer = (getPConnect, mode) => {
  const pConnect = getPConnect();
  const containerName = pConnect.getContainerName();
  const containerManager = pConnect.getContainerManager();
  useEffect(() => {
    if (!isContainerInitialized(pConnect)) {
      containerManager.initializeContainers({
        type: mode,
        name: containerName,
      });
    }
  });
};
