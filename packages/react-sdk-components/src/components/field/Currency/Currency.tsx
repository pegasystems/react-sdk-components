import React, { useState, useEffect } from 'react';
// import { TextField } from "@material-ui/core";
import CurrencyTextField from '@unicef/material-ui-currency-textfield';
import handleEvent from '../../helpers/event-utils';
import FieldValueList from '../../designSystemExtension/FieldValueList';
import { format } from "../../helpers/formatters";

// Using control from: https://github.com/unicef/material-ui-currency-textfield

export default function Currency(props) {
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
    hideLabel
  } = props;
  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = pConn.getStateProps().value;
  const helperTextToDisplay = validatemessage || helperText;

  // console.log(`Currency: label: ${label} value: ${value}`);

  let readOnlyProp = {}; // Note: empty if NOT ReadOnly

  if (readOnly) {
    readOnlyProp = { readOnly: true };
  }

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

  const [currValue, setCurrValue] = useState();

  useEffect(() => {
    // const testVal = value;
    setCurrValue(value.toString());
  }, [value]);

  const formattedValue = format(value, pConn.getComponentName().toLowerCase());

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  function currOnChange(event, inValue) {
    // console.log(`Currency currOnChange inValue: ${inValue}`);

    // update internal value
    setCurrValue(inValue);
  }

  function currOnBlur(event, inValue) {
    // console.log(`Currency currOnBlur inValue: ${inValue}`);
    handleEvent(actions, 'changeNblur', propName, inValue !== '' ? Number(inValue) : inValue);
  }

  return (
    <CurrencyTextField
      fullWidth
      variant={readOnly ? 'standard' : 'outlined'}
      helperText={helperTextToDisplay}
      placeholder=''
      size='small'
      required={required}
      disabled={disabled}
      onChange={currOnChange}
      onBlur={!readOnly ? currOnBlur : undefined}
      error={status === 'error'}
      label={label}
      value={currValue}
      type='text'
      outputFormat='number'
      textAlign='left'
      InputProps={{ ...readOnlyProp, inputProps: { ...testProp, value: currValue } }}
    />
  );
}
