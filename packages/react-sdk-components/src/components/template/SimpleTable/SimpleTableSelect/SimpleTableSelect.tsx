import { useLayoutEffect } from 'react';
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { getFieldMeta } from '../../DataReference/utils';
import type { PConnProps } from '../../../../types/PConnProps';

interface SimpleTableSelectProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  label: string;
  referenceList: object[] | string;
  renderMode: string;
  showLabel: boolean;
  promptedFilters: object[];
  viewName: string;
  parameters: any;
  readonlyContextList: object[] | string;
  dataRelationshipContext: string;
  defaultRowHeight: string | number;
  showPromotedFilters: boolean;
  displayAs: string;
  contextPage: object;
  toggleFieldVisibility: boolean;
}

function SelectableTable(props: SimpleTableSelectProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ListView = getComponentFromMap('ListView');
  const PromotedFilters = getComponentFromMap('PromotedFilters');

  const {
    label,
    getPConnect,
    showLabel = true,
    viewName = '',
    parameters,
    dataRelationshipContext = null,
    referenceList,
    showPromotedFilters,
    displayAs,
    readonlyContextList,
    contextPage,
    toggleFieldVisibility
  } = props;

  const pConn = getPConnect();

  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };
  if (propsToUse.showLabel === false) {
    propsToUse.label = '';
  }

  const { compositeKeys, fieldMetadata } = getFieldMeta(getPConnect, dataRelationshipContext);
  const { pageClass } = fieldMetadata;

  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
  const { selectionMode, selectionList } = pConn.getConfigProps() as any;
  const isMultiSelectMode = selectionMode === MULTI;

  useLayoutEffect(() => {
    if (isMultiSelectMode) {
      // register selectionList in c11nEnv stateProps for client side validation
      pConn.setStateProps({ selectionList });
      pConn.getListActions().initDefaultPageInstructions(selectionList, compositeKeys);
    }
  }, []);

  const additionalTableConfig: any = {
    rowDensity: displayAs === 'table' || displayAs === 'advancedSearch',
    enableFreezeColumns: displayAs === 'table' || displayAs === 'advancedSearch',
    autoSizeColumns: displayAs === 'table' || displayAs === 'advancedSearch',
    resetColumnWidths: displayAs === 'table' || displayAs === 'advancedSearch',
    defaultFieldDef: {
      aggregation: false
    },
    itemKey: '$key'
  };

  const searchFields = (pConn as any).getRawConfigProps?.()?.searchFields ?? [];
  let selectedValues: any = isMultiSelectMode ? readonlyContextList : contextPage;

  if (displayAs === 'advancedSearch') {
    selectedValues = null;
  }

  const listViewProps = {
    ...props,
    title: propsToUse.label,
    personalization: false,
    grouping: false,
    expandGroups: false,
    showHeaderIcons: false,
    editing: false,
    globalSearch: true,
    toggleFieldVisibility: (displayAs === 'table' || displayAs === 'advancedSearch') && toggleFieldVisibility,
    basicMode: true,
    additionalTableConfig,
    compositeKeys,
    viewName,
    parameters,
    searchFields,
    selectedValues,
    isAdvancedSearchAndSelect: displayAs === 'advancedSearch'
  };

  const filters = (getPConnect().getRawMetadata() as any).config.promotedFilters ?? [];

  if (showPromotedFilters && filters.length > 0) {
    return (
      <PromotedFilters
        getPConnect={getPConnect}
        viewName={viewName}
        filters={filters}
        listViewProps={listViewProps}
        pageClass={pageClass}
        parameters={parameters}
        referenceList={referenceList}
      />
    );
  }
  return <ListView {...listViewProps} />;
}

export default function SimpleTableSelect(props: SimpleTableSelectProps) {
  const SimpleTableManual = getComponentFromMap('SimpleTableManual');

  const { getPConnect, renderMode = '' } = props;

  const pConn = getPConnect();
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
  const { selectionMode } = pConn.getConfigProps() as any;
  const isMultiSelectMode = selectionMode === MULTI;

  if (isMultiSelectMode && renderMode === 'ReadOnly') {
    return <SimpleTableManual {...props} />;
  }

  return <SelectableTable {...props} />;
}
