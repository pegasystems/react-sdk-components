import CurrencyTextField from '@unicef/material-ui-currency-textfield';

import { getCurrencyCharacters, getCurrencyOptions } from '../Currency/currency-utils';
import handleEvent from '../../helpers/event-utils';
import { format } from '../../helpers/formatters';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';

/* Using @unicef/material-ui-currency-textfield component here, since it allows formatting decimal values,
as per the locale.
*/

interface DecimalProps extends PConnFieldProps {
  // If any, enter additional props that only exist on Decimal here
  currencyISOCode?: string;
  decimalPrecision?: number;
  showGroupSeparators?: string;
  formatter?: string;
}

export default function Decimal(props: DecimalProps) {
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
    /* onChange, onBlur, */
    readOnly,
    helperText,
    displayMode,
    hideLabel,
    currencyISOCode = 'USD',
    decimalPrecision = 2,
    showGroupSeparators = true,
    testId,
    placeholder,
    formatter
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;

  const theSymbols = getCurrencyCharacters(currencyISOCode);
  const theCurrDec = theSymbols.theDecimalIndicator;
  const theCurrSep = theSymbols.theDigitGroupSeparator;
  const theCurrSym = theSymbols.theCurrencySymbol;

  const theCurrencyOptions = getCurrencyOptions(currencyISOCode);
  const formattedValue = format(value, pConn.getComponentName().toLowerCase(), theCurrencyOptions);

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={formattedValue} variant='stacked' />;
  }

  const testProp = {
    'data-test-id': testId
  };

  function decimalOnBlur(event, inValue) {
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
      error={status === 'error'}
      label={label}
      value={value}
      readOnly={!!readOnly}
      type='text'
      outputFormat='number'
      textAlign='left'
      InputProps={{ inputProps: { ...testProp } }}
      currencySymbol={readOnly && formatter === 'Currency' ? theCurrSym : ''}
      decimalCharacter={theCurrDec}
      digitGroupSeparator={showGroupSeparators ? theCurrSep : ''}
      decimalPlaces={decimalPrecision}
      onBlur={!readOnly ? decimalOnBlur : undefined}
    />
  );
}
