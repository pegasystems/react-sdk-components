import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';

import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import useStatus from '../../../hooks/useStatus';
import { getFieldSx } from '../../helpers/field-utils';

interface URLComponentProps extends PConnFieldProps {
  // If any, enter additional props that only exist on URLComponent here
  showFieldMessage?: boolean;
  messageConfig?: {
    content?: string;
    visibility?: boolean;
  };
  variant?: string;
}

// NOTE: that we had to change the name from URL to URLComponent
//  Otherwise, we were getting all kinds of weird errors when we
//  referred to URL as a component.
export default function URLComponent(props: URLComponentProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');
  const TextInput = getComponentFromMap('TextInput');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    placeholder,
    showFieldMessage,
    messageConfig = {}
  } = props;
  const eligibleForFieldWarning = showFieldMessage && messageConfig.visibility && !readOnly;
  const helperTextToDisplay = validatemessage || (eligibleForFieldWarning ? messageConfig.content : helperText);

  const [inputValue, setInputValue] = useState('');

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;

  const status = useStatus({
    showFieldMessage,
    messageVisibility: messageConfig.visibility,
    validatemessage,
    readOnly
  });

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
    return <TextInput {...props} />;
  }

  const testProps: any = { 'data-test-id': testId };

  const handleChange = event => {
    setInputValue(event?.target?.value);
  };

  function handleBlur() {
    handleEvent(actions, 'changeNblur', propName, inputValue);
  }

  return (
    <TextField
      type='url'
      fullWidth
      variant='outlined'
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
        input: { inputProps: { ...testProps } }
      }}
      sx={getFieldSx(status)}
    />
  );
}
