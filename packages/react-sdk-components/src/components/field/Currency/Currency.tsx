import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { TextField } from '@mui/material';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { getCurrencyCharacters, getCurrencyOptions } from './currency-utils';
import useStatus from '../../../hooks/useStatus';

/* Using react-number-format component here, since it allows formatting decimal values,
as per the locale.
*/
interface CurrrencyProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Currency here
  currencyISOCode?: string;
  allowDecimals: boolean;
  showFieldMessage?: boolean;
  messageConfig?: {
    content?: string;
    visibility?: boolean;
  };
}

export default function Currency(props: CurrrencyProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    /* onChange, onBlur, */
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    currencyISOCode = 'USD',
    placeholder,
    allowDecimals,
    showFieldMessage,
    messageConfig = {}
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const eligibleForFieldWarning = showFieldMessage && messageConfig.visibility && !readOnly;
  const helperTextToDisplay = validatemessage || (eligibleForFieldWarning ? messageConfig.content : helperText);
  const [values, setValues] = useState(value.toString());

  const status = useStatus({
    showFieldMessage,
    messageVisibility: messageConfig.visibility,
    validatemessage,
    readOnly
  });

  const testProps: any = { 'data-test-id': testId };

  useEffect(() => {
    setValues(value.toString());
  }, [value]);

  // currencySymbols looks like this: { theCurrencySymbol: '$', theDecimalIndicator: '.', theSeparator: ',' }
  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrSym = theSymbols.theCurrencySymbol;
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);
  const formattedValue = format(value, pConn.getComponentName()?.toLowerCase(), theCurrencyOptions);

  let readOnlyProp = {}; // Note: empty if NOT ReadOnly

  if (readOnly) {
    readOnlyProp = { readOnly: true };
  }

  let currencyProp = {};
  currencyProp = { prefix: theCurrSym, decimalSeparator: theCurrDec, thousandSeparator: theCurrSep };

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant={(props as any).variant} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  function currOnBlur() {
    handleEvent(actions, 'changeNblur', propName, values);
  }

  const handleChange = val => {
    setValues(val.value);
  };

  return (
    <NumericFormat
      valueIsNumericString
      variant={readOnly ? 'standard' : 'outlined'}
      label={label}
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      required={required}
      disabled={disabled}
      onValueChange={val => {
        handleChange(val);
      }}
      onBlur={!readOnly ? currOnBlur : undefined}
      error={status === 'error'}
      name='numberformat'
      value={values}
      {...currencyProp}
      decimalScale={allowDecimals !== false ? 2 : 0}
      fixedDecimalScale={allowDecimals}
      slotProps={{ input: { ...readOnlyProp, inputProps: { ...testProps } } }}
      customInput={TextField}
    />
  );
}
