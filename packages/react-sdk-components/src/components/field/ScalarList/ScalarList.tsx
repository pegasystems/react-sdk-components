/* eslint-disable react/no-array-index-key */
import React from 'react';
import FieldValueList from '../../designSystemExtension/FieldValueList';
import { PConnProps } from 'packages/react-sdk-components/src/types/PConnProps';

// ScalarListProps can't extend PConnFieldProps because its 'value' has a different type
interface ScalarListProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  displayInModal: boolean,
  hideLabel: boolean,
  value: Array<any>,
  componentType: string,
  label: string,
  displayMode: string
}

function CommaSeparatedList(props) {
  const { items } = props;

  return (
    <ul style={{ padding: '0', margin: '0' }}>
      {items.map((value, index) => {
        return <span key={index}>{value}</span>;
      })}
    </ul>
  );
}

export default function ScalarList(props: ScalarListProps) {
  const {
    label,
    getPConnect,
    componentType,
    value: scalarValues,
    displayMode,
    hideLabel,
    ...restProps
  } = props;

  const items = scalarValues?.map(scalarValue => {
    return getPConnect().createComponent({
      type: componentType,
      config: {
        value: scalarValue,
        displayMode: 'LABELS_LEFT',
        label,
        ...restProps,
        readOnly: 'true'
      }
    },
    '', '', {}); // 2nd, 3rd, and 4th args empty string/object/null until typedef marked correctly as optional
  });

  if (['LABELS_LEFT', 'STACKED_LARGE_VAL', 'DISPLAY_ONLY'].includes(displayMode)) {
    const displayComp = (
      <div>
        <CommaSeparatedList items={items} />
      </div>
    );
    return displayComp;
  }

  const displayComp = <CommaSeparatedList items={items} />;

  return <FieldValueList name={hideLabel ? '' : label} value={displayComp} variant='stacked' />;
}
