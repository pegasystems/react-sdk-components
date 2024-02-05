import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Children, PropsWithChildren, useMemo } from 'react';

// InlineDashboard does NOT have getPConnect. So, no need to extend from PConnProps
interface InlineDashboardProps {
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
  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  const direction = filterPosition === 'inline-start' ? 'row-reverse' : 'row';
  return (
    <>
      <Typography variant='h4' className={classes.headerStyles}>
        {title}
      </Typography>

      {filterPosition === 'block-start' && (
        <Grid container spacing={2} direction='column-reverse' className={classes.containerStyles}>
          <Grid item xs={12} className={classes.colStyles}>
            {childArray[0]}
          </Grid>
          <Grid id='filters' item xs={12} className={classes.filterContainerStyles}>
            {childArray[1]}
          </Grid>
        </Grid>
      )}
      {filterPosition !== 'block-start' && (
        <Grid container spacing={2} direction={direction} className={classes.containerStyles}>
          <Grid item xs={9}>
            {childArray[0]}
          </Grid>
          <Grid id='filters' item xs={3} className={classes.inlineStyles}>
            {childArray[1]}
          </Grid>
        </Grid>
      )}
    </>
  );
}
