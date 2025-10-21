import React, { type PropsWithChildren, type ReactElement, useEffect, useMemo, useState } from 'react';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';
import useIsMount from '../../../hooks/useIsMount';
import componentCachePersistUtils from '../AdvancedSearch/SearchGroup/persistUtils';
import DataReferenceAdvancedSearchContext from './DataReferenceAdvancedSearchContext';
import { Utils } from '../../helpers/utils';
import { getFirstChildConfig } from './utils';

// ReferenceProps can't be used until getComponentConfig() is NOT private
interface DataReferenceProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  label: string;
  showLabel: any;
  displayMode: string;
  allowAndPersistChangesInReviewMode: boolean;
  referenceType: string;
  selectionMode: string;
  displayAs: string;
  ruleClass: string;
  parameters: string[]; // need to fix
  hideLabel: boolean;
  imagePosition: string;
  showImageDescription: string;
  showPromotedFilters: boolean;
  isCreationOfNewRecordAllowedForReference: boolean;
  contextClass: string;
  inline: any;
  selectionList: any;
}

const SELECTION_MODE = { SINGLE: 'single', MULTI: 'multi' };

export default function DataReference(props: PropsWithChildren<DataReferenceProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const SingleReferenceReadonly = getComponentFromMap('SingleReferenceReadOnly');
  const MultiReferenceReadonly = getComponentFromMap('MultiReferenceReadOnly');
  const SearchForm = getComponentFromMap('SearchForm');
  const {
    children,
    getPConnect,
    label,
    showLabel,
    displayMode,
    allowAndPersistChangesInReviewMode,
    referenceType,
    selectionMode,
    displayAs,
    ruleClass,
    parameters,
    hideLabel,
    imagePosition,
    showImageDescription,
    showPromotedFilters,
    isCreationOfNewRecordAllowedForReference,
    contextClass,
    inline,
    selectionList
  } = props;

  const isMounted = useIsMount();
  let childrenToRender = children as ReactElement[];
  const pConn = getPConnect();
  const [dropDownDataSource, setDropDownDataSource] = useState(null);
  const propsToUse: any = { label, showLabel, ...pConn.getInheritedProps() };
  if (propsToUse.showLabel === false) {
    propsToUse.label = '';
  }
  const rawViewMetadata: any = pConn.getRawMetadata();
  const refFieldMetadata = pConn.getFieldMetadata(rawViewMetadata.config?.authorContext);

  const [firstChildMeta] = rawViewMetadata.children;
  const refList = rawViewMetadata.config.referenceList;
  const canBeChangedInReviewMode = allowAndPersistChangesInReviewMode && (displayAs === 'autocomplete' || displayAs === 'dropdown');
  const isDisplayModeEnabled = ['STACKED_LARGE_VAL', 'DISPLAY_ONLY'].includes(displayMode);
  const isDDSourceDeferred =
    (firstChildMeta?.type === 'Dropdown' && selectionMode === SELECTION_MODE.SINGLE && refFieldMetadata?.descriptors) ||
    firstChildMeta.config.deferDatasource;
  const pyID = Utils.getMappedKey('pyID');
  const isInfinity = pyID === 'pyID';
  const { allowImplicitRefresh } = isInfinity
    ? PCore.getFieldDefaultUtils().fieldDefaults.DataReference || {}
    : {
        allowImplicitRefresh: true
      };

  let firstChildPConnect;

  const localizedPlaceholderOption = placeholder => {
    const { GENERIC_BUNDLE_KEY } = PCore.getLocaleUtils?.() ?? {};
    const localizedDefaultPlaceholder = pConn.getLocalizedValue('select_placeholder_default', 'CosmosFields', GENERIC_BUNDLE_KEY);
    // If we have a placeholder, push that option in the list of items
    if (placeholder === 'Select...' && localizedDefaultPlaceholder !== 'select_placeholder_default') {
      return localizedDefaultPlaceholder;
    }
    return pConn.getLocalizedValue(placeholder);
  };

  if (['Dropdown', 'AutoComplete'].includes(firstChildMeta?.type)) {
    firstChildMeta.config.placeholder = localizedPlaceholderOption(firstChildMeta.config.placeholder);
  }

  if (['Checkbox', 'RadioButtons'].includes(firstChildMeta?.type) && firstChildMeta.config.variant === 'card') {
    firstChildMeta.config.imagePosition = imagePosition;
    firstChildMeta.config.showImageDescription = showImageDescription;
  }

  /* Only for dropdown when it has param use data api to get the data back and add it to datasource */
  useEffect(() => {
    if (rawViewMetadata.config?.parameters && !isDDSourceDeferred && ['Checkbox', 'Dropdown', 'RadioButtons'].includes(firstChildMeta?.type)) {
      const { value, key, text } = firstChildMeta.config.datasource.fields;
      if (firstChildMeta.config.variant !== 'card' || (firstChildMeta.config.variant === 'card' && !isMounted)) {
        (
          PCore.getDataApiUtils().getData(
            refList,
            {
              dataViewParameters: parameters
            } as any,
            ''
          ) as Promise<any>
        )
          .then(res => {
            if (res.data.data !== null) {
              const ddDataSource = firstChildMeta.config.datasource.filterDownloadedFields
                ? res.data.data
                : res.data.data
                    .map(listItem => ({
                      key: listItem[key.split(' .', 2)[1]],
                      text: listItem[text.split(' .', 2)[1]],
                      value: listItem[value.split(' .', 2)[1]]
                    }))
                    .filter(item => item.key);
              // Filtering out undefined entries that will break preview
              setDropDownDataSource(ddDataSource);
            } else {
              const ddDataSource: any = [];
              setDropDownDataSource(ddDataSource);
            }
          })
          .catch(err => {
            console.error(err?.stack);
            return Promise.resolve({
              data: { data: [] }
            });
          });
      }
    }
  }, [firstChildMeta, rawViewMetadata, parameters]);

  if (firstChildMeta?.type !== 'Region') {
    firstChildPConnect = getPConnect().getChildren()?.[0].getPConnect;
    /* remove refresh When condition from those old view so that it will not be used for runtime */
    if (firstChildMeta.config?.readOnly) {
      delete firstChildMeta.config.readOnly;
    }
    if (firstChildMeta?.type === 'Dropdown') {
      firstChildMeta.config.datasource.source = rawViewMetadata.config?.parameters
        ? dropDownDataSource
        : '@DATASOURCE '.concat(refList).concat('.pxResults');
    } else if (firstChildMeta?.type === 'AutoComplete') {
      firstChildMeta.config.datasource = refList;

      /* Insert the parameters to the component only if present */
      if (rawViewMetadata.config?.parameters) {
        firstChildMeta.config.parameters = parameters;
      }
    }
    // set displayMode conditionally
    if (!canBeChangedInReviewMode) {
      firstChildMeta.config.displayMode = displayMode;
    }
  }

  const handleSelection = event => {
    const caseKey = pConn.getCaseInfo().getKey();
    const refreshOptions: any = { autoDetectRefresh: true };

    const children: any = pConn.getRawMetadata()?.children;
    if (children?.length > 0 && children[0].config?.value) {
      refreshOptions.propertyName = children[0].config.value;
      refreshOptions.classID = (pConn.getRawMetadata() as any).classID;
    }

    // AutoComplete sets value on event.id whereas Dropdown sets it on event.target.value if event.id is unset
    // When value is empty propValue will be undefined here and no value will be set for the reference
    const propValue = event?.id || event?.target?.value;
    const propName =
      firstChildMeta.type === 'SimpleTableSelect' && selectionMode === SELECTION_MODE.MULTI
        ? PCore.getAnnotationUtils().getPropertyName(firstChildMeta.config.selectionList)
        : PCore.getAnnotationUtils().getPropertyName(firstChildMeta.config.value);

    const hasAssociatedViewConfigured = rawViewMetadata.children[1].children?.length;

    if (pConn.getContextName().includes('modal') || pConn.getContextName().includes('workarea')) {
      if (hasAssociatedViewConfigured || allowImplicitRefresh) {
        const pageReference = pConn.getPageReference();
        let pgRef: any = null;
        if (pageReference.startsWith('objectInfo')) {
          pgRef = pageReference.replace('objectInfo.content', '');
        } else {
          pgRef = pageReference.replace('caseInfo.content', '');
        }
        const viewName = rawViewMetadata.name;
        getPConnect()
          .getActionsApi()
          .refreshCaseView(caseKey, viewName, pgRef, refreshOptions)
          .catch(() => {});
      }
    } else if (propValue && canBeChangedInReviewMode && isDisplayModeEnabled) {
      (PCore.getDataApiUtils().getCaseEditLock(caseKey, '') as Promise<any>).then(caseResponse => {
        const pageTokens = pConn.getPageReference().replace('caseInfo.content', '').split('.');
        let curr = {};
        const commitData = curr;

        pageTokens.forEach(el => {
          if (el !== '') {
            curr[el] = {};
            curr = curr[el];
          }
        });

        // expecting format like {Customer: {pyID:"C-100"}}
        const propArr = propName.split('.');
        propArr.forEach((element, idx) => {
          if (idx + 1 === propArr.length) {
            curr[element] = propValue;
          } else {
            curr[element] = {};
            curr = curr[element];
          }
        });

        (
          PCore.getDataApiUtils().updateCaseEditFieldsData(
            caseKey,
            { [caseKey]: commitData },
            caseResponse.headers.etag,
            pConn.getContextName()
          ) as Promise<any>
        ).then(response => {
          PCore.getContainerUtils().updateParentLastUpdateTime(pConn.getContextName(), response.data.data.caseInfo.lastUpdateTime);
          PCore.getContainerUtils().updateRelatedContextEtag(pConn.getContextName(), response.headers.etag);
        });
      });
    }
  };

  // Re-create first child with overridden props
  // Memoized child in order to stop unmount and remount of the child component when data reference
  // rerenders without any actual change
  const recreatedFirstChild = useMemo(() => {
    const { type, config } = firstChildMeta;
    if (firstChildMeta?.type === 'Region' && displayAs !== 'advancedSearch') {
      return;
    }

    if ((displayAs === 'readonly' || isDisplayModeEnabled) && !canBeChangedInReviewMode && selectionMode === SELECTION_MODE.SINGLE) {
      return (
        <SingleReferenceReadonly
          config={config}
          getPConnect={firstChildPConnect}
          label={propsToUse.label}
          type={type}
          displayAs={displayAs}
          displayMode={displayMode}
          ruleClass={ruleClass}
          referenceType={referenceType}
          hideLabel={hideLabel}
          dataRelationshipContext={rawViewMetadata.config.contextClass && rawViewMetadata.config.name ? rawViewMetadata.config.name : null}
        />
      );
    }

    if ((['readonly', 'readonlyMulti', 'map'].includes(displayAs) || isDisplayModeEnabled) && selectionMode === SELECTION_MODE.MULTI) {
      return (
        <MultiReferenceReadonly
          config={{
            ...firstChildMeta.config,
            localeReference: rawViewMetadata.config.localeReference
          }}
          getPConnect={firstChildPConnect}
          displayAs={displayAs}
          label={propsToUse.label}
          hideLabel={hideLabel}
          displayMode={displayMode}
        />
      );
    }

    /* Editable variants */
    // Datasource w/ parameters cannot load the dropdown before the parameters
    if (type === 'Dropdown' && dropDownDataSource === null && !isDDSourceDeferred && rawViewMetadata.config?.parameters) {
      return null;
    }

    if (firstChildMeta.config?.readOnly) {
      delete firstChildMeta.config.readOnly;
    }

    // 2) Set datasource
    if (
      ['Dropdown', 'Checkbox', 'RadioButtons'].includes(firstChildMeta?.type) &&
      !firstChildMeta.config.deferDatasource &&
      firstChildMeta.config.datasource
    ) {
      firstChildMeta.config.datasource.source =
        (firstChildMeta.config.variant === 'card' && dropDownDataSource) ||
        (firstChildMeta.config.variant !== 'card' && rawViewMetadata.config?.parameters)
          ? dropDownDataSource
          : '@DATASOURCE '.concat(refList).concat('.pxResults');
    } else if (firstChildMeta?.type === 'AutoComplete') {
      firstChildMeta.config.datasource = refList;

      if (rawViewMetadata.config?.parameters) {
        firstChildMeta.config.parameters = parameters;
      }
    }

    // 3) Pass through configs
    if (firstChildMeta.config) {
      firstChildMeta.config.showPromotedFilters = showPromotedFilters;
      if (!canBeChangedInReviewMode) {
        firstChildMeta.config.displayMode = displayMode;
      }
    }

    // 4) Define field meta
    let fieldMetaData: any = null;
    if (isDDSourceDeferred && !firstChildMeta.config.deferDatasource) {
      fieldMetaData = {
        datasourceMetadata: refFieldMetadata
      };
      if (rawViewMetadata.config?.parameters) {
        fieldMetaData.datasourceMetadata.datasource.parameters = parameters;
      }
      fieldMetaData.datasourceMetadata.datasource.propertyForDisplayText = firstChildMeta?.config?.datasource?.fields?.text.startsWith('@P')
        ? firstChildMeta?.config?.datasource?.fields?.text?.substring(3)
        : firstChildMeta?.config?.datasource?.fields?.text;
      fieldMetaData.datasourceMetadata.datasource.propertyForValue = firstChildMeta?.config?.datasource?.fields?.value.startsWith('@P')
        ? firstChildMeta?.config?.datasource?.fields?.value?.substring(3)
        : firstChildMeta?.config?.datasource?.fields?.value;
      fieldMetaData.datasourceMetadata.datasource.name = rawViewMetadata.config?.referenceList;
    }
    // @ts-expect-error
    const { disableStartingFieldsForReference = false } = PCore.getEnvironmentInfo().environmentInfoObject?.features?.form || {};
    // @ts-expect-error
    let { isCreateNewReferenceEnabled = false } = PCore.getEnvironmentInfo().environmentInfoObject?.features?.form || {};

    if (isCreateNewReferenceEnabled) {
      isCreateNewReferenceEnabled = isCreationOfNewRecordAllowedForReference && PCore.getAccessPrivilege().hasCreateAccess(contextClass);
    }

    const startingFields: any = {};
    const createNewRecord = () => {
      if (referenceType === 'Case' || firstChildMeta?.config?.referenceType === 'Case') {
        if (!disableStartingFieldsForReference) {
          startingFields.pyAddCaseContextPage = { pyID: pConn.getCaseInfo().getKey()?.split(' ')?.pop() };
        }
        return pConn.getActionsApi().createWork(contextClass, {
          openCaseViewAfterCreate: false,
          startingFields
        });
      }
      if (referenceType === 'Data' || firstChildMeta?.config?.referenceType === 'Data') {
        return getPConnect().getActionsApi().showDataObjectCreateView(contextClass);
      }
    };

    const additionalInfo = refFieldMetadata?.additionalInformation
      ? {
          content: refFieldMetadata.additionalInformation
        }
      : undefined;

    const dataReferenceConfigToChild = {
      selectionMode,
      additionalInfo,
      descriptors: selectionMode === SELECTION_MODE.SINGLE ? refFieldMetadata?.descriptors : null,
      datasourceMetadata: fieldMetaData?.datasourceMetadata,
      required: propsToUse.required,
      visibility: propsToUse.visibility,
      disabled: propsToUse.disabled,
      label: propsToUse.label,
      displayAs,
      readOnly: false,
      ...(selectionMode === SELECTION_MODE.SINGLE && {
        referenceType
      }),
      ...(selectionMode === SELECTION_MODE.SINGLE &&
        displayAs === 'advancedSearch' && {
          value: rawViewMetadata.config.value,
          contextPage: rawViewMetadata.config.contextPage
        }),
      ...(selectionMode === SELECTION_MODE.MULTI &&
        displayAs === 'advancedSearch' && {
          selectionList,
          readonlyContextList: rawViewMetadata.config.readonlyContextList
        }),
      dataRelationshipContext: rawViewMetadata.config.contextClass && rawViewMetadata.config.name ? rawViewMetadata.config.name : null,
      hideLabel,
      onRecordChange: handleSelection,
      createNewRecord: isCreateNewReferenceEnabled ? createNewRecord : undefined,
      inline
    };

    const searchSelectCacheKey = componentCachePersistUtils.getComponentStateKey(getPConnect, rawViewMetadata.config.name);

    const dataReferenceAdvancedSearchContext = {
      dataReferenceConfigToChild,
      isCreateNewReferenceEnabled,
      disableStartingFieldsForReference,
      pyID,
      searchSelectCacheKey
    };

    if (displayAs === 'advancedSearch') {
      return (
        <DataReferenceAdvancedSearchContext.Provider value={dataReferenceAdvancedSearchContext}>
          <SearchForm getPConnect={getPConnect} searchSelectCacheKey={searchSelectCacheKey}>
            {children}
          </SearchForm>
        </DataReferenceAdvancedSearchContext.Provider>
      );
    }

    return firstChildPConnect().createComponent({
      type,
      config: {
        ...getFirstChildConfig({
          firstChildMeta,
          getPConnect,
          rawViewMetadata,
          contextClass,
          dataReferenceConfigToChild,
          isCreateNewReferenceEnabled,
          disableStartingFieldsForReference,
          pyID
        })
      }
    });
  }, [firstChildMeta.config?.datasource?.source, parameters, dropDownDataSource, propsToUse.required, propsToUse.disabled]);

  // Only include the views region for rendering when it has content
  if (firstChildMeta?.type !== 'Region') {
    const viewsRegion = rawViewMetadata.children[1];
    if (viewsRegion?.name === 'Views' && viewsRegion.children.length) {
      viewsRegion.children.map(child => {
        child.config.isEmbeddedInDataReference = true;
        return child;
      });
      childrenToRender = [recreatedFirstChild, ...(children as ReactElement[]).slice(1)];
    } else {
      childrenToRender = [recreatedFirstChild];
    }
  } else if (displayAs === 'advancedSearch') {
    childrenToRender = [recreatedFirstChild];
  }

  return childrenToRender.length === 1 ? (
    (childrenToRender[0] ?? null)
  ) : (
    <div>
      {childrenToRender.map((child, index) => (
        <React.Fragment key={index}>{child}</React.Fragment>
      ))}
    </div>
  );
}
