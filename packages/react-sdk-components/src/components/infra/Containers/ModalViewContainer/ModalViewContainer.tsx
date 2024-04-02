import { createElement, useEffect, useRef, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DayjsUtils from '@date-io/dayjs';
import difference from 'lodash.difference';

import createPConnectComponent from '../../../../bridge/react_pconnect';
// Need to get correct implementation from component map for Assignment and CancelAlert
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { getBanners } from '../../../helpers/case-utils';
import { PConnProps } from '../../../../types/PConnProps';

interface ModalViewContainerProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  loadingInfo?: string;
  routingInfo?: any;
  pageMessages?: string[];
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
    // eslint-disable-next-line no-plusplus
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

  const classes = useStyles();

  const modalCollection = useRef({});
  const routingInfoRef = useRef({});
  const { getPConnect, routingInfo = null, pageMessages = [] } = props;
  const pConn = getPConnect();
  const { acTertiary } = pConn.getConfigProps() as any;
  const {
    CONTAINER_TYPE: { MULTIPLE },
    PUB_SUB_EVENTS: { EVENT_SHOW_CANCEL_ALERT }
  } = PCore.getConstants();
  const { subscribe, unsubscribe } = PCore.getPubSubUtils();
  const [bShowModal, setShowModal] = useState(false);
  const [bShowCancelAlert, setShowCancelAlert] = useState(false);
  const [createdView, setCreatedView] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [arNewChildrenAsReact, setArNewChildrenAsReact] = useState<any[]>([]);
  const [itemKey, setItemKey] = useState('');
  const [cancelAlertProps, setCancelAlertProps] = useState({});
  const [isMultiRecordData, setMultiRecordData] = useState(false);
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Data Object';

  const ERROR_WHILE_RENDERING = 'ERROR_WHILE_RENDERING';

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
      setShowModal(false);
    }
  }

  const dismissCancelAlert = dismissAllModals => {
    setShowCancelAlert(false);

    if (dismissAllModals) {
      setShowModal(false);
    }
  };

  function getModalHeading(dataObjectAction) {
    return dataObjectAction === PCore.getConstants().RESOURCE_STATUS.CREATE
      ? localizedVal('Add Record', localeCategory)
      : localizedVal('Edit Record', localeCategory);
  }

  function determineModalHeaderByAction(actionName, caseTypeName, ID, caseLocaleRef) {
    if (actionName) {
      return localizedVal(actionName, localeCategory);
    }
    return `${localizedVal('Create', localeCategory)} ${localizedVal(caseTypeName, undefined, caseLocaleRef)} (${ID})`;
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
        // eslint-disable-next-line no-console
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
        // const { isDockable = false } = latestItem?.modalOptions || {};
        const configObject: any = getConfigObject(latestItem, null, false);
        const pConnect = configObject.getPConnect();
        const caseInfo: any = pConnect.getCaseInfo();
        const caseName = caseInfo.getName();
        const caseTypeName = caseInfo.getCaseTypeName();
        const ID = caseInfo.getBusinessID() || caseInfo.getID();
        const isDataObject = routingInfo.items[latestItem.context].resourceType === PCore.getConstants().RESOURCE_TYPES.DATA;
        const dataObjectAction = routingInfo.items[latestItem.context].resourceStatus;
        const isMultiRecord = routingInfo.items[latestItem.context].isMultiRecordData;
        const headingValue =
          isDataObject || isMultiRecord
            ? getModalHeading(dataObjectAction)
            : determineModalHeaderByAction(actionName, caseTypeName, ID, `${caseInfo?.getClassName()}!CASE!${caseInfo.getName()}`.toUpperCase());

        let arChildrenAsReact: any[] = [];

        if (pConnect.getComponentName() === 'reference') {
          // Reference component doesn't have children. It can build the View we want.
          // The Reference component getPConnect is in configObject

          arChildrenAsReact.push(
            createElement(createPConnectComponent(), {
              ...configObject,
              key: `${caseName}-${ID}`
            })
          );
        } else {
          // This is the 8.6 implementation. Leaving it in for reference for now.
          // And create a similar array of the children as React components
          // passed to Assignment component when rendered
          arChildrenAsReact = (pConnect.getChildren() as []).map((child: any) => {
            // Use Case Summary ID as the React element's key
            const caseSummaryID = child.getPConnect().getCaseSummary().ID;
            return createElement(createPConnectComponent(), {
              ...child,
              key: caseSummaryID
            });
          });
        }

        if (arChildrenAsReact.length > 0) setArNewChildrenAsReact(arChildrenAsReact);
        setMultiRecordData(isMultiRecord);
        setTitle(headingValue);
        setCreatedView({ configObject, latestItem });
        setItemKey(key);
        setShowModal(true);

        // Update modal use case which happens when assignment in submitted in modal.
        if (isUpdateModalAction(modalCollection.current, accessedOrder)) {
          // handleModalUpdate(key);
        } else if (isOpenModalAction(modalCollection.current, accessedOrder)) {
          // New modal open scenario
          handleModalOpen(key);
        }
      } else if (isCloseModalAction(modalCollection.current, accessedOrder)) {
        handleModalClose(accessedOrder);
      }
    }
  }, [routingInfo]);

  function closeActionsDialog() {
    // actionsDialog.current = true;
    setShowModal(false);
  }

  return (
    <>
      <Dialog open={bShowModal} aria-labelledby='form-dialog-title'>
        <DialogTitle id='form-dialog-title' className={`${classes.dlgTitle} psdk-dialog-title`}>
          {title}
        </DialogTitle>
        <DialogContent className={`${classes.dlgContent} psdk-dialog-content`}>
          {bShowModal ? (
            <MuiPickersUtilsProvider utils={DayjsUtils}>
              <Assignment
                getPConnect={createdView.configObject.getPConnect}
                itemKey={itemKey}
                isInModal
                banners={getBanners({
                  target: itemKey,
                  pageMessages
                })}
              >
                {arNewChildrenAsReact}
              </Assignment>
            </MuiPickersUtilsProvider>
          ) : null}
        </DialogContent>

        {isMultiRecordData && (
          <ListViewActionButtons
            getPConnect={createdView.configObject.getPConnect}
            context={createdView.latestItem.context}
            closeActionsDialog={closeActionsDialog}
          />
        )}
      </Dialog>
      {bShowCancelAlert && <CancelAlert {...cancelAlertProps} dismiss={dismissCancelAlert} />}
    </>
  );
}
