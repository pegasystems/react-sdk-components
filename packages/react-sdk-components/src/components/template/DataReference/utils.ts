const isSelfReferencedProperty = (param, referenceProp) => {
  const [, parentPropName] = param.split('.');
  const referencePropParent = referenceProp?.split('.').pop();
  return parentPropName === referencePropParent;
};

export function getFieldMeta(getPConnect, dataRelationshipContext) {
  const pConn = getPConnect();
  const { selectionMode, selectionList } = pConn.getConfigProps();
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;

  const isMultiSelectMode = selectionMode === MULTI;

  const pageReference = pConn.getPageReference();
  let referenceProp = isMultiSelectMode ? selectionList.substring(1) : pageReference.substring(pageReference.lastIndexOf('.') + 1);
  // Replace here to use the context name instead
  let contextPageReference = null;
  if (dataRelationshipContext !== null && selectionMode === 'single') {
    referenceProp = dataRelationshipContext;
    contextPageReference = pageReference.concat('.').concat(referenceProp);
  }

  const fieldMetadata =
    (isMultiSelectMode ? pConn.getFieldMetadata(`${referenceProp}`) : pConn.getCurrentPageFieldMetadata(contextPageReference)) ?? {};
  const { datasource: { parameters: fieldParameters = {} } = {} } = fieldMetadata;
  const compositeKeys: any = [];
  Object.values(fieldParameters).forEach((param: any) => {
    if (isSelfReferencedProperty(param, referenceProp)) compositeKeys.push(param.substring(param.lastIndexOf('.') + 1));
  });

  return { compositeKeys, fieldMetadata };
}

/**
 * returns array of self-referenced properties of the datasource
 * Ex: returns ["@P .DataRef.pyGUID", "@P .DataRef.customerID"]
 */
const getCompositeKeys = (pConnect, property) => {
  const fieldMetadata = pConnect.getFieldMetadata(property) || {};
  const { datasource: { parameters: fieldParameters = {} } = {} } = fieldMetadata;
  const compositeKeys: any = [];
  Object.values(fieldParameters).forEach((param) => {
    if (isSelfReferencedProperty(param, property)) {
      compositeKeys.push(param);
    }
  });
  return compositeKeys;
};

export const getFirstChildConfig = ({
  firstChildMeta,
  getPConnect,
  rawViewMetadata,
  contextClass,
  dataReferenceConfigToChild,
  isCreateNewReferenceEnabled,
  disableStartingFieldsForReference,
  pyID
}) => {
  const config = {
    ...firstChildMeta.config,
    ...dataReferenceConfigToChild
  };
  const compositeKeys = getCompositeKeys(getPConnect(), dataReferenceConfigToChild?.dataRelationshipContext);
  return {
    ...config,
    viewName: getPConnect().getCurrentView(),
    referenceList: config.referenceList ?? rawViewMetadata.config.referenceList,
    parameters: rawViewMetadata.config.parameters,
    localeReference: rawViewMetadata.config.localeReference,
    contextClass: config.contextClass || rawViewMetadata?.config?.contextClass || rawViewMetadata?.config?.targetObjectClass,
    allowAddingNewRecords: firstChildMeta.type === 'SimpleTableSelect' && isCreateNewReferenceEnabled ? true : undefined,
    actions: firstChildMeta.type === 'SimpleTableSelect' &&
      isCreateNewReferenceEnabled && [
        {
          action: 'ADD_CASE',
          config: {
            label: '@L Add',
            caseType: contextClass,
            inputFields: disableStartingFieldsForReference
              ? {}
              : {
                  [`.pyAddCaseContextPage.${pyID}`]: `@P .${pyID}`
                }
          }
        }
      ],
    compositeKeys
  };
};
