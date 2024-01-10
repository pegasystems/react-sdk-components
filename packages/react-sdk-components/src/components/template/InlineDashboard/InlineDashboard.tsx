import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import type { PConnProps } from '../../../types/PConnProps';

// InlineDashboard does NOT have getPConnect. So, no need to extend from PConnProps
interface InlineDashboardProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  children: any[],
  title: string,
  filterPosition?: string
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

export default function InlineDashboard(props: InlineDashboardProps) {
  const classes = useStyles();

  const { children, title, filterPosition } = props;

  const direction = filterPosition === 'inline-start' ? 'row-reverse' : 'row';
  return (
    <>
      <Typography variant='h4' className={classes.headerStyles}>
        {title}
      </Typography>

      {filterPosition === 'block-start' && (
        <Grid container spacing={2} direction='column-reverse' className={classes.containerStyles}>
          <Grid item xs={12} className={classes.colStyles}>
            {children[0]}
          </Grid>
          <Grid id="filters" item xs={12} className={classes.filterContainerStyles}>
            {children[1]}
          </Grid>
        </Grid>
      )}
      {filterPosition !== 'block-start' && (
        <Grid container spacing={2} direction={direction} className={classes.containerStyles}>
          <Grid item xs={9}>
            {children[0]}
          </Grid>
          <Grid id="filters" item xs={3} className={classes.inlineStyles}>
            {children[1]}
          </Grid>
        </Grid>
      )}
    </>
  );
}
