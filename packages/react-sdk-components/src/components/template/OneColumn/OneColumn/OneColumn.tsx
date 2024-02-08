import { PropsWithChildren, ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// OneColumn does NOT have getPConnect. So, no need to extend from PConnProps
interface OneColumnProps {
  // If any, enter additional props that only exist on this component
}

const useStyles = makeStyles((/* theme */) => ({
  colStyles: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'baseline'
  }
}));

export default function OneColumn(props: PropsWithChildren<OneColumnProps>) {
  const classes = useStyles();

  const { children } = props;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} className={classes.colStyles}>
        {(children as ReactElement[]).map(child => {
          return child;
        })}
      </Grid>
    </Grid>
  );
}
