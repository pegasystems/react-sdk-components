import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import isDeepEqual from 'fast-deep-equal/react';

import Utils from '../../helpers/utils';
import { getDataPage } from '../../helpers/data_page';
import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import useStatus from '../../../hooks/useStatus';

interface IOption {
  key: string;
  value: string;
  secondary?: ReactNode[];
  secondaryRaw?: string[];
}

const preProcessColumns = columnList => {
  return columnList.map(col => {
    const tempColObj = { ...col };
    tempColObj.value = col.value && col.value.startsWith('.') ? col.value.substring(1) : col.value;
    return tempColObj;
  });
};

const getPropertyName = (rawValue: string): string => {
  let propName;
  if (rawValue.startsWith('@USER ')) {
    propName = rawValue.substring(6).trim();
  } else if (rawValue.startsWith('@P ')) {
    propName = rawValue.substring(3).trim();
  } else {
    propName = rawValue.trim();
  }
  return propName.startsWith('.') ? propName.substring(1) : propName;
};

const getDisplayFieldsMetaData = columnList => {
  const displayColumns = columnList.filter(col => col.display === 'true');
  const metaDataObj: any = { key: '', primary: '', secondary: [] };
  const keyCol = columnList.filter(col => col.key === 'true');
  metaDataObj.key = keyCol.length > 0 ? keyCol[0].value : 'auto';
  for (let index = 0; index < displayColumns.length; index += 1) {
    if (displayColumns[index].primary === 'true') {
      metaDataObj.primary = displayColumns[index].value;
    } else {
      metaDataObj.secondary.push(displayColumns[index].value);
    }
  }
  return metaDataObj;
};

interface AutoCompleteProps extends PConnFieldProps {
  // If any, enter additional props that only exist on AutoComplete here'
  displayMode?: string;
  deferDatasource?: boolean;
  datasourceMetadata?: any;
  status?: string;
  onRecordChange?: any;
  additionalProps?: object;
  listType: string;
  parameters?: any;
  datasource: any;
  columns: any[];
  showFieldMessage?: boolean;
  messageConfig?: {
    content?: string;
    visibility?: boolean;
  };
}

export default function AutoComplete(props: AutoCompleteProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const TextInput = getComponentFromMap('TextInput');
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    placeholder,
    value = '',
    validatemessage,
    readOnly,
    testId,
    displayMode,
    deferDatasource,
    datasourceMetadata,
    helperText,
    hideLabel,
    onRecordChange,
    showFieldMessage,
    messageConfig = {}
  } = props;

  const context = getPConnect().getContextName();
  let { listType, parameters, datasource = [], columns = [] } = props;
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<IOption[]>([]);
  const [theDatasource, setDatasource] = useState(null);
  let selectedValue: any = '';
  const eligibleForFieldWarning = showFieldMessage && messageConfig.visibility && !readOnly;
  const helperTextToDisplay = validatemessage || (eligibleForFieldWarning ? messageConfig.content : helperText);

  const thePConn = getPConnect();
  const actionsApi = thePConn.getActionsApi();
  const propName = (thePConn.getStateProps() as any).value;

  const status = useStatus({
    showFieldMessage,
    messageVisibility: messageConfig.visibility,
    validatemessage,
    readOnly
  });

  if (!isDeepEqual(datasource, theDatasource)) {
    // inbound datasource is different, so update theDatasource (to trigger useEffect)
    setDatasource(datasource);
  }

  const flattenParameters = (params = {}) => {
    const flatParams = {};
    Object.keys(params).forEach(key => {
      const { name, value: theVal } = params[key];
      flatParams[name] = theVal;
    });

    return flatParams;
  };

  // convert associated to datapage listtype and transform props
  // Process deferDatasource when datapage name is present. WHhen tableType is promptList / localList
  if (deferDatasource && datasourceMetadata?.datasource?.name) {
    listType = 'datapage';
    datasource = datasourceMetadata.datasource.name;
    const { parameters: dataSourceParameters, propertyForDisplayText, propertyForValue } = datasourceMetadata.datasource;
    parameters = flattenParameters(dataSourceParameters);
    const displayProp = propertyForDisplayText.startsWith('@P') ? propertyForDisplayText.substring(3) : propertyForDisplayText;
    const valueProp = propertyForValue.startsWith('@P') ? propertyForValue.substring(3) : propertyForValue;
    columns = [
      {
        key: 'true',
        setProperty: 'Associated property',
        value: valueProp
      },
      {
        display: 'true',
        primary: 'true',
        useForSearch: true,
        value: displayProp
      }
    ];
  }

  // Add secondary columns from columnsFormatter metadata
  const columnsFormatter = (thePConn as any).getRawMetadata?.()?.config?.columnsFormatter;
  if (Array.isArray(columnsFormatter) && columnsFormatter.length > 0) {
    columnsFormatter.forEach(formatter => {
      if (formatter.config?.value) {
        columns.push({
          value: getPropertyName(formatter.config.value),
          display: 'true',
          useForSearch: true,
          secondary: 'true'
        });
      }
    });
  }

  columns = preProcessColumns(columns);

  useEffect(() => {
    if (listType === 'associated') {
      setOptions(Utils.getOptionList(props, getPConnect().getDataObject('')));
    }
  }, [theDatasource]);

  useEffect(() => {
    if (!displayMode && listType !== 'associated') {
      getDataPage(datasource, parameters, context).then((results: any) => {
        const optionsData: any[] = [];
        const displayColumn = getDisplayFieldsMetaData(columns);
        results?.forEach(element => {
          const val = element[displayColumn.primary]?.toString();
          let secondaryNodes: ReactNode[] = [];
          let secondaryRaw: string[] = [];

          if (Array.isArray(columnsFormatter) && columnsFormatter.length > 0) {
            columnsFormatter.forEach((formatter, idx) => {
              if (formatter.config?.value) {
                const propName = getPropertyName(formatter.config.value);
                secondaryRaw.push(element[propName]?.toString() || '');

                // Create PConnect for the field and render in DISPLAY_ONLY mode
                try {
                  const fieldMeta = {
                    meta: {
                      ...formatter,
                      config: {
                        ...formatter.config,
                        displayMode: 'DISPLAY_ONLY',
                        contextName: context,
                        variant: 'inline-compact'
                      }
                    },
                    useCustomContext: element
                  };
                  const configObj = (PCore as any).createPConnect(fieldMeta);
                  const resolvedPConn = configObj.getPConnect();
                  const resolvedProps = resolvedPConn.resolveConfigProps(resolvedPConn.getConfigProps());
                  const Component = getComponentFromMap(formatter.type);
                  if (Component) {
                    secondaryNodes.push(<Component key={idx} {...resolvedProps} getPConnect={() => resolvedPConn} displayMode='DISPLAY_ONLY' />);
                  } else {
                    secondaryNodes.push(element[propName]?.toString() || '');
                  }
                } catch {
                  secondaryNodes.push(element[propName]?.toString() || '');
                }
              }
            });
          } else {
            // Fallback to plain secondary columns
            secondaryRaw = displayColumn.secondary.map(col => element[col]?.toString()).filter(Boolean);
            secondaryNodes = [...secondaryRaw];
          }

          const obj: IOption = {
            key: element[displayColumn.key] || element.pyGUID,
            value: val,
            ...(secondaryNodes.length > 0 && { secondary: secondaryNodes }),
            ...(secondaryRaw.length > 0 && { secondaryRaw })
          };
          optionsData.push(obj);
        });
        setOptions(optionsData);
      });
    }
  }, []);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant={(props as any).variant} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  if (value) {
    const index = options?.findIndex(element => element.key === value);
    if (index > -1) {
      selectedValue = options[index].value;
    } else {
      selectedValue = value;
    }
  }

  const handleChange = (event: object, newValue) => {
    const val = newValue ? newValue.key : '';
    handleEvent(actionsApi, 'changeNblur', propName, val);
    if (onRecordChange) {
      onRecordChange(event);
    }
  };

  const handleInputValue = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  if (readOnly) {
    const theValAsString = options?.find(opt => opt.key === value)?.value;
    return <TextInput {...props} value={theValAsString} />;
  }
  // Need to use both getOptionLabel and getOptionSelected to map our
  //  key/value structure to what Autocomplete expects
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: IOption) => {
        return option.value ? option.value : '';
      }}
      isOptionEqualToValue={(option: any) => {
        return option.value ? option.value : '';
      }}
      fullWidth
      onChange={handleChange}
      value={selectedValue}
      inputValue={inputValue || selectedValue}
      onInputChange={handleInputValue}
      filterOptions={createFilterOptions<IOption>({
        stringify: (option) => {
          const parts = [option.value || ''];
          if (option.secondaryRaw) {
            parts.push(...option.secondaryRaw);
          }
          return parts.join(' ');
        }
      })}
      renderOption={(renderProps, option: IOption) => (
        <li {...renderProps} key={option.key}>
          <div>
            <span>{option.value}</span>
            {option.secondary && option.secondary.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                {option.secondary.map((sec, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {i > 0 && <span style={{ margin: '0 4px' }}>{'\u00B7'}</span>}
                    {sec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </li>
      )}
      renderInput={params => (
        <TextField
          {...params}
          fullWidth
          variant='outlined'
          helperText={helperTextToDisplay}
          placeholder={placeholder}
          size='small'
          required={required}
          error={status === 'error'}
          label={label}
          data-test-id={testId}
        />
      )}
    />
  );
}
