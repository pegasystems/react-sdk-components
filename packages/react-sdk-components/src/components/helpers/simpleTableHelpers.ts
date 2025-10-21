import { Utils } from './utils';

export const TABLE_CELL = 'SdkRenderer';
export const DELETE_ICON = 'DeleteIcon';

// BUG-615253: Workaround for autosize in table with lazy loading components
/* istanbul ignore next */
function getFieldWidth(field, label) {
  let width: number;
  switch (field.type) {
    case 'Time':
      width = 150;
      break;
    case 'Date':
      width = 160;
      break;
    case 'DateTime':
      width = 205;
      break;
    case 'AutoComplete':
    case 'TextArea':
      width = 190;
      break;
    case 'Currency':
    case 'TextInput':
      width = 182;
      break;
    case 'Checkbox':
      // eslint-disable-next-line no-case-declarations
      const text = document.createElement('span');
      document.body.appendChild(text);
      text.style.fontSize = '13px';
      text.style.position = 'absolute';
      text.innerHTML = label;
      width = Math.ceil(text.clientWidth) + 30;
      document.body.removeChild(text);
      break;
    default:
      width = 180;
  }
  return width;
}

export const getContext = (thePConn) => {
  const contextName = thePConn.getContextName();
  const pageReference = thePConn.getPageReference();
  const { referenceList } = thePConn.getStateProps()?.config || thePConn.getStateProps();
  const pageReferenceForRows = referenceList.startsWith('.') ? `${pageReference}.${referenceList.substring(1)}` : referenceList;

  // removing "caseInfo.content" prefix to avoid setting it as a target while preparing pageInstructions
  // skipping the removal as StateMachine itself is removing this case info prefix while preparing pageInstructions
  // referenceList = pageReferenceForRows.replace(
  //   PCore.getConstants().CASE_INFO.CASE_INFO_CONTENT,
  //   ""
  // );

  return {
    contextName,
    referenceListStr: referenceList,
    pageReferenceForRows
  };
};

export const populateRowKey = (rawData) => {
  return rawData.map((row: any, index: number) => {
    return { ...row, index };
  });
};

export const getApiContext = (processedData, pConnect, reorderCB) => {
  return {
    fetchData: () => {
      return new Promise((resolve) => {
        resolve({
          data: processedData,
          filteredRecordCount: processedData.length,
          totalRecordCount: processedData.length
        });
      });
    },
    fetchPersonalizations: () => {
      return Promise.resolve({});
    },
    applyRowReorder: (sourceKey, destinationKey) => {
      // indexes are keys for simple table so, it should work.
      reorderCB();
      return Promise.resolve(pConnect.getListActions().reorder(parseInt(sourceKey, 10), parseInt(destinationKey, 10)));
    }
  };
};

const PRIMARY_FIELDS = 'pyPrimaryFields';
const SUPPORTED_FIELD_TYPES = [
  'Address',
  'TextArea',
  'TextInput',
  'Phone',
  'Email',
  'Time',
  'URL',
  'Percentage',
  'Integer',
  'Decimal',
  'Date',
  'DateTime',
  'Currency',
  'Checkbox',
  'Dropdown',
  'AutoComplete',
  'UserReference',
  'RichText'
];

export const getConfigFields = (rawFields, contextClass, primaryFieldsViewIndex) => {
  let primaryFields: any = [];
  let configFields: any = [];

  if (primaryFieldsViewIndex > -1) {
    let primaryFieldVMD: any = PCore.getMetadataUtils().resolveView(PRIMARY_FIELDS);
    if (Array.isArray(primaryFieldVMD)) {
      primaryFieldVMD = primaryFieldVMD.find((primaryFieldView) => primaryFieldView.classID === contextClass);
      primaryFields = primaryFieldVMD?.children?.[0]?.children || [];
    } else if (primaryFieldVMD?.classID === contextClass) {
      primaryFields = primaryFieldVMD?.children?.[0]?.children || [];
    }

    if (primaryFields.length) {
      primaryFields = primaryFields.filter((primaryField) => SUPPORTED_FIELD_TYPES.includes(primaryField.type));
    }
  }

  configFields = [...rawFields.slice(0, primaryFieldsViewIndex), ...primaryFields, ...rawFields.slice(primaryFieldsViewIndex + 1)];
  // filter duplicate fields after combining raw fields and primary fields
  return configFields.filter((field, index) => configFields.findIndex((_field) => field.config?.value === _field.config?.value) === index);
};

export const buildMetaForListView = (fieldMetadata, fields, type, ruleClass, name, propertyLabel, isDataObject, parameters) => {
  return {
    name,
    config: {
      type,
      referenceList: fieldMetadata.datasource.name,
      parameters: parameters ?? fieldMetadata.datasource.parameters,
      personalization: false,
      isDataObject,
      grouping: true,
      globalSearch: true,
      reorderFields: true,
      toggleFieldVisibility: true,
      title: propertyLabel,
      personalizationId: '' /* TODO */,
      template: 'ListView',
      presets: [
        {
          name: 'presets',
          template: 'Table',
          config: {},
          children: [
            {
              name: 'Columns',
              type: 'Region',
              children: fields
            }
          ],
          label: propertyLabel,
          id: 'P_' /* TODO */
        }
      ],
      ruleClass
    }
  };
};

export function isFLProperty(label) {
  return label?.startsWith('@FL');
}

/**
 * [getFieldLabel]
 * Description - A utility that returns resolved field label for "@FL" annotation i.e from data model.
 * @param {Object} fieldConfig
 * @returns {string} resolved label string
 *
 * example:
 * fieldConfig = {label: "@FL .pyID", classID: "TestCase-Work"};
 * return "Case ID"
 */
export function getFieldLabel(fieldConfig) {
  const { label, classID, caption } = fieldConfig;
  let fieldLabel = (label ?? caption)?.substring(4);
  const labelSplit = fieldLabel?.split('.');
  const propertyName = labelSplit?.pop();
  const fieldMetaData: any = PCore.getMetadataUtils().getPropertyMetadata(propertyName, classID) ?? {};
  fieldLabel = fieldMetaData.label ?? fieldMetaData.caption ?? propertyName;
  return fieldLabel;
}

export const updateFieldLabels = (fields, configFields, primaryFieldsViewIndex, pConnect, options) => {
  const labelsOfFields: any = [];
  const { columnsRawConfig = [] } = options;
  fields.forEach((field, idx) => {
    const rawColumnConfig = columnsRawConfig[idx]?.config;
    if (field.config.value === PRIMARY_FIELDS) {
      labelsOfFields.push('');
    } else if (isFLProperty(rawColumnConfig?.label ?? rawColumnConfig?.caption)) {
      labelsOfFields.push(getFieldLabel(rawColumnConfig) || field.config.label || field.config.caption);
    } else {
      labelsOfFields.push(field.config.label || field.config.caption);
    }
  });

  if (primaryFieldsViewIndex > -1) {
    const totalPrimaryFieldsColumns = configFields.length - fields.length + 1;
    if (totalPrimaryFieldsColumns) {
      const primaryFieldLabels: any = [];
      for (let i = primaryFieldsViewIndex; i < primaryFieldsViewIndex + totalPrimaryFieldsColumns; i += 1) {
        let label = configFields[i].config?.label;
        if (isFLProperty(label)) {
          label = getFieldLabel(configFields[i].config);
        } else if (label.startsWith('@')) {
          label = label.substring(3);
        }
        if (pConnect) {
          label = pConnect.getLocalizedValue(label);
        }
        primaryFieldLabels.push(label);
      }
      labelsOfFields.splice(primaryFieldsViewIndex, 1, ...primaryFieldLabels);
    } else {
      labelsOfFields.splice(primaryFieldsViewIndex, 1);
    }
  }
  return labelsOfFields;
};

export const buildFieldsForTable = (configFields, pConnect, showDeleteButton, options) => {
  const { primaryFieldsViewIndex, fields } = options;

  // get resolved field labels for primary fields raw config included in configFields
  const fieldsLabels = updateFieldLabels(fields, configFields, primaryFieldsViewIndex, pConnect, {
    columnsRawConfig: pConnect.getRawConfigProps()?.children?.find((item) => item?.name === 'Columns')?.children
  });

  const fieldDefs = configFields.map((field, index) => {
    return {
      type: 'text',
      label: fieldsLabels[index],
      fillAvailableSpace: !!field.config.fillAvailableSpace,
      id: `${index}`,
      name: field.config.value.substr(4),
      cellRenderer: TABLE_CELL,
      sort: false,
      noContextMenu: true,
      showMenu: false,
      meta: {
        ...field
      },
      // BUG-615253: Workaround for autosize in table with lazy loading components
      width: getFieldWidth(field, fields[index].config.label)
    };
  });

  // ONLY add DELETE_ICON to fields when the table is requested as EDITABLE
  if (showDeleteButton) {
    fieldDefs.push({
      type: 'text',
      id: fieldDefs.length,
      cellRenderer: DELETE_ICON,
      sort: false,
      noContextMenu: true,
      showMenu: false,
      // BUG-615253: Workaround for autosize in table with lazy loading components
      width: 46
    });
  }

  return fieldDefs;
};

export const createMetaForTable = (fields, renderMode) => {
  return {
    height: {
      minHeight: 'auto',
      fitHeightToElement: 'fitHeightToElement',
      deltaAdjustment: 'deltaAdjustment',
      autoSize: true
    },
    fieldDefs: fields,
    itemKey: 'index',
    grouping: false,
    reorderFields: false,
    reorderItems: renderMode === 'Editable',
    dragHandle: renderMode === 'Editable',
    globalSearch: false,
    personalization: false,
    toggleFieldVisibility: false,
    toolbar: false,
    footer: false,
    filterExpression: null,
    editing: false,
    timezone: PCore.getEnvironmentInfo().getTimeZone()
  };
};

/**
 * This method returns a callBack function for Add action.
 * @param {object} pConnect - PConnect object
 * @param {number} index - index of the page list to add
 */
export const getAddRowCallback = (pConnect, index) => {
  return () => pConnect.getListActions().insert({}, index, ''); // 3rd arg null until typedef marked correctly as optional
};

/**
 * This method creates a PConnect object with proper options for Add and Delete actions
 * @param {string} contextName - contextName
 * @param {string} referenceList - referenceList
 * @param {string} pageReference - pageReference
 */
// NOTE: use of type "any" is required since TypeScript doesn't allow private/protected properties
//  to be exported from a class (TS4094 error)
export function createPConnect(contextName, referenceList, pageReference): any {
  const options = {
    context: contextName,
    pageReference,
    referenceList
  };

  // create PConnect object
  const config = { meta: {}, options };
  const { getPConnect } = PCore.createPConnect(config);

  return getPConnect();
}

export const filterData = (filterByColumns) => {
  return function filteringData(item) {
    let bKeep = true;
    for (const filterObj of filterByColumns) {
      if (filterObj.containsFilterValue !== '' || filterObj.containsFilter === 'null' || filterObj.containsFilter === 'notnull') {
        let value: any;
        let filterValue: any;

        switch (filterObj.type) {
          case 'Date':
          case 'DateTime':
          case 'Time':
            value = item[filterObj.ref] !== null || item[filterObj.ref] !== '' ? Utils.getSeconds(item[filterObj.ref]) : null;
            filterValue =
              filterObj.containsFilterValue !== null && filterObj.containsFilterValue !== '' ? Utils.getSeconds(filterObj.containsFilterValue) : null;

            switch (filterObj.containsFilter) {
              case 'notequal':
                // becasue filterValue is in minutes, need to have a range of less than 60 secons

                if (value !== null && filterValue !== null) {
                  // get rid of milliseconds
                  value /= 1000;
                  filterValue /= 1000;

                  const diff = value - filterValue;
                  if (diff >= 0 && diff < 60) {
                    bKeep = false;
                  }
                }

                break;

              case 'equal':
                // becasue filterValue is in minutes, need to have a range of less than 60 secons

                if (value !== null && filterValue !== null) {
                  // get rid of milliseconds
                  value /= 1000;
                  filterValue /= 1000;

                  const diff = value - filterValue;
                  if (diff !== 0) {
                    bKeep = false;
                  }
                }

                break;

              case 'after':
                if (value < filterValue) {
                  bKeep = false;
                }
                break;

              case 'before':
                if (value > filterValue) {
                  bKeep = false;
                }
                break;

              case 'null':
                if (value !== null) {
                  bKeep = false;
                }
                break;

              case 'notnull':
                if (value === null) {
                  bKeep = false;
                }
                break;

              default:
                break;
            }
            break;

          default:
            value = item[filterObj.ref].toLowerCase();
            filterValue = filterObj.containsFilterValue.toLowerCase();

            switch (filterObj.containsFilter) {
              case 'contains':
                if (value.indexOf(filterValue) < 0) {
                  bKeep = false;
                }
                break;

              case 'equals':
                if (value !== filterValue) {
                  bKeep = false;
                }
                break;

              case 'startswith':
                if (value.indexOf(filterValue) !== 0) {
                  bKeep = false;
                }
                break;

              default:
                break;
            }

            break;
        }
      }

      // if don't keep stop filtering
      if (!bKeep) {
        break;
      }
    }
    return bKeep;
  };
};
