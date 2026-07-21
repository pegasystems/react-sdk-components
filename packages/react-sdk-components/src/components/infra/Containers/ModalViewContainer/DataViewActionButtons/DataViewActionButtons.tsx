import { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Button from '@mui/material/Button';
import { Grid2, Divider } from '@mui/material';
import type { PConnProps } from '../../../../../types/PConnProps';

function getActionLabel(action: string, constants: { RESOURCE_STATUS: { UPDATE?: unknown; CREATE?: unknown; OPEN_FLOW_ACTION?: unknown } }) {
  switch (action) {
    case constants.RESOURCE_STATUS.UPDATE:
      return 'Update';
    case constants.RESOURCE_STATUS.CREATE:
      return 'Submit';
    case constants.RESOURCE_STATUS.OPEN_FLOW_ACTION:
      return 'Submit';
    default:
      return 'Submit';
  }
}

interface DataViewActionButtonsProps extends PConnProps {
  context: string;
  classId: string;
  dataObjectAction: string;
  dataRecordKeys: string;
  actionID: string;
  closeActionsDialog: () => void;
}

const useStyles = makeStyles(theme => ({
  divider: {
    marginTop: '10px',
    marginBottom: '10px'
  },
  actionButtonsArea: {
    padding: '8px 24px 20px 24px'
  },
  secondaryButton: {
    backgroundColor: (theme as any).actionButtons.secondary.backgroundColor,
    color: (theme as any).actionButtons.secondary.color
  },
  primaryButton: {
    backgroundColor: (theme as any).actionButtons.primary.backgroundColor,
    color: (theme as any).actionButtons.primary.color
  }
}));

export default function DataViewActionButtons(props: DataViewActionButtonsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { getPConnect, context, classId, dataObjectAction, dataRecordKeys, actionID, closeActionsDialog } = props;

  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Data Object';
  const actionsAPI = getPConnect().getActionsApi();
  const constants = PCore.getConstants();
  const [isLoading, setIsLoading] = useState(false);

  const actionName = localizedVal(getActionLabel(constants.RESOURCE_STATUS[dataObjectAction], constants), localeCategory);

  function handleCancel() {
    actionsAPI.cancelDataObject(context);
  }

  function handleSubmitAction() {
    setIsLoading(true);
    if (constants.RESOURCE_STATUS[dataObjectAction] === constants.RESOURCE_STATUS.CREATE) {
      actionsAPI
        .createDataObject(context)
        .then(data => {
          PCore.getPubSubUtils().publish(constants.PUB_SUB_EVENTS.DATA_EVENTS.DATA_OBJECT_CREATED, {
            classId,
            data
          });
        })
        .catch(() => {
          // Error messages are handled by the infrastructure via httpMessages/pageMessages
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (constants.RESOURCE_STATUS[dataObjectAction] === constants.RESOURCE_STATUS.UPDATE) {
      actionsAPI
        .updateDataObject(context, JSON.parse(dataRecordKeys))
        .then(() => {
          PCore.getPubSubUtils().publish(constants.PUB_SUB_EVENTS.DATA_EVENTS.DATA_OBJECT_UPDATED, {
            classId
          });
        })
        .catch(() => {
          // Error messages are handled by the infrastructure via httpMessages/pageMessages
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (constants.RESOURCE_STATUS[dataObjectAction] === constants.RESOURCE_STATUS.OPEN_FLOW_ACTION) {
      actionsAPI
        .submitDataObjectAction(context, JSON.parse(dataRecordKeys), actionID)
        .then(() => {
          PCore.getPubSubUtils().publish(constants.PUB_SUB_EVENTS.DATA_EVENTS.DATA_OBJECT_UPDATED, {
            classId,
            actionID
          });
        })
        .catch(() => {
          // Error messages are handled by the infrastructure via httpMessages/pageMessages
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }

  return (
    <div className={classes.actionButtonsArea}>
      <Divider className={classes.divider} />
      <Grid2 container spacing={4} justifyContent='space-between'>
        <Grid2>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button className={classes.secondaryButton} color='secondary' variant='contained' disabled={isLoading} onClick={handleCancel}>
                {localizedVal('Cancel', localeCategory)}
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
        <Grid2>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button className={classes.primaryButton} color='primary' variant='contained' disabled={isLoading} onClick={handleSubmitAction}>
                {actionName}
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
    </div>
  );
}
