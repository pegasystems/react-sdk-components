import { Checkbox, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { useEffect, useMemo, useRef, useState } from 'react';
import utils from './utils';
import { debounce } from 'throttle-debounce';

export default function Multiselect(props) {
  const {
    getPConnect,
    label,
    placeholder,
    referenceList,
    selectionKey,
    primaryField,
    initialCaseClass,
    showSecondaryInSearchOnly = false,
    listType = '',
    isGroupData = false,
    referenceType,
    secondaryFields,
    groupDataSource = [],
    parameters = {},
    matchPosition = 'contains',
    maxResultsDisplay,
    groupColumnsConfig = [{}],
    selectionList,
    value
  } = props;
  let { datasource = [], columns = [{}] } = props;
  const { doSearch, getDisplayFieldsMetaData, useDeepMemo, preProcessColumns, getGroupDataForItemsTree } = utils;

  if (referenceList.length > 0) {
    datasource = referenceList;
    columns = [
      {
        value: primaryField,
        display: 'true',
        useForSearch: true,
        primary: 'true'
      },
      {
        value: selectionKey,
        setProperty: selectionKey,
        key: 'true'
      }
    ];
    let secondaryColumns: any = [];
    if (secondaryFields) {
      secondaryColumns = secondaryFields.map(secondaryField => ({
        value: secondaryField,
        display: 'true',
        secondary: 'true',
        useForSearch: 'true'
      }));
    } else {
      secondaryColumns = [
        {
          value: selectionKey,
          display: 'true',
          secondary: 'true',
          useForSearch: 'true'
        }
      ];
    }
    if (referenceType === 'Case') {
      columns = [...columns, ...secondaryColumns];
    }
  }
  const [inputValue, setInputValue] = useState(value);
  const [selectedItems, setSelectedItems] = useState([]);

  const dataConfig = useDeepMemo(() => {
    return {
      dataSource: datasource,
      groupDataSource,
      isGroupData,
      showSecondaryInSearchOnly,
      parameters,
      matchPosition,
      listType,
      maxResultsDisplay: maxResultsDisplay || '100',
      columns: preProcessColumns(columns),
      groupColumnsConfig: preProcessColumns(groupColumnsConfig)
    };
  }, [
    datasource,
    groupDataSource,
    isGroupData,
    showSecondaryInSearchOnly,
    parameters,
    matchPosition,
    listType,
    maxResultsDisplay,
    columns,
    groupColumnsConfig
  ]);
  const groupsDisplayFieldMeta = useMemo(
    () => (listType !== 'associated' ? getDisplayFieldsMetaData(dataConfig.groupColumnsConfig) : null),
    [dataConfig.groupColumnsConfig]
  );

  const itemsTreeBaseData = getGroupDataForItemsTree(groupDataSource, groupsDisplayFieldMeta, showSecondaryInSearchOnly) || [];

  const [itemsTree, setItemsTree] = useState(
    isGroupData ? getGroupDataForItemsTree(groupDataSource, groupsDisplayFieldMeta, showSecondaryInSearchOnly) : []
  );

  const displayFieldMeta = listType !== 'associated' ? getDisplayFieldsMetaData(dataConfig.columns) : null;
  const getCaseListBasedOnParamsDebounced: any = useRef();
  const pConn = getPConnect();
  const contextName = pConn.getContextName();
  const listActions = pConn.getListActions();
  const dataApiObj = useRef();

  const icon = <CheckBoxOutlineBlankIcon fontSize='small' />;
  const checkedIcon = <CheckBoxIcon fontSize='small' />;

  // main search function trigger
  const getCaseListBasedOnParams = async (searchText, group, selectedRows, currentItemsTree, isTriggeredFromSearch = false) => {
    if (referenceList && referenceList.length > 0) {
      selectedRows = await listActions.getSelectedRows(true);

      selectedRows =
        selectedRows.length > 0
          ? selectedRows.map(item => {
              return {
                id: item[selectionKey.startsWith('.') ? selectionKey.substring(1) : selectionKey],
                primary: item[primaryField.startsWith('.') ? primaryField.substring(1) : primaryField]
              };
            })
          : [];
    }

    // if items tree is null or text search is triggered then always should use fresh data object, we use the original object
    const initalItemsTree = isTriggeredFromSearch || !currentItemsTree ? [...itemsTreeBaseData] : [...currentItemsTree];
    const res = await doSearch(
      searchText,
      group,
      initialCaseClass,
      displayFieldMeta,
      dataApiObj.current,
      initalItemsTree,
      isGroupData,
      showSecondaryInSearchOnly,
      selectedRows || []
    );
    setItemsTree(res);
  };

  useEffect(() => {
    if (referenceList && referenceList.length > 0) {
      pConn.setReferenceList(selectionList);
    }
  }, [pConn]);

  useEffect(() => {
    getCaseListBasedOnParamsDebounced.current = debounce(500, getCaseListBasedOnParams);
  }, []);

  useEffect(() => {
    if (listType !== 'associated') {
      PCore.getDataApi()
        ?.init(dataConfig, contextName)
        .then(dataObj => {
          dataApiObj.current = dataObj;
          if (!isGroupData) {
            getCaseListBasedOnParamsDebounced.current(inputValue ?? '', '', [...selectedItems], [...itemsTree]);
          }
        });
    }
  }, [dataConfig, listType, dataConfig.columns, inputValue, dataConfig.groupColumnsConfig, showSecondaryInSearchOnly]);

  const onSearchHandler = ev => {
    const searchText = ev.target.value;
    setInputValue(searchText);
    getCaseListBasedOnParamsDebounced.current(searchText, '', [...selectedItems], [...itemsTree], true);
  };

  const setSelectedItemsForReferenceList = item => {
    // Clear error messages if any
    const propName = pConn.getStateProps().selectionList;
    pConn.clearErrorMessages({
      property: propName
    });
    const { selected } = item;
    if (selected) {
      utils.insertInstruction(pConn, selectionList, selectionKey, primaryField, item);
    } else {
      utils.deleteInstruction(pConn, selectionList, selectionKey, item);
    }
  };

  const handleChange = (event, newSelectedValues) => {
    let clickedItem;
    let updatedItems: any = [];
    if (newSelectedValues && newSelectedValues.length > 0) {
      updatedItems = newSelectedValues.map(ele => {
        ele.selected = true;
        return { text: ele.primary, id: ele.id, selected: true };
      });
    }
    if (newSelectedValues.length > selectedItems.length) {
      clickedItem = newSelectedValues.filter(item => !selectedItems.some((ele: any) => ele.id === item.id));
    } else {
      clickedItem = selectedItems.filter((item: any) => !newSelectedValues.some((ele: any) => ele.id === item.id));
      clickedItem[0].selected = false;
    }
    itemsTree.forEach(ele => {
      ele.selected = !!updatedItems.find(item => item.id === ele.id);
    });

    setSelectedItems(updatedItems);
    setItemsTree(itemsTree);

    setInputValue('');

    // if this is a referenceList case
    if (referenceList) setSelectedItemsForReferenceList(clickedItem[0]);
  };

  return (
    <Autocomplete
      multiple
      fullWidth
      options={itemsTree}
      disableCloseOnSelect
      getOptionSelected={(option, val) => option.primary === val.primary}
      getOptionLabel={option => option.primary}
      onChange={handleChange}
      renderOption={(option, { selected }) => (
        <>
          <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
          {option.primary}
        </>
      )}
      renderInput={params => (
        <TextField {...params} variant='outlined' fullWidth label={label} placeholder={placeholder} size='small' onChange={onSearchHandler} />
      )}
    />
  );
}
