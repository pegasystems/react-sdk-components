import { useState, useEffect } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, FormHelperText } from '@mui/material';

import Utils from '../../helpers/utils';
import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';

// Can't use RadioButtonProps until getLocaleRuleNameFromKeys is NOT private
interface RadioButtonsProps extends PConnFieldProps {
  // If any, enter additional props that only exist on RadioButtons here
  inline: boolean;
  fieldMetadata?: any;
  variant?: string;
  hideFieldLabels?: boolean;
  additionalProps?: any;
  imagePosition?: string;
  imageSize?: string;
  showImageDescription?: boolean;
  datasource?: any;
}

export default function RadioButtons(props: RadioButtonsProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');
  const SelectableCard = getComponentFromMap('SelectableCard');

  const {
    getPConnect,
    label,
    value = '',
    readOnly,
    validatemessage,
    helperText,
    status,
    required,
    inline,
    displayMode,
    hideLabel,
    fieldMetadata,
    variant,
    hideFieldLabels,
    additionalProps,
    datasource,
    imagePosition,
    imageSize,
    showImageDescription
  } = props;
  const [theSelectedButton, setSelectedButton] = useState(value);

  const thePConn = getPConnect();
  const theConfigProps = thePConn.getConfigProps();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;
  const helperTextToDisplay = validatemessage || helperText;
  const className = thePConn.getCaseInfo().getClassName();

  let configProperty = (thePConn.getRawMetadata() as any)?.config?.value || '';
  configProperty = configProperty.startsWith('@P') ? configProperty.substring(3) : configProperty;
  configProperty = configProperty.startsWith('.') ? configProperty.substring(1) : configProperty;

  const metaData = Array.isArray(fieldMetadata) ? fieldMetadata.filter(field => field?.classID === className)[0] : fieldMetadata;
  let displayName = metaData?.datasource?.propertyForDisplayText;
  displayName = displayName?.slice(displayName.lastIndexOf('.') + 1);
  const localeContext = metaData?.datasource?.tableType === 'DataPage' ? 'datapage' : 'associated';
  const localeClass = localeContext === 'datapage' ? '@baseclass' : className;
  const localeName = localeContext === 'datapage' ? metaData?.datasource?.name : configProperty;
  const localePath = localeContext === 'datapage' ? displayName : localeName;

  // theOptions will be an array of JSON objects that are literally key/value pairs.
  //  Ex: [ {key: "Basic", value: "Basic"} ]
  const theOptions = Utils.getOptionList(theConfigProps, thePConn.getDataObject(''));

  useEffect(() => {
    // This update theSelectedButton which will update the UI to show the selected button correctly
    setSelectedButton(value);
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return (
      <FieldValueList
        name={hideLabel ? '' : label}
        value={thePConn.getLocalizedValue(value, localePath, thePConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName))}
      />
    );
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return (
      <FieldValueList
        name={hideLabel ? '' : label}
        value={thePConn.getLocalizedValue(value, localePath, thePConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName))}
        variant='stacked'
      />
    );
  }

  const handleChange = event => {
    handleEvent(actionsApi, 'changeNblur', propName, event.target.value);
  };

  const handleBlur = event => {
    thePConn.getValidationApi().validate(event.target.value, ''); // 2nd arg empty string until typedef marked correctly as optional
  };

  if (variant === 'card') {
    const stateProps = thePConn.getStateProps();
    return (
      <div>
        <h4 style={{ marginTop: 0, marginBottom: 0 }}>{label}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 40ch), 1fr))', gridAutoRows: '1fr', gap: '0.5rem' }}>
          <SelectableCard
            hideFieldLabels={hideFieldLabels}
            additionalProps={additionalProps}
            getPConnect={getPConnect}
            dataSource={datasource}
            image={{
              imagePosition,
              imageSize,
              showImageDescription,
              imageField: stateProps.image?.split('.').pop(),
              imageDescription: stateProps.imageDescription?.split('.').pop()
            }}
            onChange={handleChange}
            recordKey={stateProps.value?.split('.').pop()}
            cardLabel={stateProps.primaryField?.split('.').pop()}
            radioBtnValue={value}
            type='radio'
            setIsRadioCardSelected={displayMode !== 'DISPLAY_ONLY' ? setSelectedButton : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <FormControl variant='standard' error={status === 'error'} required={required}>
      <FormLabel component='legend'>{label}</FormLabel>
      <RadioGroup value={theSelectedButton} onChange={handleChange} onBlur={!readOnly ? handleBlur : undefined} row={inline}>
        {theOptions.map(theOption => {
          return (
            <FormControlLabel
              value={theOption.key}
              key={theOption.key}
              label={thePConn.getLocalizedValue(
                theOption.value,
                localePath,
                thePConn.getLocaleRuleNameFromKeys(localeClass, localeContext, localeName)
              )}
              control={<Radio key={theOption.key} color='primary' disabled={readOnly} />}
            />
          );
        })}
      </RadioGroup>
      <FormHelperText>{helperTextToDisplay}</FormHelperText>
    </FormControl>
  );
}
