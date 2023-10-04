import React, { createElement } from 'react';
import Grid from '@material-ui/core/Grid';
import { GridSize } from '@material-ui/core/Grid';
import createPConnectComponent from '../../../../bridge/react_pconnect';
import FieldGroup from '../../../designSystemExtension/FieldGroup';
// import type { PConnProps } from '../../../../types/PConnProps';

// Can't use PConnProps until createComponent types are ok
// interface WideNarrowDetailsProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   showLabel?: boolean,
//   label?: string,
//   showHighlightedData?: boolean
// }

const COLUMN_WIDTHS = [8, 4];

export default function WideNarrowDetails(props /* : WideNarrowDetailsProps */) {
  const { label, showLabel = true, getPConnect, showHighlightedData = false } = props;

  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  // Set display mode prop and re-create the children so this part of the dom tree renders
  // in a readonly (display) mode instead of a editable
  getPConnect().setInheritedProp('displayMode', 'LABELS_LEFT');
  getPConnect().setInheritedProp('readOnly', true);
  const children = getPConnect()
    .getChildren()
    ?.map((configObject, index) => {
      let theConfigObject: object = configObject;
      if (!theConfigObject) {
        theConfigObject = {}
      }

      return createElement(createPConnectComponent(), {
        ...theConfigObject,
        // eslint-disable-next-line react/no-array-index-key
        key: index.toString()
      });
    });

  // Set up highlighted data to pass in return if is set to show, need raw metadata to pass to createComponent
  let highlightedDataArr = [];
  if (showHighlightedData) {
    const { highlightedData = [] } = getPConnect().getRawMetadata().config;
    highlightedDataArr = highlightedData.map(field => {
      field.config.displayMode = 'STACKED_LARGE_VAL';

      // Mark as status display when using pyStatusWork
      if (field.config.value === '@P .pyStatusWork') {
        field.type = 'TextInput';
        field.config.displayAsStatus = true;
      }

      return getPConnect().createComponent(field);
    });
  }

  let theName = '';
  if (propsToUse?.showLabel && propsToUse.label ) {
    theName = propsToUse.label;
  }

  return (
    <FieldGroup name={theName}>
      {showHighlightedData && highlightedDataArr.length > 0 && (
        <Grid container spacing={1} style={{ padding: '0 0 1em' }}>
          {highlightedDataArr.map((child, i) => (
            <Grid item xs={COLUMN_WIDTHS[i] as GridSize} key={`hf-${i + 1}`}>
              {child}
            </Grid>
          ))}
        </Grid>
      )}
      <Grid container spacing={1}>
        {children?.map((child, i) => (
          <Grid item xs={COLUMN_WIDTHS[i] as GridSize} key={`r-${i + 1}`}>
            {child}
          </Grid>
        ))}
      </Grid>
    </FieldGroup>
  );
}
