import { NumericFormat } from 'react-number-format';
import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { getCurrencyCharacters, getCurrencyOptions } from '../Currency/currency-utils';
import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';

/* Using react-number-format component here, since it allows formatting decimal values,
as per the locale.
*/

interface DecimalProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Decimal here
  currencyISOCode?: string;
  decimalPrecision?: number;
  showGroupSeparators?: boolean;
  formatter?: string;
}

export default function Decimal(props: DecimalProps) {
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
    /* onChange, onBlur, */
    readOnly,
    helperText,
    displayMode,
    hideLabel,
    currencyISOCode = 'USD',
    decimalPrecision,
    showGroupSeparators,
    testId,
    placeholder,
    formatter
  } = props;

  const [values, setValues] = useState(value.toString());

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;

  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;
  const theCurrSym = theSymbols.theCurrencySymbol;

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);

  useEffect(() => {
    setValues(value.toString());
  }, [value]);

  let readOnlyProp = {}; // Note: empty if NOT ReadOnly

  if (readOnly) {
    readOnlyProp = { readOnly: true };
  }

  let formattedValue = '';
  if (formatter === 'Currency') {
    formattedValue = format(value, formatter.toLowerCase(), theCurrencyOptions);
  } else {
    formattedValue = format(value, pConn.getComponentName()?.toLowerCase(), theCurrencyOptions);
  }

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  const testProp = {
    'data-test-id': testId
  };

  function decimalOnBlur() {
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
      onBlur={!readOnly ? decimalOnBlur : undefined}
      prefix={readOnly && formatter === 'Currency' ? theCurrSym : ''}
      suffix={readOnly && formatter === 'Percentage' ? '%' : ''}
      decimalSeparator={theCurrDec}
      thousandSeparator={showGroupSeparators ? theCurrSep : ''}
      decimalScale={readOnly && formatter === 'Currency' ? undefined : decimalPrecision}
      InputProps={{ ...readOnlyProp, inputProps: { ...testProp } }}
      customInput={TextField}
    />
  );
}
