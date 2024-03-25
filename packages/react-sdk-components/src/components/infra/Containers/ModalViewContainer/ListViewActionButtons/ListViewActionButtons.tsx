import { useState } from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { PConnProps } from '../../../../../types/PConnProps';

const useStyles = makeStyles((/* theme */) => ({
  button: {
    width: '50%',
    margin: '4px'
  },
  div: {
    display: 'flex',
    margin: '8px'
  }
}));

interface ListViewActionButtonsProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  context: string;
  closeActionsDialog: Function;
}

function ListViewActionButtons(props: ListViewActionButtonsProps) {
  const { getPConnect, context, closeActionsDialog } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Data Object';
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <div className={classes.div}>
      <Button
        className={classes.button}
        variant='contained'
        color='secondary'
        onClick={() => {
          getPConnect().getActionsApi().cancelDataObject(context);
        }}
      >
        {localizedVal('Cancel', localeCategory)}
      </Button>
      <Button
        className={classes.button}
        variant='contained'
        color='primary'
        disabled={isDisabled}
        onClick={() => {
          setIsDisabled(true);
          getPConnect()
            .getActionsApi()
            .submitEmbeddedDataModal(context)
            .then(() => {})
            .finally(() => {
              setIsDisabled(false);
              closeActionsDialog();
            });
        }}
      >
        {localizedVal('Submit', localeCategory)}
      </Button>
    </div>
  );
}

export default ListViewActionButtons;
