import { TimePicker } from '@mui/x-date-pickers/TimePicker';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';

import handleEvent from '../../helpers/event-utils';
import LazyLoad from '../../../bridge/LazyLoad';
import { PConnFieldProps } from '../../../types/PConnProps';

interface TimeProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Time here
}

export default function Time(props: TimeProps) {
  const { getPConnect, label, required, disabled, value = '', validatemessage, status, readOnly, helperText, displayMode, hideLabel, testId } = props;
  const helperTextToDisplay = validatemessage || helperText;
  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
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

  const handleChange = date => {
    const theValue = date && date.isValid() ? date.format('HH:mm:ss') : null;
    handleEvent(actions, 'changeNblur', propName, theValue);
  };

  let timeValue: any = null;
  if (value && Object.keys(value).length) {
    const timeArray = value.split(':').map(itm => Number(itm));
    timeValue = dayjs().hour(timeArray[0]).minute(timeArray[1]);
  }

  //
  // TODO: Keyboard doesn't work in the minute field, it updates one digit then jump to am/pm field
  //       try an older version of the lib or use DateTimePicker
  //

  return (
    <TimePicker
      // keyboardIcon={<AccessTimeIcon />}
      // fullWidth

      disabled={disabled}
      minutesStep={5}
      label={label}
      // autoOk
      // mask='__:__ _m'
      format='hh:mm a'
      value={timeValue}
      onChange={handleChange}
      slotProps={{
        textField: {
          variant: 'outlined',
          placeholder: 'hh:mm am',
          required,
          error: status === 'error',
          helperText: helperTextToDisplay,
          size: 'small',
          InputProps: { ...testProp }
        }
      }}
    />
  );
}
