import makeStyles from '@mui/styles/makeStyles';
import Button from '@mui/material/Button';
import { Grid2, Divider } from '@mui/material';

// ActionButtons does NOT have getPConnect. So, no need to extend from PConnProps
interface ActionButtonsProps {
  // If any, enter additional props that only exist on this component
  arMainButtons?: any[];
  arSecondaryButtons?: any[];
  onButtonPress: any;
}

const useStyles = makeStyles(theme => ({
  divider: {
    marginTop: '10px',
    marginBottom: '10px'
  },
  secondaryButton: {
    backgroundColor: theme.actionButtons.secondary.backgroundColor,
    color: theme.actionButtons.secondary.color
  },
  primaryButton: {
    backgroundColor: theme.actionButtons.primary.backgroundColor,
    color: theme.actionButtons.primary.color
  }
}));

export default function ActionButtons(props: ActionButtonsProps) {
  const { arMainButtons = [], arSecondaryButtons = [], onButtonPress } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Assignment';

  function _onButtonPress(sAction: string, sButtonType: string) {
    onButtonPress(sAction, sButtonType);
  }

  return (
    <>
      <Divider className={classes.divider} />
      <Grid2 container spacing={4} justifyContent='space-between'>
        <Grid2>
          <Grid2 container spacing={1}>
            {arSecondaryButtons.map(sButton => (
              <Grid2 key={sButton.name}>
                <Button
                  className={classes.secondaryButton}
                  color='secondary'
                  variant='contained'
                  onClick={() => {
                    _onButtonPress(sButton.jsAction, 'secondary');
                  }}
                >
                  {localizedVal(sButton.name, localeCategory)}
                </Button>
              </Grid2>
            ))}
          </Grid2>
        </Grid2>
        <Grid2>
          <Grid2 container spacing={1}>
            {arMainButtons.map(mButton => (
              <Grid2 key={mButton.name}>
                <Button
                  className={classes.primaryButton}
                  color='primary'
                  variant='contained'
                  onClick={() => {
                    _onButtonPress(mButton.jsAction, 'primary');
                  }}
                >
                  {localizedVal(mButton.name, localeCategory)}
                </Button>
              </Grid2>
            ))}
          </Grid2>
        </Grid2>
      </Grid2>
    </>
  );
}
