import { PropsWithChildren } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Pulse is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface PulseProps {
  // If any, enter additional props that only exist on this component
}

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    borderLeft: '6px solid',
    borderLeftColor: theme.palette.primary.light
  }
}));

export default function Pulse(props: PropsWithChildren<PulseProps>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children } = props;
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader title={<Typography variant='h6'>Pulse</Typography>} />
      <CardContent>
        <Typography>Pulse</Typography>
      </CardContent>
    </Card>
  );
}
