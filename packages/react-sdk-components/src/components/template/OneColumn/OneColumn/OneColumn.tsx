import type { PropsWithChildren, ReactElement } from 'react';
import { Grid } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import type { PConnProps } from '../../../../types/PConnProps';

interface OneColumnProps extends PConnProps {
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
