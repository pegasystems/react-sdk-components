/* eslint-disable react/no-array-index-key */
import { useState, useEffect } from 'react';
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import handleEvent from '../../helpers/event-utils';
import LazyLoad from '../../../bridge/LazyLoad';
import { insertInstruction, deleteInstruction, updateNewInstuctions } from '../../helpers/instructions-utils';
import { PConnFieldProps } from '../../../types/PConnProps';

interface CheckboxProps extends Omit<PConnFieldProps, 'value'> {
  // If any, enter additional props that only exist on Checkbox here
  value?: boolean;
  caption?: string;
  trueLabel?: string;
  falseLabel?: string;
  selectionMode?: string;
  datasource?: any;
  selectionKey?: string;
  selectionList?: any;
  primaryField: string;
  readonlyContextList: any;
  referenceList: string;
}

const useStyles = makeStyles(() => ({
  checkbox: {
    display: 'flex',
    flexDirection: 'column'
  }
}));

export default function CheckboxComponent(props: CheckboxProps) {
  const {
    getPConnect,
    label,
    caption,
    value,
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
    falseLabel,
    selectionMode,
    datasource,
    selectionKey,
    selectionList,
    primaryField,
    referenceList,
    readonlyContextList: selectedvalues
  } = props;
  const classes = useStyles();
  const helperTextToDisplay = validatemessage || helperText;
  const thePConn = getPConnect();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;

  const [checked, setChecked] = useState<any>(false);
  useEffect(() => {
    // This update theSelectedButton which will update the UI to show the selected button correctly
    setChecked(value);
  }, [value]);

  useEffect(() => {
    if (referenceList?.length > 0) {
      thePConn.setReferenceList(selectionList);
      updateNewInstuctions(thePConn, selectionList);
    }
  }, [thePConn]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : caption} value={value ? trueLabel : falseLabel} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <LazyLoad componentName='FieldValueList' name={hideLabel ? '' : caption} value={value ? trueLabel : falseLabel} variant='stacked' />;
  }

  const handleChange = event => {
    handleEvent(actionsApi, 'changeNblur', propName, event.target.checked);
  };

  const handleBlur = event => {
    thePConn.getValidationApi().validate(event.target.checked);
  };

  const handleChangeMultiMode = (event, element) => {
    if (event.target.checked) {
      insertInstruction(thePConn, selectionList, selectionKey, primaryField, {
        id: element.key,
        primary: element.text ?? element.value
      });
    } else {
      deleteInstruction(thePConn, selectionList, selectionKey, {
        id: element.key,
        primary: element.text ?? element.value
      });
    }
    thePConn.clearErrorMessages({
      property: selectionList,
      category: '',
      context: ''
    });
  };

  let theCheckbox;
  const listOfCheckboxes: any = [];
  if (selectionMode === 'multi') {
    const listSourceItems = datasource?.source ?? [];
    const dataField: any = selectionKey?.split?.('.')[1];
    listSourceItems.forEach((element, index) => {
      listOfCheckboxes.push(
        <FormControlLabel
          control={
            <Checkbox
              key={index}
              checked={selectedvalues?.some?.(data => data[dataField] === element.key)}
              onChange={event => handleChangeMultiMode(event, element)}
              onBlur={() => {
                thePConn.getValidationApi().validate(selectedvalues, selectionList);
              }}
              data-testid={`${testId}:${element.value}`}
            />
          }
          key={index}
          label={element.text ?? element.value}
          labelPlacement='end'
          data-test-id={testId}
        />
      );
    });
    theCheckbox = <div className={classes.checkbox}>{listOfCheckboxes}</div>;
  } else {
    theCheckbox = (
      <FormControlLabel
        control={
          <Checkbox
            color='primary'
            checked={checked}
            onChange={!readOnly ? handleChange : undefined}
            onBlur={!readOnly ? handleBlur : undefined}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
          />
        }
        label={caption}
        labelPlacement='end'
        data-test-id={testId}
      />
    );
  }

  return (
    <FormControl variant='standard' required={required} error={status === 'error'}>
      {!hideLabel && <FormLabel component='legend'>{label}</FormLabel>}
      <FormGroup>{theCheckbox}</FormGroup>
      <FormHelperText>{helperTextToDisplay}</FormHelperText>
    </FormControl>
  );
}
