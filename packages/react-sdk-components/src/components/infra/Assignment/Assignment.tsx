import React, { useState, useEffect } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

// import type { PConnProps } from '../../../types/PConnProps';

// Can't use AssignmentProps until the following are NOT private
//  getCaseInfo().isAssignmentInCreateStage()
//  getCaseInfo().isLocalAction()
// interface AssignmentProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   children: Array<any>,
//   itemKey: string,
//   isInModal: boolean,
//   banners: Array<any>
//   // eslint-disable-next-line react/no-unused-prop-types
//   actionButtons: Array<any>,
// }

export default function Assignment(props /* : AssignmentProps */) {
  // Get emitted components from map (so we can get any override that may exist)
  const AssignmentCard = getComponentFromMap('AssignmentCard');
  const MultiStep = getComponentFromMap('MultiStep');

  const { getPConnect, children, itemKey = '', isInModal = false, banners = [] } = props;
  const thePConn = getPConnect();

  const [bHasNavigation, setHasNavigation] = useState(false);
  const [actionButtons, setActionButtons] = useState([]);
  const [bIsVertical, setIsVertical] = useState(false);
  const [arCurrentStepIndicies, setArCurrentStepIndicies] = useState<Array<any>>([]);
  const [arNavigationSteps, setArNavigationSteps] = useState<Array<any>>([]);

  const actionsAPI = thePConn.getActionsApi();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Assignment';
  const localeReference = `${getPConnect().getCaseInfo().getClassName()}!CASE!${getPConnect().getCaseInfo().getName()}`.toUpperCase();

  // store off bound functions to above pointers
  const finishAssignment = actionsAPI.finishAssignment.bind(actionsAPI);
  const navigateToStep = actionsAPI.navigateToStep.bind(actionsAPI);
  const cancelAssignment = actionsAPI.cancelAssignment.bind(actionsAPI);
  const saveAssignment = actionsAPI.saveAssignment?.bind(actionsAPI);
  const cancelCreateStageAssignment = actionsAPI.cancelCreateStageAssignment.bind(actionsAPI);
  // const showPage = actionsAPI.showPage.bind(actionsAPI);

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  function findCurrentIndicies(arStepperSteps: Array<any>, arIndicies: Array<number>, depth: number): Array<number> {
    let count = 0;
    arStepperSteps.forEach((step) => {
      if (step.visited_status === 'current') {
        arIndicies[depth] = count;

        // add in
        step['step_status'] = '';
      } else if (step.visited_status === 'success') {
        count += 1;
        step.step_status = 'completed';
      } else {
        count += 1;
        step.step_status = '';
      }

      if (step.steps) {
        arIndicies = findCurrentIndicies(step.steps, arIndicies, depth + 1);
      }
    });

    return arIndicies;
  }

  useEffect(() => {
    if (children && children.length > 0) {
      // debugger;

      const oWorkItem = children[0].props.getPConnect();
      const oWorkData = oWorkItem.getDataObject();
      const oData = thePConn.getDataObject(''); // 1st arg empty string until typedefs allow it to be optional

      if (oWorkData?.caseInfo && oWorkData.caseInfo.assignments !== null) {
        const oCaseInfo = oData['caseInfo'];

        if (oCaseInfo && oCaseInfo.actionButtons) {
          setActionButtons(oCaseInfo.actionButtons);
        }

        if (oCaseInfo?.navigation /* was oCaseInfo.navigation != null */) {
          setHasNavigation(true);

          if (
            (oCaseInfo.navigation.template && oCaseInfo.navigation.template.toLowerCase() === 'standard') ||
            oCaseInfo?.navigation?.steps?.length === 1
          ) {
            setHasNavigation(false);
          } else if (oCaseInfo.navigation.template && oCaseInfo.navigation.template.toLowerCase() === 'vertical') {
            setIsVertical(true);
          } else {
            setIsVertical(false);
          }
          const steps = JSON.parse(JSON.stringify(oCaseInfo?.navigation?.steps));
          steps.forEach((step) => {
            if (step.name) {
              step.name = PCore.getLocaleUtils().getLocaleValue(step.name, undefined, localeReference);
            }
          });
          setArNavigationSteps(steps);
          setArCurrentStepIndicies(findCurrentIndicies(arNavigationSteps, arCurrentStepIndicies, 0));
        }
      }
    }
  }, [children]);

  function showToast(message: string) {
    const theMessage = `Assignment: ${message}`;
    // eslint-disable-next-line no-console
    console.error(theMessage);
    setSnackbarMessage(message);
    setShowSnackbar(true);
  }

  function handleSnackbarClose(event: React.SyntheticEvent | React.MouseEvent, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  }

  function onSaveActionSuccess(data) {
    actionsAPI.cancelAssignment(itemKey).then(() => {
      PCore.getPubSubUtils().publish(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.CREATE_STAGE_SAVED, data);
    });
  }

  function buttonPress(sAction: string, sButtonType: string) {
    if (sButtonType === 'secondary') {
      switch (sAction) {
        case 'navigateToStep': {
          const navigatePromise = navigateToStep('previous', itemKey);

          navigatePromise
            .then(() => {})
            .catch(() => {
              showToast(`${localizedVal('Navigation failed!', localeCategory)}`);
            });

          break;
        }

        case 'saveAssignment': {
          const caseID = thePConn.getCaseInfo().getKey();
          const assignmentID = thePConn.getCaseInfo().getAssignmentID();
          const savePromise = saveAssignment(itemKey);

          savePromise
            .then(() => {
              const caseType = thePConn.getCaseInfo().c11nEnv.getValue(PCore.getConstants().CASE_INFO.CASE_TYPE_ID);
              onSaveActionSuccess({ caseType, caseID, assignmentID });
            })
            .catch(() => {
              showToast(`${localizedVal('Save failed', localeCategory)}`);
            });

          break;
        }

        case 'cancelAssignment': {
          // check if create stage (modal)
          const { PUB_SUB_EVENTS } = PCore.getConstants();
          const { publish } = PCore.getPubSubUtils();
          const isAssignmentInCreateStage = thePConn.getCaseInfo().isAssignmentInCreateStage();
          const isLocalAction =
            thePConn.getCaseInfo().isLocalAction() ||
            (PCore.getConstants().CASE_INFO.IS_LOCAL_ACTION && getPConnect().getValue(PCore.getConstants().CASE_INFO.IS_LOCAL_ACTION, '')); // 2nd arg empty string until typedefs allow it to be optional
          if (isAssignmentInCreateStage && isInModal && !isLocalAction) {
            const cancelPromise = cancelCreateStageAssignment(itemKey);

            cancelPromise
              .then((data) => {
                publish(PUB_SUB_EVENTS.EVENT_CANCEL, data);
              })
              .catch(() => {
                showToast(`${localizedVal('Cancel failed!', localeCategory)}`);
              });
          } else {
            const cancelPromise = cancelAssignment(itemKey);

            cancelPromise
              .then((data) => {
                publish(PUB_SUB_EVENTS.EVENT_CANCEL, data);
              })
              .catch(() => {
                showToast(`${localizedVal('Cancel failed!', localeCategory)}`);
              });
          }
          break;
        }

        default:
          break;
      }
    } else if (sButtonType === 'primary') {
      // eslint-disable-next-line sonarjs/no-small-switch
      switch (sAction) {
        case 'finishAssignment': {
          const finishPromise = finishAssignment(itemKey);

          finishPromise
            .then(() => {})
            .catch(() => {
              showToast(`${localizedVal('Submit failed!', localeCategory)}`);
            });

          break;
        }

        default:
          break;
      }
    }
  }

  function getRefreshProps(refreshConditions) {
    // refreshConditions cuurently supports only "Changes" event
    if (!refreshConditions) {
      return [];
    }
    return refreshConditions.filter((item) => item.event && item.event === 'Changes').map((item) => [item.field, item.field?.substring(1)]) || [];
  }

  // expected format of refreshConditions : [{field: ".Name", event: "Changes"}]
  const refreshConditions = thePConn.getCaseInfo()?.getActionRefreshConditions();
  const context = thePConn.getContextName();
  const pageReference = thePConn.getPageReference();

  // refresh api de-registration
  PCore.getRefreshManager().deRegisterForRefresh(context);

  // refresh api registration
  const refreshProps = getRefreshProps(refreshConditions);
  const caseKey = thePConn.getCaseInfo().getKey();
  const refreshOptions = { autoDetectRefresh: true, preserveClientChanges: false };
  if (refreshProps.length > 0) {
    refreshProps.forEach((prop) => {
      PCore.getRefreshManager().registerForRefresh(
        'PROP_CHANGE',
        thePConn.getActionsApi().refreshCaseView.bind(thePConn.getActionsApi(), caseKey, null, pageReference, {
          ...refreshOptions,
          refreshFor: prop[0]
        }),
        `${pageReference}.${prop[1]}`,
        `${context}/${pageReference}`,
        context
      );
    });
  }

  return (
    <div id="Assignment">
      {banners}
      {bHasNavigation ? (
        <React.Fragment>
          <MultiStep
            getPConnect={getPConnect}
            itemKey={itemKey}
            actionButtons={actionButtons}
            onButtonPress={buttonPress}
            bIsVertical={bIsVertical}
            arCurrentStepIndicies={arCurrentStepIndicies}
            arNavigationSteps={arNavigationSteps}
          >
            {children}
          </MultiStep>
          <Snackbar
            open={showSnackbar}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            message={snackbarMessage}
            action={
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <AssignmentCard getPConnect={getPConnect} itemKey={itemKey} actionButtons={actionButtons} onButtonPress={buttonPress}>
            {children}
          </AssignmentCard>
          <Snackbar
            open={showSnackbar}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            message={snackbarMessage}
            action={
              <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          />
        </React.Fragment>
      )}
    </div>
  );
}

// From WC SDK
// const aHtml = html`
// ${this.bHasNavigation?
//   html`
//     <div class="psdk-stepper">
//     <multi-step-component .pConn=${this.pConn} .arChildren=${this.arChildren} itemKey=${this.itemKey}
//         .arMainButtons=${this.arMainButtons} .arSecondaryButtons=${this.arSecondaryButtons}
//         .bIsVertical=${this.bIsVertical} .arCurrentStepIndicies=${this.arCurrentStepIndicies}
//         .arNavigationSteps=${this.arNavigationSteps}
//         @MultiStepActionButtonClick="${this._onActionButtonClick}">
//     </multi-step-component>
//     <lit-toast></lit-toast>
//     </div>`
//     :
//   html`
//     <div>
//         <assignment-card-component .pConn=${this.pConn} .arChildren=${this.arChildren} itemKey=${this.itemKey}
//           .arMainButtons=${this.arMainButtons} .arSecondaryButtons=${this.arSecondaryButtons}
//           @AssignmentActionButtonClick="${this._onActionButtonClick}">
//         </assignment-card-component>
//         <lit-toast></lit-toast>
//     </div>`}
// `;
