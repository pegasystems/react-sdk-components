import { useEffect, useState } from 'react';
import MuiPhoneNumber from 'material-ui-phone-number';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';
import handleEvent from '../../helpers/event-utils';

interface PhoneProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Phone here
}

export default function Phone(props: PhoneProps) {
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
    onChange,
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

  const [inputValue, setInputValue] = useState(value);
  useEffect(() => setInputValue(value), [value]);

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
          placeholder={placeholder ?? ''}
          size='small'
          defaultCountry='us'
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
    setInputValue(inputVal);
  };

  const handleBlur = event => {
    const phoneValue = event?.target?.value;
    let phoneNumber = phoneValue.split(' ').slice(1).join();
    phoneNumber = phoneNumber ? `+${phoneValue && phoneValue.replace(/\D+/g, '')}` : '';
    handleEvent(actions, 'changeNblur', propName, phoneNumber);
  };

  return (
    <MuiPhoneNumber
      fullWidth
      variant='outlined'
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      size='small'
      defaultCountry='us'
      required={required}
      disabled={disabled}
      onChange={handleChange}
      onBlur={!readOnly ? handleBlur : undefined}
      error={status === 'error'}
      label={label}
      value={inputValue}
      InputProps={{ ...testProp }}
    />
  );
}
