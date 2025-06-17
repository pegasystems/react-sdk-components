import { useContext, useState } from 'react';

import DataReferenceAdvancedSearchContext from '../DataReference/DataReferenceAdvancedSearchContext';
import { getFirstChildConfig } from '../DataReference/utils';

import SearchGroups from './SearchGroups';

export default function AdvancedSearch(props) {
  const { getPConnect, targetObjectClass, localeReference } = props;
  //@ts-ignore
  const { dataReferenceConfigToChild, isCreateNewReferenceEnabled, disableStartingFieldsForReference, pyID, searchSelectCacheKey
  } = useContext(DataReferenceAdvancedSearchContext);

  const {
    selectionMode,
    value: singleSelectFieldValue,
    readonlyContextList: multiSelectField
  } = dataReferenceConfigToChild;

  let isSelectionExist = false;
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;

  if (selectionMode === MULTI) {
    isSelectionExist = getPConnect().getValue(multiSelectField)?.length || false;
  } else {
    isSelectionExist = getPConnect().getValue(singleSelectFieldValue) || false;
  }

  const [showRecords, setShowRecords] = useState(isSelectionExist);

  const pConn = getPConnect();
  const rawViewMetadata = pConn.getRawMetadata();

  const searchFieldsSet = new Set();
  const searchFields: any = [];
  rawViewMetadata.config.searchGroups.forEach((group) => {
    group.children.forEach((child) => {
      if (!searchFieldsSet.has(child.config.value) && !child.config.validator) {
        searchFields.push(child);
        searchFieldsSet.add(child.config.value);
      }
    });
  });

  const firstChildPConnect = getPConnect().getChildren()[0].getPConnect;
  const [firstChildMeta] = rawViewMetadata.children;

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  // @ts-ignore
  const cache = PCore.getNavigationUtils().getComponentCache(searchSelectCacheKey) ?? {};

  const editableFieldComp = firstChildPConnect().createComponent({
    type: firstChildMeta.type,
    config: {
      ...getFirstChildConfig({
        firstChildMeta,
        getPConnect,
        rawViewMetadata,
        contextClass: targetObjectClass,
        dataReferenceConfigToChild,
        isCreateNewReferenceEnabled,
        disableStartingFieldsForReference,
        pyID
      }),
      searchFields,
      showRecords,
      label: localizedVal('Search results', 'DataReference'),
      searchSelectCacheKey,
      cache
    }
  });

  const { selectionList, dataRelationshipContext } = editableFieldComp.props.getPConnect().getConfigProps();
  const editableField = selectionMode === MULTI ? selectionList.substring(1) : dataRelationshipContext;

  const searchGroupsProps = {
    getPConnect,
    editableField,
    localeReference,
    setShowRecords,
    searchSelectCacheKey,
    cache
  };

  return (
    <>
      <SearchGroups {...searchGroupsProps} />
      {editableFieldComp}
    </>
  );
}
