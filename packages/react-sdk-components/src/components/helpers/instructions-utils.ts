const isSelfReferencedProperty = (param, referenceProp) => {
  const [, parentPropName] = param.split('.');
  const referencePropParent = referenceProp?.split('.').pop();
  return parentPropName === referencePropParent;
};

const updateNewInstuctions = (c11nEnv, selectionList) => {
  const { datasource: { parameters = {} } = {} } = c11nEnv.getFieldMetadata(selectionList) || {};
  const compositeKeys: any = [];
  Object.values(parameters).forEach((param: any) => {
    if (isSelfReferencedProperty(param, selectionList)) compositeKeys.push(param.substring(param.lastIndexOf('.') + 1));
  });
  c11nEnv.getListActions().initDefaultPageInstructions(selectionList, compositeKeys);
};

const insertInstruction = (c11nEnv, selectionList, selectionKey, primaryField, item) => {
  const { id, primary } = item;
  const actualProperty = selectionKey.startsWith('.') ? selectionKey.substring(1) : selectionKey;
  const displayProperty = primaryField.startsWith('.') ? primaryField.substring(1) : primaryField;
  const rows = c11nEnv.getValue(`${c11nEnv.getPageReference()}${selectionList}`) || [];
  const startIndex = rows.length;
  const content = {
    [actualProperty]: id,
    [displayProperty]: primary,
    nonFormProperties: actualProperty !== displayProperty ? [displayProperty] : []
  };
  c11nEnv.getListActions().insert(content, startIndex);
};

const deleteInstruction = (c11nEnv, selectionList, selectionKey, item) => {
  const { id } = item;
  const actualProperty = selectionKey.startsWith('.') ? selectionKey.substring(1) : selectionKey;
  const rows = c11nEnv.getValue(`${c11nEnv.getPageReference()}${selectionList}`) || [];
  const index = rows.findIndex(row => row[actualProperty] === id);
  c11nEnv.getListActions().deleteEntry(index);
};

export { updateNewInstuctions, insertInstruction, deleteInstruction };
