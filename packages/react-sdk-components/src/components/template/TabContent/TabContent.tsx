import { createElement, useLayoutEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import createPConnectComponent from '../../../bridge/react_pconnect';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface TabContentProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  layout?: 'one-column' | 'two-column' | 'narrow-wide' | 'wide-narrow' | 'dynamic';
  label?: string;
  showLabel?: boolean;
}

// The regions are shown side by side only when the template itself is at least this wide.
const multiColumnMinWidthPx = 620;

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gap: theme.spacing(2)
  },
  region: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: theme.spacing(1),
    minWidth: 0
  },
  emptyState: {
    padding: theme.spacing(2),
    textAlign: 'center'
  }
}));

/**
 * Port of the Constellation `TabContent` template, which App Studio uses for the views of the tabs it creates
 * (for example a case page tab with an agent). The tab container draws the card, as for the other tab templates.
 */
export default function TabContent(props: TabContentProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldGroup = getComponentFromMap('FieldGroup');

  const { getPConnect, layout = 'one-column', label, showLabel } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'TabContent';

  const containerRef = useRef<HTMLDivElement>(null);
  const [wrapTab, setWrapTab] = useState(false);

  // Set display mode prop and re-create the children so this part of the dom tree renders
  // in a readonly (display) mode instead of a editable
  getPConnect().setInheritedProp('displayMode', 'DISPLAY_ONLY');
  getPConnect().setInheritedProp('readOnly', true);

  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(entries => {
      setWrapTab(entries.some(({ target, contentRect }) => target === container && contentRect.width >= multiColumnMinWidthPx));
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const regionConfigs = (getPConnect().getChildren() as any[]) ?? [];
  // The dynamic (drag and resize) layout is not ported: its region A is shown in one column.
  const regions = (layout === 'dynamic' ? regionConfigs.slice(0, 1) : regionConfigs).map((regionConfig, index) =>
    createElement(createPConnectComponent(), {
      ...regionConfig,
      key: index.toString()
    })
  );

  let cols = `repeat(${regions.length}, minmax(0, 1fr))`;
  if (layout === 'narrow-wide') {
    cols = 'minmax(0, 1fr) minmax(0, 2fr)';
  } else if (layout === 'wide-narrow') {
    cols = 'minmax(0, 2fr) minmax(0, 1fr)';
  }

  const noChildren = regionConfigs.every(regionConfig => regionConfig.getPConnect().getChildren()?.length === 0);
  if (noChildren) {
    return (
      <Typography variant='body2' color='text.secondary' className={classes.emptyState}>
        {localizedVal('No items', localeCategory)}
      </Typography>
    );
  }

  const content = (
    <Box
      ref={containerRef}
      className={classes.grid}
      sx={{
        gridTemplateColumns: wrapTab ? cols : 'minmax(0, 1fr)',
        gridTemplateRows: wrapTab ? '1fr' : undefined,
        gridAutoRows: wrapTab ? undefined : 'max-content'
      }}
    >
      {regions.map((region, i) => (
        <Box key={`region-${i + 1}`} className={classes.region}>
          {region}
        </Box>
      ))}
    </Box>
  );

  if (propsToUse.showLabel) {
    return <FieldGroup name={propsToUse.label}>{content}</FieldGroup>;
  }

  return content;
}
