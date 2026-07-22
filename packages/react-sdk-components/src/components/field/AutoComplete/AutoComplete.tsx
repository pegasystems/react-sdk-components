import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { TextField, Paper, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import isDeepEqual from 'fast-deep-equal/react';

import Utils from '../../helpers/utils';
import { getDataPage } from '../../helpers/data_page';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';
import useStatus from '../../../hooks/useStatus';
import { getFieldSx } from '../../helpers/field-utils';

interface IOption {
  key: string;
  value: string;
  secondary?: ReactNode[];
  secondaryRaw?: string[];
  group?: string;
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
  variant?: string;
  showCreateNew?: boolean;
  onCreateNew?: () => void;
  createNewLabel?: string;
  createNewRecord?: () => Promise<unknown>;
  contextClass?: string;
  referenceType?: string;
  allowCreatingRecords?: boolean;
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
    messageConfig = {},
    onCreateNew,
    createNewLabel = 'Create new',
    createNewRecord,
    contextClass,
    referenceType
  } = props;

  const context = getPConnect().getContextName();
  let { listType, parameters, datasource = [], columns = [] } = props;
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<IOption[]>([]);
  const [theDatasource, setDatasource] = useState(null);
  let selectedValue: any = null;
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
  const columnsFormatter = (thePConn.getRawMetadata?.()?.config as any)?.columnsFormatter;
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

  // Read groupsFields from raw metadata for grouping support
  const groupsFields = (thePConn.getRawMetadata?.()?.config as any)?.groupsFields;
  const groupKeyFields: string[] = Array.isArray(groupsFields)
    ? groupsFields.map((entry: any) => getPropertyName(entry?.config?.value || '')).filter(Boolean)
    : [];
  const isGrouped = groupKeyFields.length > 0;

  // Ensure group fields are included in columns so they appear in the data page response
  groupKeyFields.forEach(field => {
    if (!columns.find(col => col.value === field || col.value === `.${field}`)) {
      columns.push({ value: field, display: 'false', useForSearch: false });
    }
  });

  columns = preProcessColumns(columns);

  useEffect(() => {
    if (listType === 'associated') {
      setOptions(Utils.getOptionList(props, getPConnect().getDataObject('')));
    }
  }, [theDatasource]);

  // Builds options with primary + secondary data from datapage results
  const buildOptionsFromResults = (results: any[]): IOption[] => {
    const optionsData: IOption[] = [];
    const displayColumn = getDisplayFieldsMetaData(columns);
    results?.forEach(element => {
      const val = element[displayColumn.primary]?.toString() || '';
      let secondaryNodes: ReactNode[] = [];
      let secondaryRaw: string[] = [];

      if (Array.isArray(columnsFormatter) && columnsFormatter.length > 0) {
        columnsFormatter.forEach((formatter, idx) => {
          if (formatter.config?.value) {
            const fmtPropName = getPropertyName(formatter.config.value);
            secondaryRaw.push(element[fmtPropName]?.toString() || '');

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
              const configObj = PCore.createPConnect(fieldMeta);
              const resolvedPConn = configObj.getPConnect();
              const resolvedProps = resolvedPConn.resolveConfigProps(resolvedPConn.getConfigProps());
              const Component = getComponentFromMap(formatter.type);
              if (Component) {
                secondaryNodes.push(<Component key={idx} {...resolvedProps} getPConnect={() => resolvedPConn} displayMode='DISPLAY_ONLY' />);
              } else {
                secondaryNodes.push(element[fmtPropName]?.toString() || '');
              }
            } catch {
              secondaryNodes.push(element[fmtPropName]?.toString() || '');
            }
          }
        });
      } else {
        secondaryRaw = displayColumn.secondary.map(col => element[col]?.toString()).filter(Boolean);
        secondaryNodes = [...secondaryRaw];
      }

      const obj: IOption = {
        key: String(element[displayColumn.key] ?? element.pyGUID ?? ''),
        value: val,
        ...(secondaryNodes.length > 0 && { secondary: secondaryNodes }),
        ...(secondaryRaw.length > 0 && { secondaryRaw }),
        ...(isGrouped && { group: element[groupKeyFields[0]]?.toString() || '' })
      };
      optionsData.push(obj);
    });
    // Sort options by group value so MUI renders groups contiguously
    if (isGrouped) {
      optionsData.sort((a, b) => (a.group || '').localeCompare(b.group || ''));
    }
    return optionsData;
  };

  useEffect(() => {
    if (!displayMode && listType !== 'associated') {
      getDataPage(datasource, parameters, context).then((results: any) => {
        setOptions(buildOptionsFromResults(results));
      });
    }
  }, []);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant={props.variant} />;
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

  useEffect(() => {
    setInputValue(selectedValue || '');
  }, [selectedValue]);

  const handleChange = (event: object, newValue) => {
    const val = newValue ? newValue.key : '';
    if (!newValue) {
      setInputValue('');
    }
    actionsApi.updateFieldValue(propName, val);
    const changePromise = (actionsApi as any).triggerFieldChange(propName, val);
    if (onRecordChange) {
      if (changePromise && changePromise.then) {
        changePromise.then(() => {
          onRecordChange({ ...event, id: val });
        });
      } else {
        onRecordChange({ ...event, id: val });
      }
    }
  };

  const handleInputValue = (event, newInputValue, reason) => {
    if (reason === 'selectOption') {
      setInputValue(newInputValue);
    }
  };

  // Sets values for all columns that have setProperty defined (mirrors setValuesToOtherAdditionalFields in constellation-frontend)
  const setValuesToAdditionalFields = (record: Record<string, unknown>) => {
    const setPropertyList = columns
      .filter(col => col.setProperty)
      .map(col => ({
        source: col.value,
        target: col.setProperty,
        key: col.key,
        primary: col.primary
      }));

    if (setPropertyList.length > 0) {
      setPropertyList.forEach(prop => {
        let valueToSet: string;
        if (prop.key === 'true') {
          valueToSet = record[prop.source]?.toString() || (record as any).pyGUID || '';
        } else {
          valueToSet = record[prop.source]?.toString() || '';
        }

        if (prop.target === 'Associated property') {
          handleEvent(actionsApi, 'changeNblur', propName, valueToSet);
        } else {
          const target = typeof prop.target === 'string' ? prop.target : '';
          const targetProp = target.startsWith('.') ? target : `.${target}`;
          actionsApi.updateFieldValue(targetProp, valueToSet, { associatedProperty: propName });
          actionsApi.triggerFieldChange(targetProp, valueToSet);
        }
      });
    }
  };

  // Re-fetches the options list (equivalent to initializeList in constellation-frontend)
  const refreshOptionsList = () => {
    if (!displayMode && listType !== 'associated') {
      getDataPage(datasource, parameters, context).then((results: any) => {
        setOptions(buildOptionsFromResults(results));
      });
    }
  };

  const createNewButtonHandler = () => {
    if (onCreateNew) {
      onCreateNew();
      return;
    }

    if (!contextClass) return;

    const normalizedReferenceType = typeof referenceType === 'string' ? referenceType.toLowerCase() : '';
    const isDataReference = normalizedReferenceType === 'data';
    const { CREATE_STAGE_DONE } = PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS;
    const DATA_OBJECT_CREATED = (PCore.getConstants().PUB_SUB_EVENTS as any).DATA_EVENTS?.DATA_OBJECT_CREATED;
    const eventType = isDataReference && DATA_OBJECT_CREATED ? DATA_OBJECT_CREATED : CREATE_STAGE_DONE;

    const createNewCallback = isDataReference
      ? (data: { classId?: string; data?: { responseData?: Record<string, unknown> } }) => {
          // Clear contexted cache before re-fetching
          PCore.getDataApi().clearContextedCache(context);

          const responseData = data?.data?.responseData;
          if (responseData) {
            // Set all mapped property values from the newly created record
            setValuesToAdditionalFields(responseData);
            const displayColumn = getDisplayFieldsMetaData(columns);
            if (onRecordChange) {
              const newKey = responseData[displayColumn.key]?.toString() || (responseData as any).pyGUID;
              onRecordChange({ id: newKey });
            }
          }

          // Refresh the options list
          refreshOptionsList();
          PCore.getPubSubUtils().unsubscribe(eventType, contextClass);
        }
      : (data: { caseId?: string; caseType?: string; ID?: string }) => {
          // Clear contexted cache before re-fetching
          PCore.getDataApi().clearContextedCache(context);

          const newCaseId = data.caseId?.split(' ').pop();
          if (data.caseType === contextClass) {
            const selectKey = data.ID || newCaseId;

            if (selectKey && listType !== 'associated' && datasource) {
              // Re-fetch data to find the newly created record and set all mapped properties
              getDataPage(datasource, parameters, context).then((results: any) => {
                setOptions(buildOptionsFromResults(results));

                // Find the newly created record by ID or caseId and set all properties
                const displayColumn = getDisplayFieldsMetaData(columns);
                const newRecord = results?.find((el: any) => el.ID === data.ID || (el[displayColumn.key] || el.pyGUID) === selectKey);
                if (newRecord) {
                  setValuesToAdditionalFields(newRecord);
                } else {
                  // Fallback: just set the key value
                  handleEvent(actionsApi, 'changeNblur', propName, selectKey);
                }
                if (onRecordChange) {
                  onRecordChange({ id: selectKey });
                }
              });
            }
            PCore.getPubSubUtils().unsubscribe(eventType, contextClass);
          }
        };

    // Build the create action if createNewRecord prop is not provided
    const triggerCreate = createNewRecord
      ? createNewRecord()
      : isDataReference
        ? getPConnect().getActionsApi().showDataObjectCreateView(contextClass)
        : thePConn.getActionsApi().createWork(contextClass, {
            openCaseViewAfterCreate: false,
            startingFields: {}
          });

    Promise.resolve(triggerCreate).then(() => {
      PCore.getPubSubUtils().subscribe(eventType, createNewCallback, contextClass);
      // Re-initialize the list (equivalent to initializeList() in constellation-frontend)
      refreshOptionsList();
    });
  };

  const showCreateButton = props.allowCreatingRecords === true;

  const CustomPaper = useCallback(
    (paperProps: React.HTMLAttributes<HTMLElement>) => {
      return (
        <Paper {...paperProps}>
          {paperProps.children}
          {showCreateButton && (
            <>
              <Divider />
              <Button
                fullWidth
                startIcon={<AddIcon />}
                onMouseDown={event => {
                  event.preventDefault();
                }}
                onClick={createNewButtonHandler}
                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, px: 2 }}
              >
                {createNewLabel}
              </Button>
            </>
          )}
        </Paper>
      );
    },
    [showCreateButton, createNewButtonHandler, createNewLabel]
  );

  if (readOnly) {
    const theValAsString = options?.find(opt => opt.key === value)?.value;
    return <TextInput {...props} value={theValAsString} />;
  }
  // Need to use both getOptionLabel and getOptionSelected to map our
  //  key/value structure to what Autocomplete expects
  return (
    <Autocomplete
      slots={{ paper: CustomPaper }}
      options={options}
      getOptionLabel={(option: IOption) => {
        return option.value ? option.value : '';
      }}
      {...(isGrouped && { groupBy: (option: IOption) => option.group || '' })}
      isOptionEqualToValue={(option: any) => {
        return option.value ? option.value : '';
      }}
      fullWidth
      onChange={handleChange}
      value={selectedValue}
      inputValue={inputValue}
      onInputChange={handleInputValue}
      filterOptions={createFilterOptions<IOption>({
        stringify: option => {
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
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                {option.secondary.map((sec, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {sec}
                    {i < option.secondary!.length - 1 && <span style={{ margin: '0 4px' }}>{'\u00B7'}</span>}
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
          sx={getFieldSx(status)}
        />
      )}
    />
  );
}
