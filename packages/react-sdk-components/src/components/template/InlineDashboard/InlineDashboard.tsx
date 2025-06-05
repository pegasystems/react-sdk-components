import { PropsWithChildren, ReactElement } from 'react';
import { Grid, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { PConnProps } from '../../../types/PConnProps';

interface InlineDashboardProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  title: string;
  filterPosition?: string;
}

const useStyles = makeStyles((/* theme */) => ({
  headerStyles: {
    fontWeight: 500,
    fontSize: '1.25rem'
  },
  containerStyles: {
    marginTop: '1rem',
    marginBottom: '1rem'
  },
  colStyles: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'baseline'
  },
  filterContainerStyles: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(7, 1fr);'
  },
  inlineStyles: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'baseline',
    marginTop: '1rem'
  }
}));

export default function InlineDashboard(props: PropsWithChildren<InlineDashboardProps>) {
  const classes = useStyles();

  const { children, title, filterPosition } = props;
  const childrenToRender = children as ReactElement[];

  const direction = filterPosition === 'inline-start' ? 'row-reverse' : 'row';
  return (
    <>
      <Typography variant='h4' className={classes.headerStyles}>
        {title}
      </Typography>

      {filterPosition === 'block-start' && (
        <Grid container spacing={2} direction='column-reverse' className={classes.containerStyles}>
          <Grid item xs={12} className={classes.colStyles}>
            {childrenToRender[0]}
          </Grid>
          <Grid id='filters' item xs={12} className={classes.filterContainerStyles}>
            {childrenToRender[1]}
          </Grid>
        </Grid>
      )}
      {filterPosition !== 'block-start' && (
        <Grid container spacing={2} direction={direction} className={classes.containerStyles}>
          <Grid item xs={9}>
            {childrenToRender[0]}
          </Grid>
          <Grid id='filters' item xs={3} className={classes.inlineStyles}>
            {childrenToRender[1]}
          </Grid>
        </Grid>
      )}
    </>
  );
}
