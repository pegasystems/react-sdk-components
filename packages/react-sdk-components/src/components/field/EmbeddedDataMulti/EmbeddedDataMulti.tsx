import type { PConnProps } from '../../../types/PConnProps';

interface EmbeddedDataMultiProps extends PConnProps {
  addEditAction?: string;
  addEditView?: string;
  displayAs?: string;
  editAction?: string;
  editMode?: string;
  editType?: string;
  editView?: string;
  readOnly?: boolean;
  repeatingView?: string;
  targetObjectClass?: string;
  useSeparateActionForEdit?: boolean;
  useSeparateViewForEdit?: boolean;
}

export default function EmbeddedDataMulti(props: EmbeddedDataMultiProps) {
  const {
    getPConnect,
    addEditAction,
    addEditView,
    displayAs,
    editAction,
    editMode,
    editType,
    editView,
    readOnly = false,
    repeatingView,
    targetObjectClass,
    useSeparateActionForEdit,
    useSeparateViewForEdit
  } = props;

  const pConn = getPConnect();
  const rawMetadata = pConn.getRawMetadata() as any;
  const rawMetadataConfig = rawMetadata?.config;

  if (!rawMetadataConfig) {
    return null;
  }

  const renderMode = readOnly ? 'ReadOnly' : 'Editable';

  let columnsChildren;
  if (displayAs === 'table' || displayAs === 'simpleTable') {
    columnsChildren = [
      {
        children: rawMetadataConfig.columns || [],
        name: 'Columns',
        type: 'Region'
      }
    ];
  }

  let regionWithView: unknown[] = [];
  if (displayAs === 'repeatingView') {
    regionWithView = [
      {
        children: [
          {
            type: 'reference',
            config: {
              type: 'view',
              name: repeatingView
            }
          }
        ],
        name: 'view',
        type: 'Region'
      }
    ];
  }

  const { pagelistValue } = rawMetadataConfig;
  const authorContext = pagelistValue?.startsWith('@P') ? pagelistValue?.substring(3) : pagelistValue;

  const simpleTableComponent = pConn.createComponent({
    type: 'View',
    config: {
      template: 'SimpleTable',
      type: 'multirecordlist',
      authorContext,
      name: authorContext?.substring(1),
      renderMode,
      multiRecordDisplayAs: displayAs === 'repeatingView' ? 'fieldGroup' : displayAs,
      referenceList: pagelistValue,
      contextClass: targetObjectClass,
      editMode,
      editModeConfig: {
        editType,
        defaultView: addEditView,
        defaultAction: addEditAction,
        useSeparateViewForEdit,
        useSeparateActionForEdit,
        editView,
        editAction
      },
      label: rawMetadataConfig.label,
      children: columnsChildren,
      displayField: rawMetadataConfig.displayField,
      uniqueField: rawMetadataConfig.uniqueField,
      targetClassLabel: rawMetadataConfig.targetClassLabel,
      targetClassLabelOption: rawMetadataConfig.targetClassLabelOption,
      fieldHeader: rawMetadataConfig.repeatingViewHeadingSource,
      heading: rawMetadataConfig.repeatingViewHeading,
      allowActions: {
        allowAdd: rawMetadataConfig.allowAdd ?? true,
        allowEdit: rawMetadataConfig.allowEdit ?? true,
        allowDelete: rawMetadataConfig.allowDelete ?? true,
        allowDragDrop: rawMetadataConfig.allowDragDrop ?? true
      },
      allowRowDelete: rawMetadataConfig.allowRowDelete ?? true,
      allowRowEdit: rawMetadataConfig.allowRowEdit ?? true,
      displayAs: displayAs === 'repeatingView' ? 'fieldGroup' : displayAs
    },
    children: regionWithView
  } as any);

  return <>{simpleTableComponent}</>;
}
