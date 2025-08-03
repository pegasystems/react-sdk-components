import { useEffect, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import DateFormatter from '../../helpers/formatters/Date';
import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { dateFormatInfoDefault, getDateFormatInfo } from '../../helpers/date-format-utils';
import LazyLoad from '../../../bridge/LazyLoad';
import { PConnFieldProps } from '../../../types/PConnProps';

interface DateTimeProps extends PConnFieldProps {
  // If any, enter additional props that only exist on DateTime here
}

export default function DateTime(props: DateTimeProps) {
  const { getPConnect, label, required, disabled, value = '', validatemessage, status, readOnly, testId, helperText, displayMode, hideLabel } = props;

  const environmentInfo = PCore.getEnvironmentInfo();
  const timezone = environmentInfo && environmentInfo.getTimeZone();

  const [dateValue, setDateValue] = useState<Dayjs | null>(value ? dayjs(DateFormatter.convertToTimezone(value, { timezone })) : null);

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

  useEffect(() => {
    setDateValue(dayjs(DateFormatter.convertToTimezone(value, { timezone })));
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    const formattedDateTime = format(props.value, 'datetime', {
      format: `${dateFormatInfo.dateFormatString} hh:mm a`
    });
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : label} value={formattedDateTime} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    const formattedDateTime = format(props.value, 'datetime', {
      format: `${dateFormatInfo.dateFormatString} hh:mm a`
    });
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : label} value={formattedDateTime} variant='stacked' />;
  }

  if (readOnly) {
    const formattedDateTime = format(props.value, 'datetime');
    return <LazyLoad componentName='TextInput' {...props} value={formattedDateTime} />;
  }

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

  const handleChange = date => {
    const timeZoneDateTime = (dayjs as any).tz(date.format('YYYY-MM-DDTHH:mm:ss'), timezone);
    const changeValue = timeZoneDateTime && timeZoneDateTime.isValid() ? timeZoneDateTime.toISOString() : '';
    setDateValue(timeZoneDateTime);
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
          size: 'small',
          InputProps: { ...testProp }
        }
      }}
    />
  );
}
