import { useMemo } from 'react';

import { getActiveContainerItemID, getActiveContainerRootViewElement, getPConnectOfActiveContainerItem, useContainerInitializer } from './helper';

const SimpleViewContainer = (props) => {
  const { CONTAINER_TYPE } = PCore.getConstants();

  const { getPConnect, mode = CONTAINER_TYPE.SINGLE, routingInfo: containerInfo, isAssignmentView, options = {} } = props;

  const rootViewElement = useMemo(() => {
    return getActiveContainerRootViewElement(containerInfo, {
      isAssignmentView,
      parentGetPConnect: getPConnect
    });
  }, [containerInfo, isAssignmentView, getPConnect]);

  useContainerInitializer(getPConnect, options.mode || mode);

  return rootViewElement;
};

export const withSimpleViewContainerRenderer =
  (Component, options: any = {}) =>
  (props) => {
    const { CONTAINER_TYPE } = PCore.getConstants();

    const { getPConnect, mode = CONTAINER_TYPE.SINGLE, routingInfo: containerInfo, isAssignmentView } = props;

    const rootViewElement = <SimpleViewContainer {...props} options={options} />;
    const activeContainerItemID = getActiveContainerItemID(containerInfo);
    const getPConnectOfActiveItem = getPConnectOfActiveContainerItem(containerInfo, {
      isAssignmentView,
      parentGetPConnect: getPConnect
    });

    useContainerInitializer(getPConnect, options.mode || mode);

    return (
      <Component
        {...props}
        rootViewElement={rootViewElement}
        activeContainerItemID={activeContainerItemID}
        getPConnectOfActiveContainerItem={getPConnectOfActiveItem}
      />
    );
  };

export default SimpleViewContainer;
