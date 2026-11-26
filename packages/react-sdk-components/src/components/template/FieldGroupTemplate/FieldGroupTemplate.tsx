import { useLayoutEffect, useMemo } from 'react';

import { getReferenceList, buildView } from '../../helpers/field-group-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface FieldGroupTemplateProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  referenceList?: any[];
  contextClass: string;
  renderMode?: string;
  heading?: string;
  lookForChildInConfig?: boolean;
  displayMode?: string;
  fieldHeader?: string;
  allowTableEdit: boolean;
  allowActions?: any;
  uniqueField?: string;
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
    allowActions,
    allowTableEdit: allowAddEdit,
    uniqueField
  } = props;
  const pConn = getPConnect();
  const resolvedList = getReferenceList(pConn);
  pConn.setReferenceList(resolvedList);
  const pageReference = `${pConn.getPageReference()}${resolvedList}`;
  const isReadonlyMode = renderMode === 'ReadOnly' || displayMode === 'DISPLAY_ONLY';
  const HEADING = heading ?? 'Row';

  const hasAllowActions = Object.keys(allowActions ?? {}).length > 0;
  const { allowAdd: actionAdd, allowDelete: actionDelete } = allowActions ?? {};
  const allowAdd = hasAllowActions ? (actionAdd ?? true) : (allowAddEdit ?? true);
  const allowDelete = hasAllowActions ? (actionDelete ?? true) : (allowAddEdit ?? true);

  useLayoutEffect(() => {
    if (!isReadonlyMode) {
      // uniqueField (e.g. '.EmbedListUUID__') lets core seed a row UUID in the default page instructions, matching Constellation
      // @ts-expect-error - Argument of type 'undefined' is not assignable to parameter of type 'string[]'
      pConn.getListActions().initDefaultPageInstructions(resolvedList, undefined, uniqueField);
    }
  }, [referenceList?.length]);

  const getDynamicHeaderProp = (item, index) => {
    if (fieldHeader === 'propertyRef' && heading && item[heading.substring(1)]) {
      return item[heading.substring(1)];
    }
    return `Row ${index + 1}`;
  };

  // Seed a UUID for the list's uniqueField on new rows, matching Constellation
  const withUniqueField = (payload: Record<string, string>) => {
    if (uniqueField) {
      payload[uniqueField.startsWith('.') ? uniqueField.substring(1) : uniqueField] = crypto.randomUUID();
    }
    return payload;
  };

  const addRecord = () => {
    if (PCore.getPCoreVersion()?.includes('8.7')) {
      pConn.getListActions().insert(withUniqueField({ classID: contextClass }), referenceList.length, pageReference);
    } else {
      pConn.getListActions().insert(withUniqueField({}), referenceList.length);
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
        pConn.getListActions().deleteEntry(index);
      }
    };
    if (referenceList.length === 0 && allowAdd) {
      addFieldGroupItem();
    }

    const MemoisedChildren = useMemo(() => {
      return referenceList.map((item, index) => ({
        id: index,
        name: fieldHeader === 'propertyRef' ? getDynamicHeaderProp(item, index) : `${HEADING} ${index + 1}`,
        children: buildView(pConn, index, lookForChildInConfig)
      }));
    }, [referenceList?.length]);

    return (
      <FieldGroupList
        items={MemoisedChildren}
        onAdd={allowAdd ? addFieldGroupItem : undefined}
        onDelete={allowDelete ? deleteFieldGroupItem : undefined}
      />
    );
  }

  pConn.setInheritedProp('displayMode', 'DISPLAY_ONLY');
  const memoisedReadOnlyList = useMemo(() => {
    return referenceList.map((item, index) => {
      const key = item[heading] || `field-group-row-${index}`;
      return (
        <FieldGroup key={key} name={fieldHeader === 'propertyRef' ? getDynamicHeaderProp(item, index) : `${HEADING} ${index + 1}`}>
          {buildView(pConn, index, lookForChildInConfig)}
        </FieldGroup>
      );
    });
  }, []);

  return <div>{memoisedReadOnlyList}</div>;
}
