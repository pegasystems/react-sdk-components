import React, { createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Grid2, Select, MenuItem, Box } from '@mui/material';

import createPConnectComponent from '../../../../bridge/react_pconnect';
import TemplateContext from '../TemplateContext';
import componentCachePersistUtils from '../SearchGroup/persistUtils';

import { getCacheInfo, isValidInput } from './utils';
import { useCacheWhenListViewReady } from './hooks';

export const initializeSearchFields = (searchFields, getPConnect, referenceListClassID, searchFieldRestoreValues = {}) => {
  const filtersProperties = {};
  searchFields.forEach((field) => {
    let val = '';
    const { value, defaultValue = '' } = field.config;
    const propPath = PCore.getAnnotationUtils().getPropertyName(value);

    if (searchFieldRestoreValues[propPath]) {
      val = searchFieldRestoreValues[propPath];
    } else if (PCore.getAnnotationUtils().isProperty(defaultValue)) {
      val = getPConnect().getValue(defaultValue.split(' ')[1]);
    } else if (defaultValue.startsWith('@L')) {
      val = defaultValue.split(' ')[1];
    } else {
      val = defaultValue;
    }

    filtersProperties[propPath] = val;

    const valueSplit = value.split('@P ')[1]?.split('.').filter(Boolean) ?? [];
    valueSplit.pop();

    if (valueSplit.length) {
      let path = '';
      let currentClassID = referenceListClassID;
      valueSplit.forEach((item) => {
        path = path.length ? `${path}.${item}` : item;
        currentClassID = (PCore.getMetadataUtils().getPropertyMetadata(item, currentClassID) as any).pageClass;
        if (currentClassID) {
          filtersProperties[`${path}.classID`] = currentClassID;
        }
      });
    }
  });
  return filtersProperties;
};

const flattenObj = (obj) => {
  const result = {};
  Object.keys(obj).forEach((key) => {
    if (!['context_data', 'pageInstructions'].includes(key)) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        const temp = flattenObj(obj[key]);
        Object.keys(temp).forEach((nestedKey) => {
          result[`${key}.${nestedKey}`] = temp[nestedKey];
        });
      } else {
        result[key] = obj[key];
      }
    }
  });
  return result;
};

export default function SearchGroups(props) {
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const { getPConnect, editableField, localeReference, setShowRecords, searchSelectCacheKey, cache } = props;
  const referenceFieldName = editableField.replaceAll('.', '_');

  const state: any = useRef({ searchFields: {}, activeGroupId: '' }).current;
  const options = componentCachePersistUtils.getComponentStateOptions(getPConnect);

  const { searchGroups: groups, referenceList } = getPConnect().getConfigProps();
  const { useCache, initialActiveGroupId } = getCacheInfo(cache, groups);
  const [activeGroupId, setActiveGroupId] = useState(initialActiveGroupId);
  const [transientItemID, setTransientItemID] = useState<any>(null);
  const [previousFormValues, setPreviousFormValues] = useState<any>(null);
  const viewName = getPConnect().getCurrentView();

  const rawGroupsConfig = getPConnect().getRawConfigProps().searchGroups;
  const activeGroupIndex = groups.findIndex((group) => group.config.id === activeGroupId);
  const { children: searchFieldsChildren = [] } = activeGroupIndex !== -1 ? rawGroupsConfig[activeGroupIndex] : {};
  const searchFields = searchFieldsChildren.map((field) => ({
    ...field,
    config: { ...field.config, isSearchField: true }
  }));

  const searchByRef = useRef(null);
  const searchFieldsRef = useRef(null);
  const isValidatorField = searchFields.some((field) => field.config.validator);
  const { classID: referenceListClassID } = PCore.getMetadataUtils().getDataPageMetadata(referenceList) as any;

  const initialSearchFields = useMemo(
    () =>
      initializeSearchFields(
        searchFields,
        getPConnect,
        referenceListClassID,
        useCache && cache.activeGroupId === activeGroupId ? cache.searchFields : {}
      ),
    [activeGroupId, getPConnect, cache.searchFields]
  );

  useEffect(() => {
    if (transientItemID) {
      const filtersWithClassID = {
        ...initialSearchFields,
        classID: referenceListClassID
      };
      // @ts-ignore
      PCore.getContainerUtils().replaceTransientData({ transientItemID, data: filtersWithClassID });
    }
  }, [activeGroupId]);

  useEffect(() => {
    const filtersWithClassID = {
      ...initialSearchFields,
      classID: referenceListClassID
    };

    const transientId = getPConnect()
      .getContainerManager()
      .addTransientItem({ id: `${referenceFieldName}-${viewName}`, data: filtersWithClassID });
    setTransientItemID(transientId);
  }, []);

  const getFilterData = useCallback(() => {
    // @ts-ignore
    let changes = PCore.getFormUtils().getSubmitData(transientItemID, {
      isTransientContext: true,
      includeDisabledFields: true
    });

    if (Object.keys(cache.searchFields ?? {}).length > 0 && Object.keys(changes).length === 1) {
      changes = cache.searchFields;
    }

    const formValues = flattenObj(changes);

    if (!PCore.isDeepEqual(previousFormValues, formValues) && PCore.getFormUtils().isFormValid(transientItemID) && isValidInput(formValues)) {
      if (isValidatorField) {
        // @ts-ignore
        PCore.getMessageManager().clearContextMessages({ context: transientItemID });
      }
      setPreviousFormValues(formValues);
      setShowRecords(true);
      PCore.getPubSubUtils().publish(PCore.getEvents().getTransientEvent().UPDATE_PROMOTED_FILTERS, {
        payload: formValues,
        showRecords: true,
        viewName
      });
    }

    state.activeGroupId = activeGroupId;
    state.searchFields = changes;
    state.selectedCategory = viewName;

    componentCachePersistUtils.setComponentCache({ cacheKey: searchSelectCacheKey, state, options });
  }, [transientItemID, setShowRecords, viewName, activeGroupId, previousFormValues]);

  const resetFilterData = useCallback(() => {
    // @ts-ignore
    PCore.getNavigationUtils().resetComponentCache(searchSelectCacheKey);
    const resetPayload = {
      transientItemID,
      data: initializeSearchFields(searchFields, getPConnect, referenceListClassID),
      options: { reset: true }
    };
    // @ts-ignore
    PCore.getContainerUtils().updateTransientData(resetPayload);
  }, [transientItemID, initialSearchFields]);

  useCacheWhenListViewReady(cache, viewName, useCache, getFilterData, searchSelectCacheKey);

  const searchDropdown = groups.length > 1 && (
    <Grid2 container spacing={2}>
      <Select value={activeGroupId} onChange={(e) => setActiveGroupId(e.target.value)} ref={searchByRef} fullWidth>
        {groups.map((group) => (
          <MenuItem key={group.config.id} value={group.config.id}>
            {group.config.label}
          </MenuItem>
        ))}
      </Select>
    </Grid2>
  );

  const actionButtons = (
    <Box display='flex' gap={2}>
      <Button variant='outlined' onClick={resetFilterData}>
        {localizedVal('Reset', 'SimpleTable')}
      </Button>
      <Button variant='contained' onClick={getFilterData}>
        {localizedVal('Search', 'SimpleTable')}
      </Button>
    </Box>
  );

  const searchFieldsViewConfig = {
    name: 'SearchFields',
    type: 'View',
    config: {
      template: 'DefaultForm',
      NumCols: '3',
      contextName: transientItemID,
      readOnly: false,
      context: transientItemID,
      localeReference
    },
    children: [
      {
        name: 'Fields',
        type: 'Region',
        children: searchFields
      }
    ]
  };

  const searchFieldsC11nEnv = PCore.createPConnect({
    meta: searchFieldsViewConfig,
    options: {
      hasForm: true,
      contextName: transientItemID
    }
  });

  const templateContext = useContext(TemplateContext);
  const templateContextValue = useMemo(() => ({ ...templateContext, outerColumnCount: undefined }), []);

  const searchFieldsViewComp = transientItemID ? (
    <TemplateContext.Provider value={templateContextValue}>
      <div ref={searchFieldsRef}>{createElement(createPConnectComponent(), { ...searchFieldsC11nEnv })}</div>
    </TemplateContext.Provider>
  ) : null;

  const childrenToRender = [searchDropdown, searchFieldsViewComp, actionButtons];

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {childrenToRender.map((child, index) => (
        <React.Fragment key={index}>{child}</React.Fragment>
      ))}
    </Box>
  );
}
