import type { PropsWithChildren, ReactElement } from 'react';
import Grid2, { type GridSize } from '@mui/material/Grid2';
import makeStyles from '@mui/styles/makeStyles';
import type { PConnProps } from '../../../../types/PConnProps';

interface TwoColumnTabProps extends PConnProps {
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

export default function TwoColumnTab(props: PropsWithChildren<TwoColumnTabProps>) {
  const classes = useStyles();

  const { children, templateCol = '1fr 1fr' } = props;
  const childrenToRender = children as ReactElement[];

  if (childrenToRender.length !== 2) {
    console.error(`TwoColumn template sees more than 2 columns: ${childrenToRender.length}`);
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
    <Grid2 container spacing={1}>
      <Grid2 size={{ xs: 12, md: aSize }} className={classes.colStyles}>
        {childrenToRender[0]}
      </Grid2>
      <Grid2 size={{ xs: 12, md: bSize }} className={classes.colStyles}>
        {childrenToRender[1]}
      </Grid2>
    </Grid2>
  );
}
