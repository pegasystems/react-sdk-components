import { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import useStatus from '../../../hooks/useStatus';
import { getFieldSx } from '../../helpers/field-utils';

interface TextInputProps extends PConnFieldProps {
  // If any, enter additional props that only exist on TextInput here
  fieldMetadata?: any;
  showFieldMessage?: boolean;
  messageConfig?: {
    content?: string;
    visibility?: boolean;
  };
  variant?: string;
}

export default function TextInput(props: TextInputProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    /* onChange, onBlur */
    readOnly,
    testId,
    fieldMetadata,
    helperText,
    displayMode,
    hideLabel,
    placeholder,
    showFieldMessage,
    messageConfig = {}
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const eligibleForFieldWarning = showFieldMessage && messageConfig.visibility && !readOnly;
  const helperTextToDisplay = validatemessage || (eligibleForFieldWarning ? messageConfig.content : helperText);

  const status = useStatus({
    showFieldMessage,
    messageVisibility: messageConfig.visibility,
    validatemessage,
    readOnly
  });

  const [inputValue, setInputValue] = useState('');
  const maxLength = fieldMetadata?.maxLength;

  let readOnlyProp = {}; // Note: empty if NOT ReadOnly

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant={props.variant} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    readOnlyProp = { readOnly: true };
  }

  const testProps: any = { 'data-test-id': testId };

  function handleChange(event) {
    // update internal value
    setInputValue(event?.target?.value);
  }

  function handleBlur() {
    handleEvent(actions, 'changeNblur', propName, inputValue);
  }

  return (
    <TextField
      fullWidth
      variant={readOnly ? 'standard' : 'outlined'}
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      size='small'
      required={required}
      disabled={disabled}
      onChange={handleChange}
      onBlur={!readOnly ? handleBlur : undefined}
      error={status === 'error'}
      label={label}
      value={inputValue}
      slotProps={{
        input: { ...readOnlyProp, inputProps: { maxLength, ...testProps } }
      }}
      sx={getFieldSx(status)}
    />
  );
}
