import { useState, useEffect } from 'react';
import CurrencyTextField from '@unicef/material-ui-currency-textfield';

import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';

import { getCurrencyCharacters, getCurrencyOptions } from './currency-utils';

// Using control from: https://github.com/unicef/material-ui-currency-textfield

interface CurrrencyProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Currency here
  currencyISOCode?: string;
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
    status,
    /* onChange, onBlur, */
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    currencyISOCode = 'USD',
    placeholder
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;

  // console.log(`Currency: label: ${label} value: ${value}`);

  const testProp = {
    'data-test-id': testId
  };

  const [theCurrSym, setCurrSym] = useState('$');
  const [theCurrDec, setCurrDec] = useState('.');
  const [theCurrSep, setCurrSep] = useState(',');

  useEffect(() => {
    // currencySymbols looks like this: { theCurrencySymbol: '$', theDecimalIndicator: '.', theSeparator: ',' }
    const theSymbols = getCurrencyCharacters(currencyISOCode);
    setCurrSym(theSymbols.theCurrencySymbol);
    setCurrDec(theSymbols.theDecimalIndicator);
    setCurrSep(theSymbols.theDigitGroupSeparator);
  }, [currencyISOCode]);

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);
  const formattedValue = format(value, pConn.getComponentName().toLowerCase(), theCurrencyOptions);

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  function currOnBlur(event, inValue) {
    // console.log(`Currency currOnBlur inValue: ${inValue}`);
    handleEvent(actions, 'changeNblur', propName, inValue !== '' ? Number(inValue) : inValue);
  }

  // console.log(`theCurrSym: ${theCurrSym} | theCurrDec: ${theCurrDec} | theCurrSep: ${theCurrSep}`);

  return (
    <CurrencyTextField
      fullWidth
      variant={readOnly ? 'standard' : 'outlined'}
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      size='small'
      required={required}
      disabled={disabled}
      readOnly={!!readOnly}
      error={status === 'error'}
      label={label}
      value={value}
      type='text'
      outputFormat='number'
      textAlign='left'
      InputProps={{ inputProps: { ...testProp } }}
      currencySymbol={theCurrSym}
      decimalCharacter={theCurrDec}
      digitGroupSeparator={theCurrSep}
      onBlur={!readOnly ? currOnBlur : undefined}
    />
  );
}
