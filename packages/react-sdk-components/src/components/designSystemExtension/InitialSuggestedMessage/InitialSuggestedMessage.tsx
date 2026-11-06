import { Button, Typography, getContrastRatio, useTheme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import type { InitialSuggestedMessageProps } from '../GenAICoachContent/GenAICoach.types';

// WCAG AA contrast for normal text.
const minTextContrast = 4.5;

const useStyles = makeStyles(theme => ({
  // The Cosmos default (secondary) button: outlined in the primary color, the label centered while it fits on one line.
  root: {
    height: '100%',
    width: '100%',
    alignItems: 'flex-start',
    padding: theme.spacing(1, 2),
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
  const theme = useTheme();
  // As Cosmos keeps its buttons readable in dark themes, the label uses the text color where the primary color is too faint.
  const color = getContrastRatio(theme.palette.primary.main, theme.palette.background.paper) >= minTextContrast ? 'primary' : 'inherit';

  return (
    <Button
      variant='outlined'
      color={color}
      className={classes.root}
      onClick={() => {
        onSend({ id, message: message ?? '' });
      }}
      data-testid={testId}
    >
      <Typography variant='body2' className={classes.text}>
        {message}
      </Typography>
    </Button>
  );
}
