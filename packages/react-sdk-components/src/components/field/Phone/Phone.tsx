import React from 'react';
import MuiPhoneNumber from 'material-ui-phone-number';
import FieldValueList from '../../designSystemExtension/FieldValueList';
import type { BaseProps } from '../../../types/BaseProps';

interface PhoneProps extends BaseProps {
  // If any, enter additional props that only exist on Phone here
}



export default function Phone(props: PhoneProps) {
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
    testId,
    helperText,
    displayMode,
    hideLabel
  } = props;
  const helperTextToDisplay = validatemessage || helperText;

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    const disableDropdown = true;
    return (
      <div>
        <MuiPhoneNumber
          fullWidth
          helperText={helperTextToDisplay}
          placeholder=''
          size='small'
          required={required}
          disabled={disabled}
          onChange={onChange}
          error={status === 'error'}
          label={label}
          value={value}
          InputProps={{
            readOnly: true,
            inputProps: { ...testProp }
          }}
          disableDropdown={disableDropdown}
        />
      </div>
    );
  }

  const handleChange = inputVal => {
    let phoneValue = inputVal && inputVal.replace(/\D+/g, '');
    phoneValue = `+${phoneValue}`;
    onChange({ value: phoneValue });
  };

  const handleBlur = event => {
    const phoneValue = event?.target?.value;
    event.target.value = `+${phoneValue && phoneValue.replace(/\D+/g, '')}`;
    onBlur(event);
  };

  return (
    <MuiPhoneNumber
      fullWidth
      variant='outlined'
      helperText={helperTextToDisplay}
      placeholder=''
      size='small'
      defaultCountry='us'
      required={required}
      disabled={disabled}
      onChange={handleChange}
      onBlur={!readOnly ? handleBlur : undefined}
      error={status === 'error'}
      label={label}
      value={value}
      InputProps={{ ...testProp }}
    />
  );
}
