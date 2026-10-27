import { Button, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import type { InitialSuggestedMessageProps } from '../GenAICoachContent/GenAICoach.types';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: theme.spacing(1, 1.5),
    textAlign: 'start',
    textTransform: 'none'
  },
  text: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  }
}));

// InitialSuggestedMessage is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function InitialSuggestedMessage(props: InitialSuggestedMessageProps) {
  const { id, message, testId, onSend } = props;
  const classes = useStyles();

  return (
    <Button
      variant='outlined'
      color='inherit'
      className={classes.root}
      onClick={() => {
        onSend({ id, message });
      }}
      data-testid={testId}
    >
      <Typography variant='body2' className={classes.text}>
        {message}
      </Typography>
    </Button>
  );
}
