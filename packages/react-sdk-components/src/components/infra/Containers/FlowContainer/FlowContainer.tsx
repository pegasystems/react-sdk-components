/* eslint-disable no-nested-ternary */

import { useState, useEffect, useContext } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Alert, Card, CardHeader, Avatar, Typography } from '@mui/material';

import StoreContext from '../../../../bridge/Context/StoreContext';
import { Utils } from '../../../helpers/utils';
import { isContainerInitialized } from '../container-helpers';
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { withSimpleViewContainerRenderer } from '../SimpleView/SimpleView';

import { addContainerItem, getToDoAssignments, showBanner, hasContainerItems } from './helpers';
import { PConnProps } from '../../../../types/PConnProps';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

interface FlowContainerProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  pageMessages: any[];
  rootViewElement: React.ReactNode;
  getPConnectOfActiveContainerItem: Function;
  assignmentNames: string[];
  activeContainerItemID: string;
}

//
// WARNING:  It is not expected that this file should be modified.  It is part of infrastructure code that works with
// Redux and creation/update of Redux containers and PConnect.  Modifying this code could have undesireable results and
// is totally at your own risk.
//

const useStyles = makeStyles(theme => ({
  root: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  alert: {
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1)
  },
  avatar: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.getContrastText(theme.palette.primary.light)
  }
}));

export const FlowContainer = (props: FlowContainerProps) => {
  // Get the proper implementation (local or Pega-provided) for these components that are emitted below
  const Assignment = getComponentFromMap('Assignment');
  const ToDo = getComponentFromMap('Todo'); // NOTE: ConstellationJS Engine uses "Todo" and not "ToDo"!!!
  const AlertBanner = getComponentFromMap('AlertBanner');

  const pCoreConstants = PCore.getConstants();
  const PCoreVersion = PCore.getPCoreVersion();
  const { TODO } = pCoreConstants;
  const todo_headerText = 'To do';

  const {
    getPConnect: getPConnectOfFlowContainer,
    pageMessages,
    rootViewElement,
    getPConnectOfActiveContainerItem,
    assignmentNames,
    activeContainerItemID: itemKey
  } = props;

  const { displayOnlyFA } = useContext<any>(StoreContext);
  const pConnectOfFlowContainer = getPConnectOfFlowContainer();
  const isInitialized = isContainerInitialized(pConnectOfFlowContainer);
  const hasItems = isInitialized && hasContainerItems(pConnectOfFlowContainer);
  const getPConnect = getPConnectOfActiveContainerItem || getPConnectOfFlowContainer;
  const thePConn = getPConnect();
  const containerName = assignmentNames && assignmentNames.length > 0 ? assignmentNames[0] : '';
  // const [init, setInit] = useState(true);
  // const [fcState, setFCState] = useState({ hasError: false });

  const [todo_showTodo, setShowTodo] = useState(false);
  const [todo_caseInfoID, setCaseInfoID] = useState('');
  const [todo_showTodoList, setShowTodoList] = useState(false);
  const [todo_datasource, setTodoDatasource] = useState({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [todo_context, setTodoContext] = useState('');

  const [caseMessages, setCaseMessages] = useState('');
  const [bHasCaseMessages, setHasCaseMessages] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [checkSvg, setCheckSvg] = useState('');

  const [buildName, setBuildName] = useState('');
  const [bShowConfirm, setShowConfirm] = useState(false);
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Messages';

  const key = `${thePConn.getCaseInfo().getClassName()}!CASE!${thePConn.getCaseInfo().getName()}`.toUpperCase();
  const classes = useStyles();

  function getBuildName(): string {
    const ourPConn = getPConnect();

    // let { getPConnect, name } = this.pConn$.pConn;
    const context = ourPConn.getContextName();
    let viewContainerName = ourPConn.getContainerName();

    if (!viewContainerName) viewContainerName = '';
    return `${context.toUpperCase()}/${viewContainerName.toUpperCase()}`;
  }

  function getTodoVisibility() {
    const caseViewMode = getPConnect().getValue('context_data.caseViewMode', ''); // 2nd arg empty string until typedefs properly allow optional
    if (caseViewMode && caseViewMode === 'review') {
      return true;
    }
    return !(caseViewMode && caseViewMode === 'perform');
  }

  function initComponent() {
    const ourPConn = getPConnect();

    // debugging/investigation help
    // console.log(`${ourPConn.getComponentName()}: children update for main draw`);

    // const oData = ourPConn.getDataObject();

    // const activeActionLabel = "";
    // const child0_getPConnect = arNewChildren[0].getPConnect();

    // this.templateName$ = this.configProps$["template"];

    // debugger;
    setShowTodo(getTodoVisibility());

    ourPConn.isBoundToState();

    // debugger;
    setBuildName(getBuildName());
  }

  useEffect(() => {
    // from WC SDK connectedCallback (mount)
    initComponent();
  }, []);

  useEffect(() => {
    // @ts-ignore - Property 'getMetadata' is private and only accessible within class 'C11nEnv'
    if (isInitialized && pConnectOfFlowContainer.getMetadata().children && !hasItems) {
      // ensuring not to add container items, if container already has items
      // because during multi doc mode, we will have container items already in store
      addContainerItem(pConnectOfFlowContainer);
    }
  }, [isInitialized, hasItems]);

  function isCaseWideLocalAction() {
    const ourPConn = getPConnect();

    const actionID = ourPConn.getValue(pCoreConstants.CASE_INFO.ACTIVE_ACTION_ID, ''); // 2nd arg empty string until typedefs properly allow optional
    const caseActions = ourPConn.getValue(pCoreConstants.CASE_INFO.AVAILABLEACTIONS, ''); // 2nd arg empty string until typedefs properly allow optional
    let bCaseWideAction = false;
    if (caseActions && actionID) {
      const actionObj = caseActions.find(caseAction => caseAction.ID === actionID);
      if (actionObj) {
        bCaseWideAction = actionObj.type === 'Case';
      }
    }
    return bCaseWideAction;
  }

  function hasChildCaseAssignments() {
    const ourPConn = getPConnect();

    const childCases = ourPConn.getValue(pCoreConstants.CASE_INFO.CHILD_ASSIGNMENTS, ''); // 2nd arg empty string until typedefs properly allow optional
    // const allAssignments = [];
    return !!(childCases && childCases.length > 0);
  }

  function hasAssignments() {
    const ourPConn = getPConnect();

    let bHasAssignments = false;
    const assignmentsList: any[] = ourPConn.getValue(pCoreConstants.CASE_INFO.D_CASE_ASSIGNMENTS_RESULTS, ''); // 2nd arg empty string until typedefs properly allow optional
    const isEmbedded = window.location.href.includes('embedded');
    let bAssignmentsForThisOperator = false;
    // 8.7 includes assignments in Assignments List that may be assigned to
    //  a different operator. So, see if there are any assignments for
    //  the current operator
    if (PCoreVersion?.includes('8.7') || isEmbedded) {
      const thisOperator = PCore.getEnvironmentInfo().getOperatorIdentifier();
      for (const assignment of assignmentsList) {
        if (assignment.assigneeInfo.ID === thisOperator) {
          bAssignmentsForThisOperator = true;
        }
      }
    } else {
      bAssignmentsForThisOperator = true;
    }
    // Bail out if there isn't an assignmentsList
    if (!assignmentsList) {
      return bHasAssignments;
    }

    const bHasChildCaseAssignments = hasChildCaseAssignments();

    if (bAssignmentsForThisOperator || bHasChildCaseAssignments || isCaseWideLocalAction()) {
      bHasAssignments = true;
    }

    return bHasAssignments;
  }

  // From SDK-WC updateSelf - so do this in useEffect that's run only when the props change...
  useEffect(() => {
    setBuildName(getBuildName());

    // routingInfo was added as component prop in populateAdditionalProps
    // let routingInfo = this.getComponentProp("routingInfo");

    let loadingInfo: any;
    try {
      loadingInfo = thePConn.getLoadingStatus(''); // 1st arg empty string until typedefs properly allow optional
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.error(`${thePConn.getComponentName()}: loadingInfo catch block`);
    }

    // let configProps = this.thePConn.resolveConfigProps(this.thePConn.getConfigProps());

    if (!loadingInfo) {
      // turn off spinner
      // this.psService.sendMessage(false);
    }

    const caseViewMode = thePConn.getValue('context_data.caseViewMode', ''); // 2nd arg empty string until typedefs properly allow optional
    const { CASE_INFO: CASE_CONSTS } = pCoreConstants;
    if (caseViewMode && caseViewMode === 'review') {
      setTimeout(() => {
        // updated for 8.7 - 30-Mar-2022
        const todoAssignments = getToDoAssignments(thePConn);
        if (todoAssignments && todoAssignments.length > 0) {
          setCaseInfoID(thePConn.getValue(CASE_CONSTS.CASE_INFO_ID, '')); // 2nd arg empty string until typedefs properly allow optional
          setTodoDatasource({ source: todoAssignments });
        }
        setShowTodo(true);
        setShowTodoList(false);
      }, 100);
    } else if (caseViewMode && caseViewMode === 'perform') {
      // perform
      // debugger;
      setShowTodo(false);
    }

    // if have caseMessage show message and end
    const theCaseMessages = localizedVal(thePConn.getValue('caseMessages', ''), localeCategory); // 2nd arg empty string until typedefs properly allow optional

    // caseMessages's behavior has changed in 24.2, and hence it doesn't let Optional Action work.
    // Changing the below condition for now. Was: (theCaseMessages || !hasAssignments())
    if (!hasAssignments()) {
      // Temp fix for 8.7 change: confirmationNote no longer coming through in caseMessages$.
      // So, if we get here and caseMessages$ is empty, use default value in DX API response
      setCaseMessages(theCaseMessages || localizedVal('Thank you! The next step in this case has been routed appropriately.', localeCategory));
      setHasCaseMessages(true);
      setShowConfirm(true);

      // publish this "assignmentFinished" for mashup, need to get approved as a standard
      PCore.getPubSubUtils().publish('assignmentFinished');

      // debugger;
      setCheckSvg(Utils.getImageSrc('check', Utils.getSDKStaticConentUrl()));
    } else {
      // debugger;
      setHasCaseMessages(false);
      setShowConfirm(false);
    }
  }, [props]);

  const caseId = thePConn.getCaseSummary().content.pyID;
  const urgency = getPConnect().getCaseSummary().assignments ? getPConnect().getCaseSummary().assignments?.[0].urgency : '';
  const operatorInitials = Utils.getInitials(PCore.getEnvironmentInfo().getOperatorName() || '');

  const bShowBanner = showBanner(getPConnect);

  const displayPageMessages = () => {
    let hasBanner = false;
    const messages = pageMessages ? pageMessages.map(msg => localizedVal(msg.message, 'Messages')) : pageMessages;
    hasBanner = messages && messages.length > 0;
    return hasBanner && <AlertBanner id='flowContainerBanner' variant='urgent' messages={messages} />;
  };

  return (
    <div style={{ textAlign: 'left' }} id={buildName} className='psdk-flow-container-top'>
      {!bShowConfirm &&
        (!todo_showTodo ? (
          !displayOnlyFA ? (
            <Card className={`${classes.root} psdk-root`}>
              <CardHeader
                id='assignment-header'
                title={<Typography variant='h6'>{localizedVal(containerName, undefined, key)}</Typography>}
                subheader={`${localizedVal('Task in', 'Todo')} ${caseId} \u2022 ${localizedVal('Priority', 'Todo')} ${urgency}`}
                avatar={<Avatar className={`${classes.avatar} psdk-avatar`}>{operatorInitials}</Avatar>}
              />
              {displayPageMessages()}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Assignment getPConnect={getPConnect} itemKey={itemKey}>
                  {rootViewElement}
                </Assignment>
              </LocalizationProvider>
            </Card>
          ) : (
            <Card className={`${classes.root} psdk-root`}>
              <Typography variant='h6'>{localizedVal(containerName, undefined, key)}</Typography>
              {displayPageMessages()}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Assignment getPConnect={getPConnect} itemKey={itemKey}>
                  {rootViewElement}
                </Assignment>
              </LocalizationProvider>
            </Card>
          )
        ) : (
          <div>
            <ToDo
              key={Math.random()}
              getPConnect={getPConnect}
              caseInfoID={todo_caseInfoID}
              datasource={todo_datasource}
              showTodoList={todo_showTodoList}
              headerText={todo_headerText}
              type={TODO}
              context={todo_context}
              itemKey={itemKey}
              isConfirm
            />
          </div>
        ))}
      {bHasCaseMessages && (
        <div className={`${classes.alert} psdk-alert`}>
          <Alert severity='success'>{caseMessages}</Alert>
        </div>
      )}
      {bShowConfirm && bShowBanner && <div>{rootViewElement}</div>}
    </div>
  );
};

export default withSimpleViewContainerRenderer(FlowContainer);
