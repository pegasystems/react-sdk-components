import React from 'react';
import FieldGroupTemplate from '../../FieldGroupTemplate';
import SimpleTableManual from '../SimpleTableManual';
import type { PConnProps } from '../../../../types/PConnProps';

interface SimpleTableProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  multiRecordDisplayAs: string,
  allowTableEdit: boolean,
  contextClass: any
}



export default function SimpleTable(props: SimpleTableProps) {
  const { getPConnect, multiRecordDisplayAs, allowTableEdit } = props;

  let { contextClass } = props;
  if (!contextClass) {
    let listName = getPConnect().getComponentConfig().referenceList;
    listName = PCore.getAnnotationUtils().getPropertyName(listName);
    // was... contextClass = getPConnect().getFieldMetadata(listName)?.pageClass;
    const theFieldMetadata = getPConnect().getFieldMetadata(listName);
    if (theFieldMetadata) {
      contextClass = theFieldMetadata['pageClass'];
    } else {
      contextClass = undefined;
    }
  }
  if (multiRecordDisplayAs === 'fieldGroup') {
    const fieldGroupProps = { ...props, contextClass };
    return <FieldGroupTemplate {...fieldGroupProps} />;
  } else {
    const simpleTableManualProps = {...props, contextClass, hideAddRow: false, hideDeleteRow: false, disableDragDrop: false};
    if (allowTableEdit === false) {
      simpleTableManualProps.hideAddRow = true;
      simpleTableManualProps.hideDeleteRow = true;
      simpleTableManualProps.disableDragDrop = true;
    }
    return <SimpleTableManual {...simpleTableManualProps} />;
  }
}
