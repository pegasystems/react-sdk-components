import { useEffect, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import LazyLoad from '../../../bridge/LazyLoad';
import { PConnFieldProps } from '../../../types/PConnProps';
import handleEvent from '../../helpers/event-utils';

interface EmailProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Date here
}

export default function Email(props: EmailProps) {
  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    status,
    readOnly,
    testId,
    helperText,
    displayMode,
    hideLabel,
    placeholder
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;

  const helperTextToDisplay = validatemessage || helperText;

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    return <LazyLoad componentName='TextInput' {...props} />;
  }

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

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
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <MailOutlineIcon />
          </InputAdornment>
        ),
        inputProps: { ...testProp }
      }}
    />
  );
}
