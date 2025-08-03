import { createElement } from 'react';
import Grid from '@mui/material/Grid';

import createPConnectComponent from '../../../../bridge/react_pconnect';
import LazyLoad from '../../../../bridge/LazyLoad';
import { PConnProps } from '../../../../types/PConnProps';

interface DetailsTwoColumnProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  showLabel: boolean;
  label: string;
  showHighlightedData: boolean;
}

export default function DetailsTwoColumn(props: DetailsTwoColumnProps) {
  const { label, showLabel = true, getPConnect, showHighlightedData = false } = props;

  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  // Set display mode prop and re-create the children so this part of the dom tree renders
  // in a readonly (display) mode instead of a editable
  getPConnect().setInheritedProp('displayMode', 'DISPLAY_ONLY');
  getPConnect().setInheritedProp('readOnly', true);
  const children = (getPConnect().getChildren() as any[]).map((configObject, index) =>
    createElement(createPConnectComponent(), {
      ...configObject,
      // eslint-disable-next-line react/no-array-index-key
      key: index.toString()
    })
  );

  // Set up highlighted data to pass in return if is set to show, need raw metadata to pass to createComponent
  let highlightedDataArr = [];
  if (showHighlightedData) {
    const { highlightedData = [] } = (getPConnect().getRawMetadata() as any).config;
    highlightedDataArr = highlightedData.map(field => {
      field.config.displayMode = 'STACKED_LARGE_VAL';

      // Mark as status display when using pyStatusWork
      if (field.config.value === '@P .pyStatusWork') {
        field.type = 'TextInput';
        field.config.displayAsStatus = true;
      }

      return getPConnect().createComponent(field, '', 0, {}); // 2nd, 3rd, and 4th args empty string/object/null until typedef marked correctly as optional
    });
  }

  return (
    <LazyLoad componentName='FieldGroup' name={propsToUse.showLabel ? propsToUse.label : ''}>
      {showHighlightedData && highlightedDataArr.length > 0 && (
        <Grid container spacing={1} style={{ padding: '0 0 1em' }}>
          {highlightedDataArr.map((child, i) => (
            <Grid item xs={6} key={`hf-${i + 1}`}>
              {child}
            </Grid>
          ))}
        </Grid>
      )}
      <Grid container spacing={1}>
        {children.map((child, i) => (
          <Grid item xs={6} key={`r-${i + 1}`}>
            {child}
          </Grid>
        ))}
      </Grid>
    </LazyLoad>
  );
}
