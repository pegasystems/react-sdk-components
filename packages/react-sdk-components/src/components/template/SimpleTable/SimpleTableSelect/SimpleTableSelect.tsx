import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';

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
}

const isSelfReferencedProperty = (param, referenceProp) => {
  const [, parentPropName] = param.split('.');
  return parentPropName === referenceProp;
};

/**
 * SimpleTable react component
 * @param {*} props - props
 */
export default function SimpleTableSelect(props: SimpleTableSelectProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ListView = getComponentFromMap('ListView');
  const SimpleTable = getComponentFromMap('SimpleTable');
  const PromotedFilters = getComponentFromMap('PromotedFilters');

  const { label, getPConnect, renderMode = '', showLabel = true, viewName = '', parameters, dataRelationshipContext = null } = props;

  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };
  if (propsToUse.showLabel === false) {
    propsToUse.label = '';
  }

  const pConn = getPConnect();
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
  const { selectionMode, selectionList } = pConn.getConfigProps() as any;
  const isMultiSelectMode = selectionMode === MULTI;

  if (isMultiSelectMode && renderMode === 'ReadOnly') {
    return <SimpleTable {...props} showLabel={propsToUse.showLabel} />;
  }

  const pageReference = pConn.getPageReference();
  let referenceProp = isMultiSelectMode ? selectionList.substring(1) : pageReference.substring(pageReference.lastIndexOf('.') + 1);
  // Replace here to use the context name instead
  let contextPageReference: string | null = null;
  if (props.dataRelationshipContext !== null && selectionMode === 'single') {
    referenceProp = dataRelationshipContext;
    contextPageReference = pageReference.concat('.').concat(referenceProp);
  }

  // Need to get this written so typedefs work
  const { datasource: { parameters: fieldParameters = {} } = {}, pageClass } = isMultiSelectMode
    ? pConn.getFieldMetadata(`@P .${referenceProp}`)
    : pConn.getCurrentPageFieldMetadata(contextPageReference);

  const compositeKeys: any[] = [];
  Object.values(fieldParameters).forEach((param: any) => {
    if (isSelfReferencedProperty(param, referenceProp)) {
      compositeKeys.push(param.substring(param.lastIndexOf('.') + 1));
    }
  });

  // setting default row height for select table
  const defaultRowHeight = '2';

  const additionalTableConfig = {
    rowDensity: false,
    enableFreezeColumns: false,
    autoSizeColumns: false,
    resetColumnWidths: false,
    defaultFieldDef: {
      showMenu: false,
      noContextMenu: true,
      grouping: false,
    },
    itemKey: '$key',
    defaultRowHeight,
  };

  const listViewProps = {
    ...props,
    title: propsToUse.label,
    personalization: false,
    grouping: false,
    expandGroups: false,
    reorderFields: false,
    showHeaderIcons: false,
    editing: false,
    globalSearch: true,
    toggleFieldVisibility: false,
    basicMode: true,
    additionalTableConfig,
    compositeKeys,
    viewName,
    parameters,
  };

  const filters = (getPConnect().getRawMetadata() as any).config.promotedFilters ?? [];

  const isSearchable = filters.length > 0;

  if (isSearchable) {
    return (
      <PromotedFilters
        getPConnect={getPConnect}
        viewName={viewName}
        filters={filters}
        listViewProps={listViewProps}
        pageClass={pageClass}
        parameters={parameters}
      />
    );
  }
  return <ListView {...listViewProps} />;
}
