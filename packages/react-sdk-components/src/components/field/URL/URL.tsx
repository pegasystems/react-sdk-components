import React from 'react';
import { TextField } from '@material-ui/core';
import TextInput from '../TextInput';
import FieldValueList from '../../designSystemExtension/FieldValueList';

// NOTE: that we had to change the name from URL to URLComponent
//  Otherwise, we were getting all kinds of weird errors when we
//  referred to URL as a component.
export default function URLComponent(props) {
  const {
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    status,
    onChange,
    onBlur,
    readOnly,
    helperText,
    displayMode,
    hideLabel
  } = props;
  const helperTextToDisplay = validatemessage || helperText;

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    return <TextInput {...props} />;
  }

  return (
    <TextField
      type='url'
      fullWidth
      variant='outlined'
      helperText={helperTextToDisplay}
      placeholder=''
      size='small'
      required={required}
      disabled={disabled}
      onChange={onChange}
      onBlur={!readOnly ? onBlur : undefined}
      error={status === 'error'}
      label={label}
      value={value}
    />
  );
}
