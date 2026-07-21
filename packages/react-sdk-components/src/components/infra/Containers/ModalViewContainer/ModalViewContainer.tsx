import { createElement, useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import makeStyles from '@mui/styles/makeStyles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import difference from 'lodash.difference';

import createPConnectComponent from '../../../../bridge/react_pconnect';
// Need to get correct implementation from component map for Assignment and CancelAlert
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { getBanners } from '../../../helpers/case-utils';
import type { PConnProps } from '../../../../types/PConnProps';

/**
 * WARNING: This file is part of the infrastructure component responsible for working with Redux and managing the creation and update of Redux containers and PConnect.
 * You may override Material components within this component if needed, but do not modify any container-related logic. Changing this logic can lead to unexpected behavior.
 */

interface ModalViewContainerProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  loadingInfo?: string;
  routingInfo?: any;
  pageMessages?: string[];
  httpMessages?: any[];
}

function isOpenModalAction(prevModalCollection, currentModalList) {
  return prevModalCollection && currentModalList ? Object.keys(prevModalCollection).length < currentModalList.length : false;
}

function isUpdateModalAction(prevModalCollection, currentModalList) {
  return prevModalCollection && currentModalList ? Object.keys(prevModalCollection).length === currentModalList.length : false;
}

function isCloseModalAction(prevModalCollection, currentModalList) {
  return prevModalCollection && currentModalList ? Object.keys(prevModalCollection).length > currentModalList.length : false;
}

function buildName(pConnect, name = '') {
  const context = pConnect.getContextName();
  return `${context}/${name}`;
}

function getKeyAndLatestItem(routinginfo, pConn, options) {
  const containerName = pConn.getContainerName();
  const { acTertiary = false } = options || {};
  if (PCore.getContainerUtils().hasContainerItems(buildName(pConn, containerName))) {
    const { accessedOrder, items } = routinginfo;
    let key;

    for (let i = accessedOrder.length - 1; i >= 0; i--) {
      const tempkey = accessedOrder[i];
      if ((acTertiary && items[tempkey].acTertiary) || (!acTertiary && !items[tempkey].acTertiary)) {
        key = tempkey;
        break;
      }
    }
    const latestItem = items[key];
    return { key, latestItem };
  }
  return {};
}

function getConfigObject(item, pConnect, isReverseCoexistence = false) {
  let config;
  if (isReverseCoexistence) {
    config = {
      options: {
        pageReference: pConnect?.getPageReference(),
        hasForm: true,
        containerName: pConnect?.getContainerName() || PCore.getConstants().MODAL
      }
    };
    return PCore.createPConnect(config);
  }
  if (item) {
    const { context, view, isBulkAction } = item;
    const target = PCore.getContainerUtils().getTargetFromContainerItemID(context);
    config = {
      meta: view,
      options: {
        context,
        pageReference: view.config.context || pConnect.getPageReference(),
        hasForm: true,
        ...(isBulkAction && { isBulkAction }),
        containerName: pConnect?.getContainerName() || PCore.getConstants().MODAL,
        target
      }
    };
    return PCore.createPConnect(config);
  }
  return null;
}

const useStyles = makeStyles(theme => ({
  dlgTitle: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0)
  },
  dlgContent: {
    paddingTop: `${theme.spacing(1)} !important`,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(0),
    marginBottom: theme.spacing(2)
  }
}));

export default function ModalViewContainer(props: ModalViewContainerProps) {
  // Get the proper implementation (local or Pega-provided) for these components that are emitted below
  const Assignment = getComponentFromMap('Assignment');
  const CancelAlert = getComponentFromMap('CancelAlert');
  const ListViewActionButtons = getComponentFromMap('ListViewActionButtons');
  const DataViewActionButtons = getComponentFromMap('DataViewActionButtons');
  const classes = useStyles();

  const modalCollection = useRef({});
  const routingInfoRef = useRef({});
  const { getPConnect, routingInfo = null, pageMessages = [], httpMessages = [] } = props;
  const pConn = getPConnect();
  const { acTertiary } = pConn.getConfigProps() as any;
  const {
    CONTAINER_TYPE: { MULTIPLE },
    PUB_SUB_EVENTS: { EVENT_SHOW_CANCEL_ALERT }
  } = PCore.getConstants();
  const { subscribe, unsubscribe } = PCore.getPubSubUtils();
  const [bShowCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelAlertProps, setCancelAlertProps] = useState({});
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'ModalContainer';

  const ERROR_WHILE_RENDERING = 'ERROR_WHILE_RENDERING';

  // Stack of open modals — each entry represents one stacked modal
  interface ModalEntry {
    key: string;
    title: string;
    createdView: any;
    arNewChildrenAsReact: any[];
    isMultiRecordData: boolean;
    isDataObjectModal: boolean;
    dataRecordKeys: string;
    dataObjectActionID: string;
    dataObjectAction: string;
    dataObjectClassId: string;
  }
  const [modalStack, setModalStack] = useState<ModalEntry[]>([]);

  function showAlert(payload) {
    const { latestItem } = getKeyAndLatestItem(routingInfoRef.current, pConn, { acTertiary });
    const isReverseCoexistence = (PCore.getCoexistenceManager().getBroadcastUtils() as any).isReverseCoexistenceCaseLoaded();
    const { isModalAction, hideDelete, isDataObject, skipReleaseLockRequest } = payload;

    /*
      If we are in create stage full page mode, created a new case and trying to click on cancel button
      it will show two alert dialogs which is not expected. Hence isModalAction flag to avoid that.
    */
    if (latestItem && isModalAction) {
      const configObject = getConfigObject(latestItem, pConn, isReverseCoexistence);
      const contextName = configObject?.getPConnect().getContextName();
      setCancelAlertProps({
        heading: 'Discard unsaved changes?',
        content: 'You have unsaved changes. You can discard them or go back to keep working.',
        getPConnect: configObject?.getPConnect,
        itemKey: contextName,
        hideDelete,
        isDataObject,
        skipReleaseLockRequest
      });
      setShowCancelAlert(true);
    }
  }

  function handleModalOpen(key) {
    modalCollection.current = {
      ...modalCollection.current,
      [key]: {}
    };
  }

  function handleModalClose(accessedOrder) {
    const tempModalCollection = modalCollection.current;
    const [closedModalKey] = difference(Object.keys(tempModalCollection), accessedOrder);

    if (closedModalKey && tempModalCollection[closedModalKey]) {
      const modifiedModalCollection = { ...tempModalCollection };
      delete modifiedModalCollection[closedModalKey];
      modalCollection.current = modifiedModalCollection;
      // Remove the closed modal from the stack
      setModalStack(prev => prev.filter(entry => entry.key !== closedModalKey));
    }
  }

  const dismissCancelAlert = dismissAllModals => {
    setShowCancelAlert(false);

    if (dismissAllModals) {
      setModalStack([]);
    }
  };

  function getModalHeading(dataObjectAction, actionName) {
    switch (dataObjectAction) {
      case PCore.getConstants().RESOURCE_STATUS.CREATE:
        return localizedVal('Add Record', localeCategory);
      case PCore.getConstants().RESOURCE_STATUS.OPEN_FLOW_ACTION:
        return localizedVal(actionName, localeCategory);
      default:
        return localizedVal('Edit Record', localeCategory);
    }
  }

  function determineModalHeaderByAction(actionName, caseTypeName, caseLocaleRef) {
    if (actionName) {
      return localizedVal(actionName, localeCategory);
    }
    return `${localizedVal('Create', localeCategory)} ${localizedVal(caseTypeName, undefined, caseLocaleRef)}`;
  }

  useEffect(() => {
    // Establish the necessary containers
    const containerMgr = pConn.getContainerManager();
    containerMgr.initializeContainers({ type: MULTIPLE });
  }, [MULTIPLE, pConn]);

  useEffect(() => {
    // Persisting routing information between the renders in showAlert
    routingInfoRef.current = routingInfo;
  });

  useEffect(() => {
    subscribe(EVENT_SHOW_CANCEL_ALERT, showAlert, EVENT_SHOW_CANCEL_ALERT /* Unique string for subscription */);
    subscribe(
      ERROR_WHILE_RENDERING,
      error => {
        // setError(true);

        console.error(error);
      },
      `${ERROR_WHILE_RENDERING}-mc-${getPConnect().getContextName()}`,
      false,
      getPConnect().getContextName()
    );

    // Unsubscribe on component unmount
    return () => {
      unsubscribe(EVENT_SHOW_CANCEL_ALERT, EVENT_SHOW_CANCEL_ALERT /* Should be same unique string passed during subscription */);
    };
  });

  useEffect(() => {
    if (routingInfo) {
      const { accessedOrder, type } = routingInfo;
      const { key, latestItem } = getKeyAndLatestItem(routingInfo, pConn, { acTertiary });

      if (
        latestItem &&
        type === MULTIPLE &&
        (isOpenModalAction(modalCollection.current, accessedOrder) || isUpdateModalAction(modalCollection.current, accessedOrder))
      ) {
        const { actionName } = latestItem;
        const configObject: any = getConfigObject(latestItem, null, false);
        const pConnect = configObject.getPConnect();
        const caseInfo: any = pConnect.getCaseInfo();
        const caseName = caseInfo.getName();
        const caseTypeName = caseInfo.getCaseTypeName();
        const ID = caseInfo.getBusinessID() || caseInfo.getID();
        const isDataObject = routingInfo.items[latestItem.context].resourceType === PCore.getConstants().RESOURCE_TYPES.DATA;
        const dataObjAction = routingInfo.items[latestItem.context].resourceStatus;
        const multiRecordData = routingInfo.items[latestItem.context].isMultiRecordData;
        const actionID = routingInfo.items[latestItem.context].actionID;

        const getHeadingValue = () => {
          if (multiRecordData) {
            return routingInfo.items[latestItem.context].heading;
          }
          if (isDataObject) {
            if (actionName) {
              return localizedVal(actionName, localeCategory);
            }
            return getModalHeading(dataObjAction, actionName);
          }
          return determineModalHeaderByAction(actionName, caseTypeName, pConnect?.getCaseLocaleReference());
        };

        let arChildrenAsReact: any[] = [];

        if (pConnect.getComponentName() === 'reference') {
          arChildrenAsReact.push(
            createElement(createPConnectComponent(), {
              ...configObject,
              key: `${caseName}-${ID}`
            })
          );
        } else {
          arChildrenAsReact = (pConnect.getChildren() as []).map((child: any) => {
            const caseSummaryID = child.getPConnect().getCaseSummary().ID;
            return createElement(createPConnectComponent(), {
              ...child,
              key: caseSummaryID
            });
          });
        }

        const modalEntry: ModalEntry = {
          key,
          title: getHeadingValue(),
          createdView: { configObject, latestItem },
          arNewChildrenAsReact: arChildrenAsReact.length > 0 ? arChildrenAsReact : [],
          isMultiRecordData: multiRecordData,
          isDataObjectModal: isDataObject && !multiRecordData,
          dataRecordKeys: latestItem.key || '',
          dataObjectActionID: actionID || '',
          dataObjectAction: dataObjAction || '',
          dataObjectClassId: pConnect.getValue('.classID') || ''
        };

        if (isUpdateModalAction(modalCollection.current, accessedOrder)) {
          // Update existing modal in the stack
          setModalStack(prev => prev.map(entry => (entry.key === key ? modalEntry : entry)));
        } else if (isOpenModalAction(modalCollection.current, accessedOrder)) {
          // Push new modal onto the stack
          handleModalOpen(key);
          setModalStack(prev => [...prev, modalEntry]);
        }
      } else if (isCloseModalAction(modalCollection.current, accessedOrder)) {
        handleModalClose(accessedOrder);
      }
    }
  }, [routingInfo]);

  function closeActionsDialog(modalKey?: string) {
    if (modalKey) {
      setModalStack(prev => prev.filter(entry => entry.key !== modalKey));
    } else {
      // Close the topmost modal
      setModalStack(prev => prev.slice(0, -1));
    }
  }

  return (
    <>
      {modalStack.map(modal => (
        <Dialog key={modal.key} open aria-labelledby={`form-dialog-title-${modal.key}`} maxWidth='md' fullWidth>
          <DialogTitle id={`form-dialog-title-${modal.key}`} className={`${classes.dlgTitle} psdk-dialog-title`}>
            {modal.title}
          </DialogTitle>
          <DialogContent className={`${classes.dlgContent} psdk-dialog-content`}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Assignment
                getPConnect={modal.createdView.configObject.getPConnect}
                itemKey={modal.key}
                isInModal
                banners={getBanners({
                  target: modal.key,
                  pageMessages,
                  httpMessages
                })}
              >
                {modal.arNewChildrenAsReact}
              </Assignment>
            </LocalizationProvider>
          </DialogContent>

          {modal.isMultiRecordData && (
            <ListViewActionButtons
              getPConnect={modal.createdView.configObject.getPConnect}
              context={modal.createdView.latestItem.context}
              closeActionsDialog={() => closeActionsDialog(modal.key)}
            />
          )}
          {modal.isDataObjectModal && (
            <DataViewActionButtons
              getPConnect={modal.createdView.configObject.getPConnect}
              context={modal.createdView.latestItem.context}
              classId={modal.dataObjectClassId}
              dataObjectAction={modal.dataObjectAction}
              dataRecordKeys={modal.dataRecordKeys}
              actionID={modal.dataObjectActionID}
              closeActionsDialog={() => closeActionsDialog(modal.key)}
            />
          )}
        </Dialog>
      ))}
      {bShowCancelAlert && <CancelAlert {...cancelAlertProps} dismiss={dismissCancelAlert} />}
    </>
  );
}
