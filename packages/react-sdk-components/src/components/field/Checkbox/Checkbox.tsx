import { useState, useEffect } from 'react';
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText } from '@material-ui/core';

import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { PConnFieldProps } from '../../../types/PConnProps';

interface CheckboxProps extends Omit<PConnFieldProps, 'value'> {
  // If any, enter additional props that only exist on Checkbox here
  value?: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  caption?: string;
  trueLabel?: string;
  falseLabel?: string;
}

export default function CheckboxComponent(props: CheckboxProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    value = false,
    readOnly,
    testId,
    required,
    disabled,
    status,
    helperText,
    validatemessage,
    displayMode,
    hideLabel,
    trueLabel,
    falseLabel
  } = props;
  const helperTextToDisplay = validatemessage || helperText;

  const thePConn = getPConnect();
  const theConfigProps = thePConn.getConfigProps() as CheckboxProps;
  const caption = theConfigProps.caption;
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;

  const [checked, setChecked] = useState(false);
  useEffect(() => {
    // This update theSelectedButton which will update the UI to show the selected button correctly
    setChecked(value);
  }, [value]);

  if (displayMode === 'LABELS_LEFT') {
    return <FieldValueList name={hideLabel ? '' : caption} value={value ? trueLabel : falseLabel} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : caption} value={value ? trueLabel : falseLabel} variant='stacked' />;
  }

  const handleChange = event => {
    handleEvent(actionsApi, 'changeNblur', propName, event.target.checked);
  };

  const handleBlur = event => {
    thePConn.getValidationApi().validate(event.target.checked);
  };

  let theCheckbox = <Checkbox color='primary' disabled={disabled} />;

  if (readOnly) {
    // Workaround for lack of InputProps readOnly from https://github.com/mui-org/material-ui/issues/17043
    //  Also note that we need to turn off the onChange call in the FormControlLabel wrapper, too. See below!
    theCheckbox = <Checkbox value={value || false} readOnly={readOnly} />;
  }

  return (
    <FormControl required={required} error={status === 'error'}>
      <FormGroup>
        <FormControlLabel
          control={theCheckbox}
          checked={checked}
          onChange={!readOnly ? handleChange : undefined}
          onBlur={!readOnly ? handleBlur : undefined}
          label={caption}
          labelPlacement='end'
          data-test-id={testId}
        />
      </FormGroup>
      <FormHelperText>{helperTextToDisplay}</FormHelperText>
    </FormControl>
  );
}
