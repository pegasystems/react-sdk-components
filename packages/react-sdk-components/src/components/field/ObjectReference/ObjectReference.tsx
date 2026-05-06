import { useMemo, useEffect, useState } from 'react';

import Grid2 from '@mui/material/Grid2';

import {
  SELECTION_MODE,
  generateColumns,
  getDataRelationshipContextFromKey,
  addCompositeKeysToConfig,
  createNewRecord,
  getAdditionalInfo,
  camelCase
} from './utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import componentCachePersistUtils from '../../template/AdvancedSearch/SearchGroup/persistUtils';
import DataReferenceAdvancedSearchContext from '../../template/DataReference/DataReferenceAdvancedSearchContext';
import { Utils } from '../../helpers/utils';
import type { PConnFieldProps } from '../../../types/PConnProps';

interface ObjectReferenceProps extends Omit<PConnFieldProps, 'value'> {
  getPConnect: any;
  displayMode: string;
  allowAndPersistChangesInReviewMode: any;
  allowCreatingRecords?: boolean;
  targetObjectType: any;
  mode: string;
  parameters: object;
  hideLabel: boolean;
  inline: boolean;
  showPromotedFilters: boolean;
  additionalFields: any;
  linkReference?: boolean;
  matchPosition?: string;
  children?: any;
}

export default function ObjectReference(props: ObjectReferenceProps) {
  console.log('Rendering ObjectReference with props', props);
  const {
    getPConnect,
    children,
    allowCreatingRecords,
    allowAndPersistChangesInReviewMode: editableInReview = false,
    targetObjectType,
    mode = '',
    parameters,
    hideLabel = false,
    inline = false,
    showPromotedFilters = false,
    additionalFields,
    linkReference,
    matchPosition = 'contains'
  } = props;

  let displayMode = props.displayMode;

  const SingleReferenceReadonly = getComponentFromMap('SingleReferenceReadOnly');
  const MultiReferenceReadonly = getComponentFromMap('MultiReferenceReadOnly');
  const SearchForm = getComponentFromMap('SearchForm');

  // Configs
  const pConn = getPConnect();
  const referenceType = targetObjectType?.toLowerCase() === 'case' ? 'Case' : 'Data';
  const rawViewMetadata = pConn.getRawMetadata();
  const refFieldMetadata = pConn.getFieldMetadata(
    rawViewMetadata.config.mode === SELECTION_MODE.SINGLE
      ? rawViewMetadata?.config?.value?.split('.', 2)[1]
      : rawViewMetadata?.config?.pagelistValue?.substring(4)
  );

  // Destructured properties
  const propsToUse: any = { ...pConn.getInheritedProps(), ...props };
  const [parameterizedDataSource, setParameterizedDataSource] = useState<any[]>([]);

  const { allowImplicitRefresh } = (PCore as any).getFieldDefaultUtils?.()?.fieldDefaults?.DataReference || {};

  if (rawViewMetadata.config.componentType === 'Combobox') {
    if (mode === SELECTION_MODE.MULTI) {
      rawViewMetadata.config.componentType = 'Multiselect';
    } else {
      rawViewMetadata.config.componentType = 'AutoComplete';
    }
  }

  useEffect(() => {
    if (rawViewMetadata.config?.parameters && ['CheckboxGroup'].includes(rawViewMetadata.config.componentType)) {
      const { value, key, text } = {
        key: `@P ${rawViewMetadata.config.selectionKey}`,
        text: `@P ${rawViewMetadata.config.displayField}`,
        value: `@P ${rawViewMetadata.config.selectionKey}`
      };
      const refList = rawViewMetadata.config.referenceList;
      (PCore as any)
        .getDataApiUtils()
        .getData(refList, {
          dataViewParameters: parameters
        })
        .then((res: any) => {
          if (res.data.data !== null) {
            const ddDataSource = res.data.data
              .map((listItem: any) => ({
                key: listItem[key.split(' .', 2)[1]],
                text: listItem[text.split(' .', 2)[1]],
                value: listItem[value.split(' .', 2)[1]]
              }))
              .filter((item: any) => item.key);
            setParameterizedDataSource(ddDataSource);
          } else {
            setParameterizedDataSource([]);
          }
        })
        .catch(() => {
          return Promise.resolve({
            data: { data: [] }
          });
        });
    }
  }, [rawViewMetadata, parameters]);

  if (displayMode !== 'DISPLAY_ONLY' && props.readOnly) {
    if (rawViewMetadata.config.componentType === 'Multiselect') {
      rawViewMetadata.config.componentType = 'SemanticLink';
    } else {
      displayMode = 'DISPLAY_ONLY';
    }
  }

  // Computed variables
  const isDisplayModeEnabled = displayMode === 'DISPLAY_ONLY';
  const canBeChangedInReviewMode = editableInReview && ['AutoComplete', 'Dropdown'].includes(rawViewMetadata.config.componentType);

  // Editable first child on change handler
  const onRecordChange = (event: any) => {
    const caseKey = pConn.getCaseInfo().getKey();
    const refreshOptions: any = { autoDetectRefresh: true, propertyName: '' };
    refreshOptions.propertyName = rawViewMetadata.config?.value;

    if (!canBeChangedInReviewMode || !pConn.getValue('__currentPageTabViewName') || allowImplicitRefresh) {
      const pgRef = pConn.getPageReference().replace('caseInfo.content', '');
      const viewName = rawViewMetadata.name;
      if (viewName && viewName.length > 0) {
        getPConnect().getActionsApi().refreshCaseView(caseKey, viewName, pgRef, refreshOptions);
      }
    }

    const propValue = event?.id || event?.target?.value;
    const propName =
      rawViewMetadata.type === 'SimpleTableSelect' && mode === SELECTION_MODE.MULTI
        ? PCore.getAnnotationUtils().getPropertyName(rawViewMetadata.config.selectionList)
        : PCore.getAnnotationUtils().getPropertyName(rawViewMetadata.config?.value);

    if (propValue && canBeChangedInReviewMode && isDisplayModeEnabled) {
      PCore.getCaseUtils()
        .getCaseEditLock(caseKey, '')
        .then((caseResponse: any) => {
          const pageTokens = pConn.getPageReference().replace('caseInfo.content', '').split('.');
          let curr: any = {};
          const commitData = curr;

          pageTokens.forEach((el: string) => {
            if (el !== '') {
              curr[el] = {};
              curr = curr[el];
            }
          });

          const propArr = propName.split('.');
          propArr.forEach((element: string, idx: number) => {
            if (idx + 1 === propArr.length) {
              curr[element] = propValue;
            } else {
              curr[element] = {};
              curr = curr[element];
            }
          });

          PCore.getCaseUtils()
            .updateCaseEditFieldsData(caseKey, { [caseKey]: commitData }, caseResponse.headers.etag, pConn.getContextName())
            .then((response: any) => {
              PCore.getContainerUtils().updateParentLastUpdateTime(pConn.getContextName(), (response.data as any).data.caseInfo.lastUpdateTime);
              PCore.getContainerUtils().updateRelatedContextEtag(pConn.getContextName(), response.headers.etag);
            });
        });
    }
  };

  // Prepare first child
  const buildSemanticLinkChild = () => {
    if (mode !== 'readonly-multi') {
      const config = {
        ...rawViewMetadata.config,
        primaryField: rawViewMetadata.config.displayField
      };
      config.caseClass = rawViewMetadata.config.targetObjectClass;
      config.text = config.primaryField;
      config.caseID = config.value;
      config.contextPage = `@P .${
        rawViewMetadata.config?.displayField ? getDataRelationshipContextFromKey(rawViewMetadata.config.displayField) : null
      }`;
      config.resourceParams = { workID: config.value };
      config.resourcePayload = { caseClassName: config.caseClass };

      return getPConnect().createComponent({
        type: linkReference === false ? 'TextInput' : 'SemanticLink',
        config:
          linkReference === false
            ? { value: config.primaryField, label: propsToUse.label, hideLabel, readOnly: true, displayMode }
            : {
                ...config,
                displayMode,
                referenceType,
                hideLabel,
                dataRelationshipContext: rawViewMetadata.config?.displayField
                  ? getDataRelationshipContextFromKey(rawViewMetadata.config.displayField)
                  : null
              }
      });
    }
    const displayField = rawViewMetadata.config.displayField;
    const primaryField = displayField?.startsWith('@P') ? displayField?.substring(3) : displayField;
    const presets = [
      {
        children: [{ children: rawViewMetadata.config.columns, name: 'Columns', type: 'Region' }],
        config: {},
        id: 'P_',
        label: '',
        name: 'presets',
        template: 'Table'
      }
    ];
    return (
      <MultiReferenceReadonly
        config={{
          contextClass: rawViewMetadata.config.targetObjectClass,
          defaultRowHeight: rawViewMetadata.config.defaultRowHeight,
          label: propsToUse.label,
          presets,
          primaryField,
          readonlyContextList: rawViewMetadata.config.pagelistValue,
          referenceList: rawViewMetadata.config.pagelistValue,
          referenceType,
          renderMode: 'ReadOnly',
          selectionKey: rawViewMetadata.config.selectionKey
        }}
        displayAs='readonlyMulti'
        displayMode={displayMode}
        getPConnect={getPConnect}
        hideLabel={hideLabel}
        label={propsToUse.label}
        linkReference={linkReference}
      />
    );
  };

  const buildTableChild = (type: string) => {
    const presets = [
      {
        children: [{ children: rawViewMetadata.config.columns, name: 'Columns', type: 'Region' }],
        config: { filterExpression: rawViewMetadata.config.filterExpression },
        id: 'P_',
        label: '',
        name: 'presets',
        template: 'Table'
      }
    ];
    const tableDisplayAs = camelCase(type);

    if (mode === 'readonly-multi') {
      return getPConnect().createComponent({
        type: 'SimpleTableSelect',
        config: {
          contextClass: rawViewMetadata.config.targetObjectClass,
          defaultRowHeight: rawViewMetadata.config.defaultRowHeight,
          displayAs: tableDisplayAs,
          hideLabel: false,
          label: propsToUse.label,
          localeReference: rawViewMetadata.config.localeReference,
          presets,
          readOnly: true,
          readonlyContextList: rawViewMetadata.config.pagelistValue,
          referenceList: rawViewMetadata.config.pagelistValue,
          referenceType,
          renderMode: 'ReadOnly',
          rowHeader: rawViewMetadata.config.rowHeader,
          selectionMode: 'multi',
          required: propsToUse.required,
          visibility: propsToUse.visibility,
          disabled: propsToUse.disabled,
          toggleFieldVisibility: rawViewMetadata.config.toggleFieldVisibility
        }
      });
    }
    const contextPageFromConfig = mode === 'single' ? rawViewMetadata.config.contextPage : rawViewMetadata.config.pagelistValue;
    const contextPageValue = contextPageFromConfig?.startsWith('@P') ? contextPageFromConfig?.substring(3) : contextPageFromConfig;

    return getPConnect().createComponent({
      type: 'SimpleTableSelect',
      config: {
        dataRelationshipContext: contextPageValue,
        defaultRowHeight: rawViewMetadata.config.defaultRowHeight,
        displayAs: tableDisplayAs,
        hideLabel: false,
        inline: false,
        label: propsToUse.label,
        localeReference: rawViewMetadata.config.localeReference,
        presets,
        readOnly: false,
        referenceList: rawViewMetadata.config.referenceList,
        referenceType,
        rowHeader: rawViewMetadata.config.rowHeader,
        selectionList: contextPageValue,
        selectionMode: mode,
        showPromotedFilters: false,
        required: propsToUse.required,
        visibility: propsToUse.visibility,
        disabled: propsToUse.disabled,
        toggleFieldVisibility: rawViewMetadata.config.toggleFieldVisibility
      }
    });
  };

  const buildFieldMetaData = () => {
    const fieldMetaData: any = {
      datasourceMetadata: { datasource: { parameters: {} } }
    };
    if (rawViewMetadata.config?.parameters) {
      fieldMetaData.datasourceMetadata.datasource.parameters = parameters;
    }
    fieldMetaData.datasourceMetadata.datasource.propertyForDisplayText = rawViewMetadata?.config?.datasource?.fields?.text.startsWith('@P')
      ? rawViewMetadata?.config?.datasource?.fields?.text?.substring(3)
      : rawViewMetadata?.config?.datasource?.fields?.text;
    fieldMetaData.datasourceMetadata.datasource.propertyForValue = rawViewMetadata?.config?.datasource?.fields?.value.startsWith('@P')
      ? rawViewMetadata?.config?.datasource?.fields?.value?.substring(3)
      : rawViewMetadata?.config?.datasource?.fields?.value;
    fieldMetaData.datasourceMetadata.datasource.name = rawViewMetadata.config?.referenceList;
    return fieldMetaData;
  };

  const buildSearchAndSelectChild = (isCreateNewReferenceEnabled: boolean, disableStartingFieldsForReference: boolean) => {
    const rawConfig = rawViewMetadata.config;
    const selectionMode = rawConfig.mode;
    const [firstChildMeta] = structuredClone(rawViewMetadata.children ?? []);
    const pyID = Utils.getMappedKey('pyID');

    const additionalInfo = refFieldMetadata?.additionalInformation ? { content: refFieldMetadata.additionalInformation } : undefined;
    const pageListValueFromConfig = rawConfig.pagelistValue;
    const selectionList = pageListValueFromConfig?.startsWith('@P') ? pageListValueFromConfig?.substring(3) : pageListValueFromConfig;
    const contextPageFromConfig = rawConfig.contextPage;
    const unannotatedContextPageFromConfig = contextPageFromConfig?.startsWith('@P') ? contextPageFromConfig?.substring(3) : contextPageFromConfig;
    const name = (selectionList ?? unannotatedContextPageFromConfig)?.replace(/^\./, '');

    const dataReferenceConfigToChild: any = {
      selectionMode,
      additionalInfo,
      descriptors: selectionMode === SELECTION_MODE.SINGLE ? refFieldMetadata?.descriptors : null,
      required: propsToUse.required,
      visibility: propsToUse.visibility,
      disabled: propsToUse.disabled,
      label: propsToUse.label,
      displayAs: 'advancedSearch',
      readOnly: false,
      matchPosition,
      ...(selectionMode === SELECTION_MODE.SINGLE && { referenceType }),
      ...(selectionMode === SELECTION_MODE.SINGLE && {
        value: rawConfig.value,
        contextPage: contextPageFromConfig
      }),
      ...(selectionMode === SELECTION_MODE.MULTI && {
        selectionList,
        readonlyContextList: pageListValueFromConfig,
        referenceType: referenceType || firstChildMeta?.config?.referenceType
      }),
      dataRelationshipContext: rawConfig.targetObjectClass && name ? name : null,
      hideLabel,
      onRecordChange,
      getAdditionalInfo: getAdditionalInfo.bind(null, pConn, rawConfig?.authorContext),
      createNewRecord: isCreateNewReferenceEnabled ? createNewRecord : undefined,
      inline
    };

    const searchSelectKey = componentCachePersistUtils.getComponentStateKey(getPConnect, name);

    const dataReferenceAdvancedSearchContext = {
      dataReferenceConfigToChild,
      isCreateNewReferenceEnabled,
      disableStartingFieldsForReference,
      pyID,
      searchSelectKey
    };

    return (
      <DataReferenceAdvancedSearchContext.Provider value={dataReferenceAdvancedSearchContext}>
        <SearchForm getPConnect={getPConnect} searchSelectCacheKey={searchSelectKey} type='ObjectReference' label={propsToUse.label}>
          {children}
        </SearchForm>
      </DataReferenceAdvancedSearchContext.Provider>
    );
  };

  const buildCardsChild = () => {
    const rawConfig = rawViewMetadata.config;
    const selectionMode = rawConfig.mode;

    const componentMeta = {
      type: selectionMode === 'single' ? 'RadioButtons' : 'Checkbox',
      config: {
        ...rawConfig,
        label: rawConfig.label,
        value: selectionMode === 'single' ? rawConfig.value : undefined,
        referenceList: rawConfig.referenceList,
        contextClass: rawConfig.targetObjectClass,
        referenceType: rawConfig.targetObjectType === 'case' ? 'Case' : 'Data',
        readonlyContextList: selectionMode.includes('multi') ? rawConfig.pagelistValue : undefined,
        ...(selectionMode.includes('multi')
          ? {
              selectionList: rawConfig.pagelistValue.substring(3),
              selectionKey: rawConfig.selectionKey
            }
          : { selectionList: rawConfig.contextPage?.substring(3) }),
        selectionMode: selectionMode.includes('multi') ? 'multi' : undefined,
        renderMode: rawConfig.mode === 'readonly-multi' ? 'ReadOnly' : '',
        variant: 'card',
        inlineDisplay: rawConfig.inlineDisplay,
        hideFieldLabels: rawConfig.hideFieldLabels,
        presets: [
          {
            children: [
              {
                children: rawConfig.secondaryFields,
                name: 'AdditionalDetails',
                type: 'Region'
              }
            ],
            config: {},
            id: 'P_',
            label: '',
            name: 'presets',
            template: 'Cards'
          }
        ],
        datasource: {
          fields: {
            key: `@P ${rawConfig.selectionKey || `.${rawConfig.value.trim().split('.').pop()?.trim()}`}`,
            text: `@P .${rawConfig.displayField.trim().split('.').pop()?.trim()}`,
            value: `@P ${rawConfig.selectionKey || `.${rawConfig.value.trim().split('.').pop()?.trim()}`}`
          },
          filterDownloadedFields: true,
          source: `@DATASOURCE ${rawConfig.referenceList}.pxResults`
        },
        displayAs: 'cards',
        hideLabel: rawConfig.hideLabel,
        imagePosition: rawConfig.imagePosition,
        image: rawConfig.image,
        imageSize: rawConfig.imageSize,
        showImageDescription: rawConfig.showImageDescription,
        imageDescription: rawConfig.imageDescription,
        required: rawConfig.required,
        readOnly: false,
        disabled: rawConfig.disabled,
        labelOption: rawConfig.labelOption,
        primaryField: rawConfig.displayField,
        dataRelationshipContext: rawConfig.displayField ? getDataRelationshipContextFromKey(rawConfig.displayField) : null
      }
    };

    return getPConnect().createComponent(componentMeta);
  };

  const recreatedFirstChild = useMemo(() => {
    const type = rawViewMetadata.config.componentType;

    if (type === 'SemanticLink' && !canBeChangedInReviewMode) {
      return buildSemanticLinkChild();
    }
    if (isDisplayModeEnabled && !canBeChangedInReviewMode) {
      return (
        <SingleReferenceReadonly
          config={{ ...rawViewMetadata.config, primaryField: rawViewMetadata.config.displayField }}
          getPConnect={getPConnect}
          label={propsToUse.label}
          type={type}
          displayAs='readonly'
          displayMode={displayMode}
          activeViewRuleClass={rawViewMetadata.config.targetObjectClass}
          referenceType={referenceType}
          hideLabel={hideLabel}
          linkReference={linkReference}
          dataRelationshipContext={
            rawViewMetadata.config?.displayField ? getDataRelationshipContextFromKey(rawViewMetadata.config.displayField) : null
          }
          additionalFields={additionalFields}
        />
      );
    }

    if (type === 'Cards') {
      return buildCardsChild();
    }

    if (type === 'CheckboxGroup') {
      const displayField = rawViewMetadata.config.displayField;
      const primaryField = displayField?.startsWith('@P') ? displayField?.substring(3) : displayField;
      const readOnly = !(mode === 'multi' || mode === 'single');
      const pageListValueFromConfig = rawViewMetadata.config.pagelistValue;
      const selectionList = pageListValueFromConfig?.startsWith('@P') ? pageListValueFromConfig?.substring(3) : pageListValueFromConfig;
      return getPConnect().createComponent({
        type: 'Checkbox',
        config: {
          ...rawViewMetadata.config,
          contextClass: rawViewMetadata.config.targetObjectClass,
          datasource: {
            fields: {
              key: `@P ${rawViewMetadata.config.selectionKey}`,
              text: `@P ${rawViewMetadata.config.displayField}`,
              value: `@P ${rawViewMetadata.config.selectionKey}`
            },
            source: !rawViewMetadata.config?.parameters ? `@DATASOURCE ${rawViewMetadata.config.referenceList}.pxResults` : parameterizedDataSource
          },
          descriptors: mode === SELECTION_MODE.SINGLE ? refFieldMetadata?.descriptors : null,
          displayAs: 'checkboxgroup',
          hideLabel,
          inline: rawViewMetadata.config.inline ?? false,
          label: propsToUse.label,
          primaryField,
          readOnly,
          readonlyContextList: pageListValueFromConfig,
          referenceType: rawViewMetadata.config.targetObjectType,
          selectionKey: rawViewMetadata.config.selectionKey,
          selectionList,
          selectionMode: mode,
          disabled: propsToUse.disabled,
          required: propsToUse.required,
          visibility: propsToUse.visibility
        }
      });
    }

    if (type === 'Table' || type === 'SimpleTable') {
      return buildTableChild(type);
    }

    // Set datasource
    generateColumns(rawViewMetadata.config, pConn, referenceType);
    addCompositeKeysToConfig(rawViewMetadata.config, pConn);
    rawViewMetadata.config.deferDatasource = true;
    rawViewMetadata.config.listType = 'datapage';
    if (['Dropdown', 'AutoComplete'].includes(type) && !rawViewMetadata.config.placeholder) {
      rawViewMetadata.config.placeholder = '@L Select...';
    }

    rawViewMetadata.config.showPromotedFilters = showPromotedFilters;

    if (!canBeChangedInReviewMode) {
      rawViewMetadata.config.displayMode = displayMode;
    }

    const fieldMetaData = buildFieldMetaData();

    const { disableStartingFieldsForReference = false } = (PCore as any).getEnvironmentInfo().environmentInfoObject?.features?.form || {};
    const contextClass = rawViewMetadata.config.targetObjectClass;

    const formFeaturesAvailable = (PCore as any).getEnvironmentInfo().environmentInfoObject?.features?.form;
    const createAuthoringEnabled = allowCreatingRecords ?? formFeaturesAvailable?.isCreateNewReferenceEnabled;
    const userHasCreateAccess = formFeaturesAvailable
      ? formFeaturesAvailable.isCreateNewReferenceEnabled && PCore.getAccessPrivilege().hasCreateAccess(contextClass)
      : PCore.getAccessPrivilege().hasCreateAccess(contextClass);
    const isCreateNewReferenceEnabled = createAuthoringEnabled && userHasCreateAccess;

    const buildCreateNewRecord = () =>
      createNewRecord({
        referenceType: rawViewMetadata.config.targetObjectType === 'case' ? 'Case' : 'Data',
        pConn,
        getPConnect,
        disableStartingFieldsForReference,
        startingFields: {},
        contextClass
      });

    if (type === 'SearchAndSelect') {
      return buildSearchAndSelectChild(isCreateNewReferenceEnabled, disableStartingFieldsForReference);
    }

    if (type === 'Multiselect') {
      return getPConnect().createComponent({
        type,
        config: {
          ...rawViewMetadata.config,
          descriptors: refFieldMetadata?.descriptors,
          datasourceMetadata: fieldMetaData?.datasourceMetadata,
          selectionList: rawViewMetadata.config?.pagelistValue.substring(3),
          readonlyContextList: rawViewMetadata.config?.pagelistValue,
          selectionKey: rawViewMetadata.config?.selectionKey,
          selectionMode: SELECTION_MODE.MULTI,
          required: propsToUse.required,
          visibility: propsToUse.visibility,
          disabled: propsToUse.disabled,
          label: propsToUse.label,
          parameters: rawViewMetadata.config.parameters,
          readOnly: false,
          localeReference: rawViewMetadata.config.localeReference,
          ...(mode === SELECTION_MODE.MULTI ? { referenceType } : ''),
          contextClass: rawViewMetadata.config.targetObjectClass,
          primaryField: rawViewMetadata.config?.displayField?.startsWith('@P')
            ? rawViewMetadata.config.displayField.slice(3)
            : rawViewMetadata.config?.displayField,
          dataRelationshipContext: rawViewMetadata.config?.pagelistValue.substring(4),
          hideLabel: hideLabel ?? false,
          onRecordChange,
          createNewRecord: isCreateNewReferenceEnabled ? buildCreateNewRecord : undefined,
          inline,
          columnsFormatter: rawViewMetadata.config.secondaryFields
        }
      });
    }

    return getPConnect().createComponent({
      type,
      config: {
        ...rawViewMetadata.config,
        descriptors: mode === SELECTION_MODE.SINGLE ? refFieldMetadata?.descriptors : null,
        datasourceMetadata: fieldMetaData?.datasourceMetadata,
        required: propsToUse.required,
        visibility: propsToUse.visibility,
        disabled: propsToUse.disabled,
        label: propsToUse.label,
        parameters: rawViewMetadata.config.parameters,
        readOnly: false,
        localeReference: rawViewMetadata.config.localeReference,
        ...(mode === SELECTION_MODE.SINGLE ? { referenceType } : ''),
        contextClass: rawViewMetadata.config.targetObjectClass,
        primaryField: rawViewMetadata.config?.displayField,
        dataRelationshipContext: rawViewMetadata.config?.displayField ? getDataRelationshipContextFromKey(rawViewMetadata.config.displayField) : null,
        hideLabel,
        onRecordChange,
        createNewRecord: isCreateNewReferenceEnabled ? buildCreateNewRecord : undefined,
        inline,
        columnsFormatter: rawViewMetadata.config.secondaryFields,
        getAdditionalInfo: getAdditionalInfo.bind(null, pConn, rawViewMetadata.config.displayField),
        linkReference: type === 'AutoComplete' ? linkReference : undefined
      }
    });
  }, [
    rawViewMetadata.config?.datasource?.source,
    parameters,
    parameterizedDataSource,
    propsToUse.required,
    propsToUse.disabled,
    getPConnect().getPageReference()
  ]);

  // Prepare children to render
  return (
    <Grid2 container direction='column'>
      <Grid2>{recreatedFirstChild}</Grid2>
    </Grid2>
  );
}
