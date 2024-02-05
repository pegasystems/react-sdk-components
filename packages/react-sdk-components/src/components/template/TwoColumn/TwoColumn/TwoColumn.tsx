import { Grid, GridSize } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Children, PropsWithChildren, useMemo } from 'react';

// TwoColumn does NOT have getPConnect. So, no need to extend from PConnProps
interface TwoColumnProps {
  // If any, enter additional props that only exist on this component
  templateCol?: string;
}

const useStyles = makeStyles(() => ({
  colStyles: {
    display: 'grid',
    gap: '1rem',
    alignContent: 'baseline'
  }
}));

export default function TwoColumn(props: PropsWithChildren<TwoColumnProps>) {
  const classes = useStyles();

  const { children, templateCol = '1fr 1fr' } = props;
  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  if (childArray.length !== 2) {
    // eslint-disable-next-line no-console
    console.error(`TwoColumn template sees more than 2 columns: ${childArray.length}`);
  }

  // Calculate the size
  //  Default to assume the 2 columns are evenly split. However, override if templateCol
  //  (example value: "1fr 1fr")
  let aSize: GridSize = 6;
  let bSize: GridSize = 6;

  const colAArray = templateCol
    .replaceAll(/[a-z]+/g, '')
    .split(/\s/)
    .map(itm => Number(itm));
  const totalCols = colAArray.reduce((v, itm) => itm + v, 0);
  const ratio = 12 / totalCols;
  aSize = (ratio * colAArray[0]) as GridSize;
  bSize = (ratio * colAArray[1]) as GridSize;

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={aSize} className={classes.colStyles}>
        {childArray[0]}
      </Grid>
      <Grid item xs={12} md={bSize} className={classes.colStyles}>
        {childArray[1]}
      </Grid>
    </Grid>
  );
}
