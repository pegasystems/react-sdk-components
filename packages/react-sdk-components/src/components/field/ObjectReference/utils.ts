import { Utils } from '../../helpers/utils';

export const SELECTION_MODE = { SINGLE: 'single', MULTI: 'multi' };

const getLeafNameFromPropertyName = (property: string) => property?.substr(property.lastIndexOf('.') + 1);

const isSelfReferencedProperty = (param: string, referenceProp: string) => {
  const propName = getPropertyValue(param);
  const propNameAfterDot = propName.substring(propName.indexOf('.') + 1);
  return referenceProp?.includes(propNameAfterDot);
};

export const AT_FILTEREDLIST = '@FILTERED_LIST';
export const AT_PROPERTY = '@P';
export const SQUARE_BRACKET_START = '[';
export const SQUARE_BRACKET_END = ']';

export const SIMPLE_TABLE_MANUAL_READONLY = 'SimpleTableManualReadOnly';
export const PAGE = '!P!';
export const PAGELIST = '!PL!';
export const PERIOD = '.';
const AT = '@';

export function updatePageListPropertyValue(value: string) {
  value = value.substring(0, value.indexOf(SQUARE_BRACKET_START)) + value.substring(value.indexOf(SQUARE_BRACKET_END) + 1);
  return value;
}

export function getPropertyValue(value: string) {
  if (value.startsWith(AT)) {
    value = value.substring(value.indexOf(' ') + 1);
    if (value.startsWith(PERIOD)) value = value.substring(1);
  }
  if (value.includes(SQUARE_BRACKET_START)) {
    value = updatePageListPropertyValue(value);
  }
  return value;
}

const getReferenceProp = (config: any) => {
  if (config.mode === SELECTION_MODE.MULTI) {
    return config?.pagelistValue?.substring(4) ?? '';
  }
  const property = config.value;
  const arr = property?.split('.') ?? [];
  if (arr.length > 1) {
    arr.pop();
    return arr.slice(1).join('.');
  }
  return '';
};

const getCompositeKeys = (c11nEnv: any, property: string) => {
  const { datasource: { parameters = {} } = {} } = c11nEnv.getFieldMetadata(property) || {};
  return Object.values(parameters).reduce((compositeKeys: string[], param: any) => {
    if (isSelfReferencedProperty(param, property)) {
      let propName = getPropertyValue(param);
      propName = propName.substring(propName.indexOf('.') + 1);
      compositeKeys.push(propName);
    }
    return compositeKeys;
  }, []);
};

export const generateColumns = (config: any, pConn: any, referenceType: string) => {
  const displayField = getLeafNameFromPropertyName(config.displayField);
  const referenceProp = getReferenceProp(config);
  const compositeKeys = getCompositeKeys(pConn, referenceProp);
  let value = getLeafNameFromPropertyName(config.mode === SELECTION_MODE.MULTI ? config.selectionKey : config.value);

  const columns: any[] = [];
  if (displayField) {
    columns.push({
      value: displayField,
      display: 'true',
      useForSearch: true,
      primary: 'true'
    });
  }
  if (value && compositeKeys.indexOf(value) !== -1) {
    if (!config.value) {
      config.value = `@P .${referenceProp}.${value}`;
    }
    columns.push({
      value,
      setProperty: 'Associated property',
      key: 'true'
    });
  } else {
    const actualValue = compositeKeys.length > 0 ? compositeKeys[0] : value;
    config.value = `@P .${referenceProp}.${actualValue}`;
    value = actualValue;
    columns.push({
      value: actualValue,
      setProperty: 'Associated property',
      key: 'true'
    });
  }

  config.datasource = {
    fields: {
      key: `.${getLeafNameFromPropertyName(config.value)}`,
      text: `.${getLeafNameFromPropertyName(config.displayField)}`,
      value: `.${getLeafNameFromPropertyName(config.value)}`
    }
  };

  if (referenceType === 'Case') {
    columns.push({
      secondary: 'true',
      display: 'true',
      value: Utils.getMappedKey('pyID'),
      useForSearch: true
    });
  }

  compositeKeys.forEach(key => {
    const descriptorsFieldName = `.${key}`;
    if (value !== key)
      columns.push({
        value: descriptorsFieldName,
        display: 'false',
        secondary: 'true',
        useForSearch: false,
        setProperty: `.${referenceProp}.${key}`
      });
  });

  config.columns = columns;
};

export const addCompositeKeysToConfig = (config: any, pConn: any) => {
  const referenceProp = getReferenceProp(config);
  const fieldMetadata = pConn.getFieldMetadata(referenceProp) || {};
  const { datasource: { parameters: fieldParameters = {} } = {} } = fieldMetadata;
  const compositeKeys: string[] = [];
  Object.values(fieldParameters).forEach((param: any) => {
    if (isSelfReferencedProperty(param, referenceProp)) {
      compositeKeys.push(param);
    }
  });
  config.compositeKeys = compositeKeys;
};

export const getDataRelationshipContextFromKey = (key: string) => {
  const firstIndexOfDot = key.indexOf('.');
  if (firstIndexOfDot > -1) {
    const lastIndexOfDot = key.lastIndexOf('.');
    if (lastIndexOfDot > firstIndexOfDot) {
      return key.substring(firstIndexOfDot + 1, lastIndexOfDot);
    }
  }
  return '';
};

export const createNewRecord = ({
  referenceType,
  disableStartingFieldsForReference,
  pConn,
  contextClass,
  startingFields,
  getPConnect
}: {
  referenceType: string;
  disableStartingFieldsForReference: boolean;
  pConn: any;
  contextClass: string;
  startingFields: Record<string, any>;
  getPConnect: any;
}) => {
  if (referenceType === 'Case') {
    if (!disableStartingFieldsForReference) {
      // @ts-ignore
      startingFields[PCore.getNameSpaceUtils().getDefaultQualifiedName('pyAddCaseContextPage')] = {
        pyID: pConn.getCaseInfo().getKey()?.split(' ')?.pop()
      };
    }
    return pConn.getActionsApi().createWork(contextClass, {
      openCaseViewAfterCreate: false,
      startingFields
    });
  }
  if (referenceType === 'Data') {
    return getPConnect().getActionsApi().showDataObjectCreateView(contextClass);
  }
};

export const getAdditionalInfo = (pConn: any, propertyName: string) => {
  const parentFieldMetadata = pConn.getFieldMetadata(getDataRelationshipContextFromKey(propertyName));
  return parentFieldMetadata?.additionalInformation
    ? {
        content: parentFieldMetadata.additionalInformation
      }
    : undefined;
};

export const camelCase = (str: string) => {
  return str.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : '')).replace(/^[A-Z]/, char => char.toLowerCase());
};
