/* eslint-disable react/no-array-index-key */
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnProps } from '../../../types/PConnProps';

// ScalarListProps can't extend PConnFieldProps because its 'value' has a different type
interface ScalarListProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  displayInModal: boolean;
  hideLabel: boolean;
  value: any[];
  componentType: string;
  label: string;
  displayMode: string;
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
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const { label, getPConnect, componentType, value: scalarValues, displayMode, hideLabel, ...restProps } = props;

  const items = scalarValues?.map(scalarValue => {
    return getPConnect().createComponent(
      {
        type: componentType,
        config: {
          // @ts-ignore - Type '{ readOnly: true; displayInModal: boolean; value: any; displayMode: string; label: string; }' is not assignable to type 'ComponentMetadataConfig'.
          value: scalarValue,
          displayMode: 'DISPLAY_ONLY',
          label,
          ...restProps,
          // @ts-ignore - Type 'string' is not assignable to type 'boolean | undefined'.
          readOnly: 'true'
        }
      },
      '',
      '',
      {}
    ); // 2nd, 3rd, and 4th args empty string/object/null until typedef marked correctly as optional;
  });

  if (['STACKED_LARGE_VAL', 'DISPLAY_ONLY'].includes(displayMode)) {
    return (
      <div>
        <CommaSeparatedList items={items} />
      </div>
    );
  }

  const displayComp = <CommaSeparatedList items={items} />;

  return <FieldValueList name={hideLabel ? '' : label} value={displayComp} variant='stacked' />;
}
