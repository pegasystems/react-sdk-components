import { useEffect, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import handleEvent from '../../helpers/event-utils';
import useStatus from '../../../hooks/useStatus';
import { getFieldSx } from '../../helpers/field-utils';

interface EmailProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Date here
  showFieldMessage?: boolean;
  messageConfig?: {
    content?: string;
    visibility?: boolean;
  };
  variant?: string;
}

export default function Email(props: EmailProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const TextInput = getComponentFromMap('TextInput');
  const FieldValueList = getComponentFromMap('FieldValueList');

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
      type='email'
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start'>
              <MailOutlineIcon />
            </InputAdornment>
          ),
          inputProps: { ...testProps }
        }
      }}
      sx={getFieldSx(status)}
    />
  );
}
