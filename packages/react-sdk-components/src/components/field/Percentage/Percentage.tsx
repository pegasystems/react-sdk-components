import { useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { TextField } from '@mui/material';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';
import { getCurrencyCharacters, getCurrencyOptions } from '../Currency/currency-utils';
import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';

/* Using react-number-format component here, since it allows formatting decimal values,
as per the locale.
*/
interface PercentageProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Percentage here
  currencyISOCode?: string;
  showGroupSeparators?: string;
  decimalPrecision?: number;
}

export default function Percentage(props: PercentageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    status,
    // onChange,
    // onBlur,
    readOnly,
    currencyISOCode = 'USD',
    testId,
    helperText,
    displayMode,
    hideLabel,
    placeholder,
    showGroupSeparators,
    decimalPrecision
  } = props;

  const [values, setValues] = useState(value.toString());

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);
  const formattedValue = format(value, pConn.getComponentName().toLowerCase(), theCurrencyOptions);

  let readOnlyProp = {}; // Note: empty if NOT ReadOnly

  if (readOnly) {
    readOnlyProp = { readOnly: true };
  }

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;

  function PercentageOnBlur() {
    handleEvent(actions, 'changeNblur', propName, values);
  }

  const handleChange = val => {
    setValues(val.value);
  };

  return (
    <NumericFormat
      valueIsNumericString
      fullWidth
      variant={readOnly ? 'standard' : 'outlined'}
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      size='small'
      required={required}
      disabled={disabled}
      error={status === 'error'}
      label={label}
      value={values}
      onValueChange={val => {
        handleChange(val);
      }}
      onBlur={!readOnly ? PercentageOnBlur : undefined}
      decimalSeparator={theCurrDec}
      thousandSeparator={showGroupSeparators ? theCurrSep : ''}
      decimalScale={decimalPrecision}
      suffix='%'
      InputProps={{ ...readOnlyProp, inputProps: { ...testProp } }}
      customInput={TextField}
    />
  );
}
