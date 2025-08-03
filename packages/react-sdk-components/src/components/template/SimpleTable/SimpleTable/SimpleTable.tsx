/* eslint-disable react-hooks/rules-of-hooks */
import { useRef } from 'react';

import { buildMetaForListView, getContext } from '../../../helpers/simpleTableHelpers';
import LazyLoad from '../../../../bridge/LazyLoad';

import { PConnProps } from '../../../../types/PConnProps';

// Can't use SimpleTableProps until getComponentConfig() and getFieldMetadata() are NOT private
interface SimpleTableProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  multiRecordDisplayAs: string;
  allowTableEdit: boolean;
  contextClass: any;
  label: string;
  propertyLabel?: string;
  displayMode?: string;
  fieldMetadata?: any;
  hideLabel?: boolean;
  parameters?: any;
  isDataObject?: boolean;
  type?: string;
  ruleClass?: string;
  authorContext?: string;
  name?: string;
}

export default function SimpleTable(props: SimpleTableProps) {
  const {
    getPConnect,
    multiRecordDisplayAs,
    allowTableEdit,
    label: labelProp,
    propertyLabel,
    displayMode,
    fieldMetadata,
    hideLabel,
    parameters,
    isDataObject,
    type,
    ruleClass,
    authorContext,
    name
  } = props;

  let { contextClass } = props;
  if (!contextClass) {
    let listName = getPConnect().getComponentConfig().referenceList;
    listName = PCore.getAnnotationUtils().getPropertyName(listName);
    // was... contextClass = getPConnect().getFieldMetadata(listName)?.pageClass;
    const theFieldMetadata = getPConnect().getFieldMetadata(listName);
    if (theFieldMetadata) {
      contextClass = theFieldMetadata.pageClass;
    } else {
      contextClass = undefined;
    }
  }
  if (multiRecordDisplayAs === 'fieldGroup') {
    const fieldGroupProps = { ...props, contextClass };
    return <LazyLoad componentName='FieldGroupTemplate' {...fieldGroupProps} />;
  }

  const label = labelProp || propertyLabel;
  const propsToUse = { label, ...getPConnect().getInheritedProps() };
  const isDisplayModeEnabled = displayMode === 'DISPLAY_ONLY';

  if (fieldMetadata && fieldMetadata.type === 'Page List' && fieldMetadata.dataRetrievalType === 'refer') {
    const {
      children: [{ children: rawFields }],
      parameters: rawParams
    } = (getPConnect().getRawMetadata() as any).config;
    if (isDisplayModeEnabled && hideLabel) {
      propsToUse.label = '';
    }

    const metaForListView = buildMetaForListView(
      fieldMetadata,
      rawFields,
      type,
      ruleClass,
      name,
      propsToUse.label,
      isDataObject,
      parameters // resolved params
    );

    const metaForPConnect = JSON.parse(JSON.stringify(metaForListView));
    // @ts-ignore - PCore.getMetadataUtils().getPropertyMetadata - An argument for 'currentClassID' was not provided.
    metaForPConnect.config.parameters = rawParams ?? PCore.getMetadataUtils().getPropertyMetadata(name)?.datasource?.parameters;

    const { referenceListStr: referenceList } = getContext(getPConnect());
    let requiredContextForQueryInDisplayMode = {};
    if (isDisplayModeEnabled) {
      requiredContextForQueryInDisplayMode = {
        referenceList
      };
    }
    const options = {
      context: getPConnect().getContextName(),
      pageReference: getPConnect().getPageReference(),
      ...requiredContextForQueryInDisplayMode
    };

    const refToPConnect = useRef(PCore.createPConnect({ meta: metaForPConnect, options }).getPConnect).current; // getPConnect should be created only once.
    /* BUG-637178 : need to send context */
    const listViewProps = {
      ...metaForListView.config,
      getPConnect: refToPConnect,
      displayMode,
      fieldName: authorContext,
      bInForm: true
    };
    return <LazyLoad componentName='ListView' {...listViewProps} />;
  }
  const simpleTableManualProps: any = { ...props, contextClass };
  if (allowTableEdit === false) {
    simpleTableManualProps.hideAddRow = true;
    simpleTableManualProps.hideDeleteRow = true;
    simpleTableManualProps.disableDragDrop = true;
  }
  return <LazyLoad componentName='SimpleTableManual' {...simpleTableManualProps} />;
}
