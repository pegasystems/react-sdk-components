import { CircularProgress, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import makeStyles from '@mui/styles/makeStyles';

// GenAIMessageProgress is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface GenAIMessageProgressProps {
  // If any, enter additional props that only exist on this component
  messages?: string[];
  completedSteps?: number;
}

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    border: `0.0625rem solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  },
  heading: {
    fontWeight: 600
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1)
  },
  visuallyHidden: {
    position: 'absolute',
    width: '0.0625rem',
    height: '0.0625rem',
    margin: '-0.0625rem',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0
  }
}));

export default function GenAIMessageProgress(props: GenAIMessageProgressProps) {
  const { messages, completedSteps } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  return (
    <div className={classes.container}>
      <Typography variant='body2' className={classes.heading} role='status'>
        {localizedVal('Working on the request...', localeCategory)}
      </Typography>

      {messages && messages.length > 0 && (
        <ul className={classes.steps}>
          {messages.map((message, idx) => {
            const isCompleted = completedSteps !== undefined ? idx < completedSteps : idx < messages.length - 1;

            return (
              <li key={message} className={classes.step}>
                {isCompleted ? <CheckIcon fontSize='small' color='success' aria-hidden /> : <CircularProgress size={16} aria-hidden />}
                <span className={classes.visuallyHidden}>
                  {isCompleted ? localizedVal('Completed', localeCategory) : localizedVal('In progress', localeCategory)}
                </span>
                <Typography variant='body2'>{message}</Typography>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
