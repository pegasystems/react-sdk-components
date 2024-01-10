/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo } from 'react';

import { getReferenceList, buildView } from '../../helpers/field-group-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface FieldGroupTemplateProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  referenceList?: any[],
  contextClass: string,
  renderMode?: string,
  heading?: string,
  lookForChildInConfig?: boolean,
  displayMode?: string,
  fieldHeader?: string,
  allowTableEdit: boolean
}


export default function FieldGroupTemplate(props: FieldGroupTemplateProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldGroup = getComponentFromMap('FieldGroup');
  const FieldGroupList = getComponentFromMap('FieldGroupList');

  const {
    referenceList = [],
    renderMode,
    contextClass,
    getPConnect,
    lookForChildInConfig,
    heading = '',
    displayMode,
    fieldHeader,
    allowTableEdit: allowAddEdit
  } = props;
  const pConn = getPConnect();
  const resolvedList = getReferenceList(pConn);
  pConn.setReferenceList(resolvedList);
  const pageReference = `${pConn.getPageReference()}${resolvedList}`;
  const isReadonlyMode = renderMode === 'ReadOnly' || displayMode === 'LABELS_LEFT';
  const HEADING = heading ?? 'Row';

  const getDynamicHeaderProp = (item, index) => {
    if (fieldHeader === 'propertyRef' && heading && item[heading.substring(1)]) {
      return item[heading.substring(1)];
    }
    return `Row ${index + 1}`;
  };

  const addRecord = () => {
    if (PCore.getPCoreVersion()?.includes('8.7')) {
      pConn.getListActions().insert({ classID: contextClass }, referenceList.length, pageReference);
    } else {
      pConn.getListActions().insert({}, referenceList.length, null);  // 3rd arg null until typedef marked correctly as optional
    }
  };

  if (!isReadonlyMode) {
    const addFieldGroupItem = () => {
      addRecord();
    };
    const deleteFieldGroupItem = index => {
      if (PCore.getPCoreVersion()?.includes('8.7')) {
        pConn.getListActions().deleteEntry(index, pageReference);
      } else {
        pConn.getListActions().deleteEntry(index, null);  // 2nd arg null until typedef marked correctly as optional
      }
    };
    if (referenceList.length === 0 && allowAddEdit !== false) {
      addFieldGroupItem();
    }

    const MemoisedChildren = useMemo(() => {
      return referenceList.map((item, index) => ({
        id: index,
        name:
          fieldHeader === 'propertyRef'
            ? getDynamicHeaderProp(item, index)
            : `${HEADING} ${index + 1}`,
        children: buildView(pConn, index, lookForChildInConfig)
      }));
    }, [referenceList?.length]);

    return (
      <FieldGroupList
        items={MemoisedChildren}
        onAdd={allowAddEdit !== false ? addFieldGroupItem : undefined}
        onDelete={allowAddEdit !== false ? deleteFieldGroupItem : undefined}
      />
    );
  }

  pConn.setInheritedProp('displayMode', 'LABELS_LEFT');
  const memoisedReadOnlyList = useMemo(() => {
    return referenceList.map((item, index) => {
      const key = item[heading] || `field-group-row-${index}`;
      return (
        <FieldGroup
          key={key}
          name={fieldHeader === 'propertyRef' ? getDynamicHeaderProp(item, index) : `${HEADING} ${index + 1}`}
        >
          {buildView(pConn, index, lookForChildInConfig)}
        </FieldGroup>
      );
    });
  }, []);

  return <div>{memoisedReadOnlyList}</div>;
}
