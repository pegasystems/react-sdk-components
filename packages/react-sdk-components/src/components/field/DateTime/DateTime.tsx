import { useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { dateFormatInfoDefault, getDateFormatInfo } from '../../helpers/date-format-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';

interface DateTimeProps extends PConnFieldProps {
  // If any, enter additional props that only exist on DateTime here
}

export default function DateTime(props: DateTimeProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const TextInput = getComponentFromMap('TextInput');
  const FieldValueList = getComponentFromMap('FieldValueList');

  const { getPConnect, label, required, disabled, value = '', validatemessage, status, readOnly, testId, helperText, displayMode, hideLabel } = props;

  const [dateValue, setDateValue] = useState<Dayjs | null>(value ? dayjs(value) : null);

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;

  // Start with default dateFormatInfo
  const dateFormatInfo = dateFormatInfoDefault;
  // and then update, as needed, based on locale, etc.
  const theDateFormat = getDateFormatInfo();
  dateFormatInfo.dateFormatString = theDateFormat.dateFormatString;
  dateFormatInfo.dateFormatStringLC = theDateFormat.dateFormatStringLC;
  dateFormatInfo.dateFormatMask = theDateFormat.dateFormatMask;

  if (displayMode === 'LABELS_LEFT') {
    const formattedDateTime = format(props.value, 'datetime', {
      format: `${dateFormatInfo.dateFormatString} hh:mm a`
    });
    return <FieldValueList name={hideLabel ? '' : label} value={formattedDateTime} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    const formattedDateTime = format(props.value, 'datetime', {
      format: `${dateFormatInfo.dateFormatString} hh:mm a`
    });
    return <FieldValueList name={hideLabel ? '' : label} value={formattedDateTime} variant='stacked' />;
  }

  if (readOnly) {
    const formattedDateTime = format(props.value, 'datetime');
    return <TextInput {...props} value={formattedDateTime} />;
  }

  const handleChange = date => {
    setDateValue(date);
    const changeValue = date && date.isValid() ? date.toISOString() : null;
    handleEvent(actions, 'changeNblur', propName, changeValue);
  };

  //
  // TODO: Keyboard doesn't work in the minute field, it updates one digit then jump to am/pm field
  //       try an older version of the lib or use DateTimePicker
  //

  return (
    <DateTimePicker
      // fullWidth
      // autoOk
      disabled={disabled}
      format={`${dateFormatInfo.dateFormatString} hh:mm a`}
      // mask={`${dateFormatInfo.dateFormatMask} __:__ _m`}
      minutesStep={5}
      label={label}
      value={dateValue}
      onChange={handleChange}
      data-test-id={testId}
      slotProps={{
        textField: {
          variant: 'outlined',
          required,
          placeholder: `${dateFormatInfo.dateFormatStringLC} hh:mm a`,
          error: status === 'error',
          helperText: helperTextToDisplay,
          size: 'small'
        }
      }}
    />
  );
}
