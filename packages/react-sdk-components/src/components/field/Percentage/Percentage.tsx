import CurrencyTextField from '@unicef/material-ui-currency-textfield';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';
import { getCurrencyCharacters } from '../Currency/currency-utils';
import handleEvent from '../../helpers/event-utils';

// Following code isn't needed, but having it here just for a reference
// Inspired by https://stackoverflow.com/questions/50823182/material-ui-remove-up-down-arrow-dials-from-textview
// const useStyles = makeStyles((/* theme */) => ({
//   input: {
//     '& input[type=number]': {
//       '-moz-appearance': 'textfield'
//     },
//     '& input[type=number]::-webkit-outer-spin-button': {
//       '-webkit-appearance': 'none',
//       margin: 0
//     },
//     '& input[type=number]::-webkit-inner-spin-button': {
//       '-webkit-appearance': 'none',
//       margin: 0
//     }
//   }
// }));

interface PercentageProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Percentage here
  currencyISOCode?: string;
}

export default function Percentage(props: PercentageProps) {
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
    status,
    // onChange,
    // onBlur,
    readOnly,
    currencyISOCode = 'USD',
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

  // console.log(`Percentage: label: ${label} value: ${value}`);

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (readOnly) {
    return <TextInput {...props} />;
  }

  let testProp = {};

  testProp = {
    'data-test-id': testId
  };

  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;

  function PercentageOnBlur(event, inValue) {
    handleEvent(actions, 'changeNblur', propName, inValue !== '' ? Number(inValue) : inValue);
  }

  return (
    <CurrencyTextField
      fullWidth
      variant={readOnly ? 'standard' : 'outlined'}
      helperText={helperTextToDisplay}
      placeholder={placeholder ?? ''}
      size='small'
      required={required}
      disabled={disabled}
      readOnly={!!readOnly}
      error={status === 'error'}
      label={label}
      value={value}
      type='text'
      outputFormat='number'
      textAlign='left'
      InputProps={{
        inputProps: { ...testProp }
      }}
      currencySymbol=''
      decimalCharacter={theCurrDec}
      digitGroupSeparator={theCurrSep}
      onBlur={!readOnly ? PercentageOnBlur : undefined}
    />
  );
}
