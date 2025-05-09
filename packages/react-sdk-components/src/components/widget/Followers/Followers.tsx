import type { PropsWithChildren } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import type { PConnProps } from '../../../types/PConnProps';

interface FollowersProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

const useStyles = makeStyles(theme => ({
  root: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
    // borderLeft: "6px solid",
    // borderLeftColor: green[300]
  }
}));

export default function Followers(props: PropsWithChildren<FollowersProps>) {
  const componentName = 'Followers';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children } = props;
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader
        title={
          <Typography variant='h6' component='div'>
            {componentName} - <em>unsupported</em>
          </Typography>
        }
      />
      <CardContent>
        <Typography>{componentName} content</Typography>
      </CardContent>
    </Card>
  );
}
