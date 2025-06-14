import React, { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import makeStyles from '@mui/styles/makeStyles';
import Link from '@mui/material/Link';
import { createElement } from 'react';
import TableSortLabel from '@mui/material/TableSortLabel';
import MoreIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FilterListIcon from '@mui/icons-material/FilterList';
import SubjectIcon from '@mui/icons-material/Subject';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import createPConnectComponent from '../../../../bridge/react_pconnect';
import { Utils } from '../../../helpers/utils';
import { getReferenceList } from '../../../helpers/field-group-utils';
import { getDataPage } from '../../../helpers/data_page';
import { buildFieldsForTable, filterData, getContext } from '../../../helpers/simpleTableHelpers';
import { PConnProps } from '../../../../types/PConnProps';
import { format } from '../../../helpers/formatters';

interface SimpleTableManualProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  hideAddRow?: boolean;
  hideDeleteRow?: boolean;
  referenceList?: any[];
  renderMode?: string;
  presets?: any[];
  label?: string;
  showLabel?: boolean;
  dataPageName?: string;
  contextClass?: string;
  propertyLabel?: string;
  fieldMetadata?: any;
  editMode?: string;
  addAndEditRowsWithin?: any;
  viewForAddAndEditModal?: any;
  editModeConfig?: any;
  displayMode?: string;
  useSeparateViewForEdit: any;
  viewForEditModal: any;
  validatemessage?: string;
  required?: boolean;
}

const useStyles = makeStyles((/* theme */) => ({
  label: {
    margin: '8px'
  },
  tableLabel: {
    '&::after': {
      display: 'inline',
      content: '" *"',
      verticalAlign: 'top',
      color: 'var(--app-error-color)'
    }
  },
  message: {
    margin: '8px',
    color: 'var(--app-error-color)',
    fontSize: '14px'
  },
  header: {
    background: '#f5f5f5'
  },
  tableCell: {
    borderRight: '1px solid lightgray',
    padding: '8px'
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1
  },
  moreIcon: {
    verticalAlign: 'bottom'
  }
}));

let menuColumnId = '';
let menuColumnType = '';
let menuColumnLabel = '';

const filterByColumns: any[] = [];
let myRows: any[];

export default function SimpleTableManual(props: PropsWithChildren<SimpleTableManualProps>) {
  const classes = useStyles();
  const {
    getPConnect,
    referenceList = [], // if referenceList not in configProps$, default to empy list
    children,
    renderMode,
    presets,
    label: labelProp,
    showLabel,
    dataPageName,
    contextClass,
    hideAddRow,
    hideDeleteRow,
    propertyLabel,
    fieldMetadata,
    editMode,
    addAndEditRowsWithin,
    viewForAddAndEditModal,
    editModeConfig,
    displayMode,
    useSeparateViewForEdit,
    viewForEditModal,
    required,
    validatemessage
  } = props;
  const pConn = getPConnect();
  const [rowData, setRowData] = useState([]);
  const [elements, setElementsData] = useState([]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof any>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editAnchorEl, setEditAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<string>();
  const [containsDateOrTime, setContainsDateOrTime] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('string');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [displayDialogFilterName, setDisplayDialogFilterName] = useState<string>('');
  const [displayDialogContainsFilter, setDisplayDialogContainsFilter] = useState<string>('contains');
  const [displayDialogContainsValue, setDisplayDialogContainsValue] = useState<string>('');
  const [displayDialogDateFilter, setDisplayDialogDateFilter] = useState<string>('notequal');
  const [displayDialogDateValue, setDisplayDialogDateValue] = useState<string>('');
  const selectedRowIndex: any = useRef(null);

  const parameters = fieldMetadata?.datasource?.parameters;
  const { referenceListStr } = getContext(getPConnect());
  const label = labelProp || propertyLabel;
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };
  if (propsToUse.showLabel === false) {
    propsToUse.label = '';
  }
  // Getting current context
  const context = getPConnect().getContextName();
  const resolvedList = getReferenceList(pConn);
  pConn.setReferenceList(resolvedList);
  const menuIconOverride$ = Utils.getImageSrc('trash', Utils.getSDKStaticConentUrl());

  const resolvedFields = children?.[0]?.children || presets?.[0].children?.[0].children;
  // NOTE: props has each child.config with datasource and value undefined
  //  but getRawMetadata() has each child.config with datasource and value showing their unresolved values (ex: "@P thePropName")
  //  We need to use the prop name as the "glue" to tie the table dataSource, displayColumns and data together.
  //  So, in the code below, we'll use the unresolved config.value (but replacing the space with an underscore to keep things happy)
  const rawMetadata: any = getPConnect().getRawMetadata();

  // get raw config since @P and other annotations are processed and don't appear in the resolved config.
  //  Destructure "raw" children into array var: "rawFields"
  //  NOTE: when config.listType == "associated", the property can be found in either
  //    config.value (ex: "@P .DeclarantChoice") or
  //    config.datasource (ex: "@ASSOCIATED .DeclarantChoice")
  //  Neither of these appear in the resolved props

  const rawConfig = rawMetadata?.config;
  const rawFields = rawConfig?.children?.[0]?.children || rawConfig?.presets?.[0].children?.[0]?.children;
  const isDisplayModeEnabled = displayMode === 'DISPLAY_ONLY';
  const readOnlyMode = renderMode === 'ReadOnly';
  const editableMode = renderMode === 'Editable';
  const showAddRowButton = !readOnlyMode && !hideAddRow;
  const allowEditingInModal =
    (editMode ? editMode === 'modal' : addAndEditRowsWithin === 'modal') && !(renderMode === 'ReadOnly' || isDisplayModeEnabled);
  const showDeleteButton = editableMode && !hideDeleteRow;
  const defaultView = editModeConfig ? editModeConfig.defaultView : viewForAddAndEditModal;
  const bUseSeparateViewForEdit = editModeConfig ? editModeConfig.useSeparateViewForEdit : useSeparateViewForEdit;
  const editView = editModeConfig ? editModeConfig.editView : viewForEditModal;

  const fieldsWithPropNames = rawFields.map((field, index) => {
    return { ...resolvedFields[index], propName: field.config.value.replace('@P .', '') };
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    buildElementsForTable();
    if (readOnlyMode || allowEditingInModal) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      generateRowsData();
    }
  }, [referenceList]);

  // fieldDefs will be an array where each entry will have a "name" which will be the
  //  "resolved" property name (that we can use as the colId) though it's not really
  //  resolved. The buildFieldsForTable helper just removes the "@P " (which is what
  //  Constellation DX Components do). It will also have the "label", and "meta" contains the original,
  //  unchanged config info. For now, much of the info here is carried over from
  //  Constellation DX Components.
  const fieldDefs = buildFieldsForTable(rawFields, resolvedFields, showDeleteButton);

  useLayoutEffect(() => {
    if (allowEditingInModal) {
      getPConnect()
        .getListActions()
        .initDefaultPageInstructions(
          getPConnect().getReferenceList(),
          fieldDefs.filter(item => item.name).map(item => item.name)
        );
    } else {
      // @ts-ignore - An argument for 'fields' was not provided
      getPConnect().getListActions().initDefaultPageInstructions(getPConnect().getReferenceList());
    }
  }, []);

  const displayedColumns = fieldDefs.map(field => {
    return field.name ? field.name : field.cellRenderer;
  });

  const getFormattedValue = (val, key) => {
    const rawField = fieldsWithPropNames.find(item => item.propName === key);
    let options = {};
    if (rawField && ['Boolean', 'Checkbox'].includes(rawField.type)) {
      const { trueLabel, falseLabel } = rawField.config;
      options = {
        trueLabel,
        falseLabel
      };
    }
    return rawField ? format(val, rawField.type, options) : val;
  };

  // console.log(`SimpleTable displayedColumns:`);
  // console.log(displayedColumns);

  // return the value that should be shown as the contents for the given row data
  //  of the given row field
  function getRowValue(inRowData: Object, inColKey: string): any {
    // See what data (if any) we have to display
    const refKeys: string[] = inColKey?.split('.');
    let valBuilder = inRowData;
    for (const key of refKeys) {
      valBuilder = valBuilder[key];
    }
    return getFormattedValue(valBuilder, inColKey);
  }

  const formatRowsData = data => {
    if (!data) return {};

    return data.map(item => {
      return displayedColumns.reduce((dataForRow, colKey) => {
        dataForRow[colKey] = getRowValue(item, colKey);
        return dataForRow;
      }, {});
    });
  };

  function generateRowsData() {
    // if referenceList is empty and dataPageName property value exists then make a datapage fetch call and get the list of data.
    if (!referenceList.length && dataPageName) {
      getDataPage(dataPageName, parameters, context)
        .then(listData => {
          const data = formatRowsData(listData);
          myRows = data;
          setRowData(data);
        })
        .catch(e => {
          // eslint-disable-next-line no-console
          console.log(e);
        });
    } else {
      // The referenceList prop has the JSON data for each row to be displayed
      //  in the table. So, iterate over referenceList to create the dataRows that
      //  we're using as the table's dataSource
      const data: any = [];
      for (const row of referenceList) {
        const dataForRow: Object = {};
        for (const col of displayedColumns) {
          const colKey: string = col;
          const theVal = getRowValue(row, colKey);
          dataForRow[colKey] = theVal || '';
        }
        data.push(dataForRow);
        myRows = data;
      }
      setRowData(data);
    }
  }

  // May be useful for debugging or understanding how it works.
  // These are the data structures referred to in the html file.
  //  These are the relationships that make the table work
  //  displayedColumns: key/value pairs where key is order of column and
  //    value is the property shown in that column. Ex: 1: "FirstName"
  //  rowData: array of each row's key/value pairs. Inside each row,
  //    each key is an entry in displayedColumns: ex: "FirstName": "Charles"
  //    Ex: { 1: {config: {label: "First Name", readOnly: true: name: "FirstName"}}, type: "TextInput" }
  //    The "type" indicates the type of component that should be used for editing (when editing is enabled)
  //
  // console.log("SimpleTable displayedColumns:");
  // console.log(displayedColumns);
  // console.log(`SimpleTable rowData (${rowData.length} row(s)):`);
  // console.log(JSON.stringify(rowData));

  const addRecord = () => {
    if (allowEditingInModal && defaultView) {
      pConn
        .getActionsApi()
        // @ts-ignore
        .openEmbeddedDataModal(defaultView, pConn, referenceListStr, referenceList.length, PCore.getConstants().RESOURCE_STATUS.CREATE);
    } else {
      pConn.getListActions().insert({ classID: contextClass }, referenceList.length);
    }

    getPConnect().clearErrorMessages({
      property: (getPConnect().getStateProps() as any)?.referenceList?.substring(1)
    } as any);
  };

  const editRecord = () => {
    setEditAnchorEl(null);
    if (typeof selectedRowIndex.current === 'number') {
      pConn
        .getActionsApi()
        // @ts-ignore
        .openEmbeddedDataModal(
          bUseSeparateViewForEdit ? editView : defaultView,
          pConn,
          referenceListStr,
          selectedRowIndex.current,
          PCore.getConstants().RESOURCE_STATUS.UPDATE
        );
    }
  };

  const deleteRecord = () => {
    setEditAnchorEl(null);
    pConn.getListActions().deleteEntry(selectedRowIndex.current);
  };

  const deleteRecordFromInlineEditable = (index: number) => {
    pConn.getListActions().deleteEntry(index);
  };

  function buildElementsForTable() {
    const eleData: any = [];
    referenceList.forEach((element, index) => {
      const data: any = [];
      rawFields.forEach(item => {
        // removing label field from config to hide title in the table cell
        item = { ...item, config: { ...item.config, label: '', displayMode: readOnlyMode || allowEditingInModal ? 'DISPLAY_ONLY' : undefined } };
        const referenceListData = getReferenceList(pConn);
        const isDatapage = referenceListData.startsWith('D_');
        const pageReferenceValue = isDatapage
          ? `${referenceListData}[${index}]`
          : `${pConn.getPageReference()}${referenceListData.substring(referenceListData.lastIndexOf('.'))}[${index}]`;
        const config = {
          meta: item,
          options: {
            context,
            pageReference: pageReferenceValue,
            referenceList: referenceListData,
            hasForm: true
          }
        };
        const view = PCore.createPConnect(config);
        data.push(createElement(createPConnectComponent(), view));
      });
      eleData.push(data);
    });
    setElementsData(eleData);
  }

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property: keyof any) => (event: React.MouseEvent<unknown>) => {
    handleRequestSort(event, property);
  };

  function descendingComparator<T>(a: T, b: T, orderedBy: keyof T) {
    if (!orderedBy || (!a[orderedBy] && !b[orderedBy])) {
      return 0;
    }
    if (!b[orderedBy] || b[orderedBy] < a[orderedBy]) {
      return -1;
    }
    if (!a[orderedBy] || b[orderedBy] > a[orderedBy]) {
      return 1;
    }
    return 0;
  }

  type Order = 'asc' | 'desc';

  function getComparator<Key extends keyof any>(
    theOrder: Order,
    orderedBy: Key
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return theOrder === 'desc' ? (a, b) => descendingComparator(a, b, orderedBy) : (a, b) => -descendingComparator(a, b, orderedBy);
  }

  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });

    const newElements = new Array(stabilizedThis.length);
    stabilizedThis.forEach((el, index) => {
      newElements[index] = elements[el[1]];
    });
    return newElements;
  }

  function _menuClick(event, columnId: string, columnType: string, labelValue: string) {
    menuColumnId = columnId;
    menuColumnType = columnType;
    menuColumnLabel = labelValue;

    setAnchorEl(event.currentTarget);
  }

  function editMenuClick(event, index) {
    selectedRowIndex.current = index;
    setEditAnchorEl(event.currentTarget);
  }

  function _menuClose() {
    setAnchorEl(null);
    setEditAnchorEl(null);
  }

  function _filterMenu() {
    setAnchorEl(null);

    let bFound = false;

    for (const filterObj of filterByColumns) {
      if (filterObj.ref === menuColumnId) {
        setFilterBy(menuColumnLabel);
        if (filterObj.type === 'Date' || filterObj.type === 'DateTime' || filterObj.type === 'Time') {
          setContainsDateOrTime(true);
          setFilterType(filterObj.type);
          setDisplayDialogDateFilter(filterObj.containsFilter);
          setDisplayDialogDateValue(filterObj.containsFilterValue);
        } else {
          setContainsDateOrTime(false);
          setFilterType('string');
          setDisplayDialogContainsFilter(filterObj.containsFilter);
          setDisplayDialogContainsValue(filterObj.containsFilterValue);
        }
        bFound = true;
        break;
      }
    }

    if (!bFound) {
      setFilterBy(menuColumnLabel);
      setDisplayDialogFilterName(menuColumnId);
      setDisplayDialogContainsValue('');

      switch (menuColumnType) {
        case 'Date':
        case 'DateTime':
        case 'Time':
          setContainsDateOrTime(true);
          setFilterType(menuColumnType);
          break;
        default:
          setContainsDateOrTime(false);
          setFilterType('string');
          break;
      }
    }

    // open dialog
    setOpen(true);
  }

  function _groupMenu() {}

  function _closeDialog() {
    setOpen(false);
  }

  function _dialogContainsFilter(event) {
    setDisplayDialogContainsFilter(event.target.value);
  }

  function _dialogContainsValue(event) {
    setDisplayDialogContainsValue(event.target.value);
  }

  function _dialogDateFilter(event) {
    setDisplayDialogDateFilter(event.target.value);
  }

  function _dialogDateValue(event) {
    setDisplayDialogDateValue(event.target.value);
  }

  function filterSortGroupBy() {
    // get original data set
    let theData: any = myRows.slice();

    // last filter config data is global
    theData = theData.filter(filterData(filterByColumns));

    // move data to array and then sort
    setRowData(theData);
  }

  function updateFilterWithInfo() {
    let bFound = false;
    for (const filterObj of filterByColumns) {
      if (filterObj.ref === menuColumnId) {
        filterObj.type = filterType;
        if (containsDateOrTime) {
          filterObj.containsFilter = displayDialogDateFilter;
          filterObj.containsFilterValue = displayDialogDateValue;
        } else {
          filterObj.containsFilter = displayDialogContainsFilter;
          filterObj.containsFilterValue = displayDialogContainsValue;
        }
        bFound = true;
        break;
      }
    }

    if (!bFound) {
      // add in
      const filterObj: any = {};
      filterObj.ref = menuColumnId;
      filterObj.type = filterType;
      if (containsDateOrTime) {
        filterObj.containsFilter = displayDialogDateFilter;
        filterObj.containsFilterValue = displayDialogDateValue;
      } else {
        filterObj.containsFilter = displayDialogContainsFilter;
        filterObj.containsFilterValue = displayDialogContainsValue;
      }

      filterByColumns.push(filterObj);
    }
  }

  function _submitFilter() {
    updateFilterWithInfo();
    filterSortGroupBy();

    setOpen(false);
  }

  function _showFilteredIcon(columnId) {
    for (const filterObj of filterByColumns) {
      if (filterObj.ref === columnId) {
        // eslint-disable-next-line sonarjs/prefer-single-boolean-return
        if (filterObj.containsFilterValue !== '') {
          return true;
        }
        return false;
      }
    }

    return false;
  }

  function results() {
    const len = editableMode ? elements.length : rowData.length;

    return len ? (
      <span style={{ fontSize: '0.9em', opacity: '0.7' }}>
        {len} result{len > 1 ? 's' : ''}
      </span>
    ) : null;
  }

  return (
    <>
      <TableContainer component={Paper} style={{ margin: '4px 0px' }} id='simple-table-manual'>
        {propsToUse.label && (
          <h3 className={`${classes.label} ${required ? classes.tableLabel : ''}`}>
            {propsToUse.label} {results()}
          </h3>
        )}
        {validatemessage && <div className={classes.message}>{validatemessage}</div>}
        <Table>
          <TableHead className={classes.header}>
            <TableRow>
              {fieldDefs.map((field: any, index) => {
                return (
                  <TableCell key={`head-${displayedColumns[index]}`} className={classes.tableCell}>
                    {(readOnlyMode || allowEditingInModal) && field.cellRenderer !== 'DeleteIcon' ? (
                      <div>
                        <TableSortLabel
                          active={orderBy === displayedColumns[index]}
                          direction={orderBy === displayedColumns[index] ? order : 'asc'}
                          onClick={createSortHandler(displayedColumns[index])}
                        >
                          {field.label || '---'}
                          {_showFilteredIcon(field.name) && <FilterListIcon className={classes.moreIcon} />}
                          {orderBy === displayedColumns[index] ? (
                            <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span>
                          ) : null}
                        </TableSortLabel>
                        <MoreIcon
                          id='menu-icon'
                          className={classes.moreIcon}
                          onClick={event => {
                            _menuClick(event, field.name, field.meta.type, field.label);
                          }}
                        />
                      </div>
                    ) : (
                      field.label
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {editableMode &&
              !allowEditingInModal &&
              elements.map((row: any, index) => {
                const theKey = `row-${index}`;
                return (
                  <TableRow key={theKey}>
                    {row.map((item, childIndex) => {
                      const theColKey = `data-${index}-${childIndex}`;
                      return (
                        <TableCell key={theColKey} className={classes.tableCell}>
                          {item}
                        </TableCell>
                      );
                    })}
                    {showDeleteButton && (
                      <TableCell>
                        <button
                          type='button'
                          className='psdk-utility-button'
                          id='delete-button'
                          aria-label='Delete Cell'
                          onClick={() => deleteRecordFromInlineEditable(index)}
                        >
                          <img className='psdk-utility-card-action-svg-icon' src={menuIconOverride$} />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            {(readOnlyMode || allowEditingInModal) &&
              rowData &&
              rowData.length > 0 &&
              stableSort(rowData, getComparator(order, orderBy))
                .slice(0)
                .map((row, index) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <TableRow key={index}>
                      {row.map((item, childIndex) => {
                        const theColKey = displayedColumns[childIndex];
                        return (
                          <TableCell key={theColKey} className={classes.tableCell}>
                            {item}
                          </TableCell>
                        );
                      })}
                      {showDeleteButton && (
                        <TableCell key='DeleteIcon' className={classes.tableCell}>
                          <div>
                            <MoreIcon
                              id='table-edit-menu-icon'
                              className={classes.moreIcon}
                              onClick={event => {
                                editMenuClick(event, index);
                              }}
                            />
                            <Menu id='table-edit-menu' anchorEl={editAnchorEl} keepMounted open={Boolean(editAnchorEl)} onClose={_menuClose}>
                              <MenuItem onClick={() => editRecord()}>Edit</MenuItem>
                              <MenuItem onClick={() => deleteRecord()}>Delete</MenuItem>
                            </Menu>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        {referenceList && referenceList.length === 0 && (
          <div className='no-records' id='no-records'>
            No records found.
          </div>
        )}
      </TableContainer>
      {showAddRowButton && (
        <div style={{ fontSize: '1rem' }}>
          <Link style={{ cursor: 'pointer' }} onClick={addRecord} underline='hover'>
            + Add
          </Link>
        </div>
      )}
      <Menu id='simple-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={_menuClose}>
        <MenuItem onClick={_filterMenu}>
          <FilterListIcon /> Filter
        </MenuItem>
        <MenuItem onClick={_groupMenu}>
          <SubjectIcon /> Group
        </MenuItem>
      </Menu>
      <Dialog open={open} onClose={_closeDialog} aria-labelledby='form-dialog-title'>
        <DialogTitle id='form-dialog-title'>Filter: {filterBy}</DialogTitle>
        <DialogContent>
          {containsDateOrTime ? (
            <>
              <Select variant='standard' value={displayDialogDateFilter} onChange={_dialogDateFilter} fullWidth>
                <MenuItem value='notequal'>is not equal to</MenuItem>
                <MenuItem value='equal'>is equal to</MenuItem>
                <MenuItem value='after'>after</MenuItem>
                <MenuItem value='before'>before</MenuItem>
                <MenuItem value='null'>is null</MenuItem>
                <MenuItem value='notnull'>is not null</MenuItem>
              </Select>
              {filterType === 'Date' && (
                <TextField
                  variant='standard'
                  autoFocus
                  margin='dense'
                  id='containsFilter'
                  type='date'
                  fullWidth
                  value={displayDialogDateValue}
                  onChange={_dialogDateValue}
                />
              )}
              {filterType === 'DateTime' && (
                <TextField
                  variant='standard'
                  autoFocus
                  margin='dense'
                  id='containsFilter'
                  type='datetime-local'
                  fullWidth
                  value={displayDialogDateValue}
                  onChange={_dialogDateValue}
                />
              )}
              {filterType === 'Time' && (
                <TextField
                  variant='standard'
                  autoFocus
                  margin='dense'
                  id='containsFilter'
                  type='time'
                  fullWidth
                  value={displayDialogDateValue}
                  onChange={_dialogDateValue}
                />
              )}
            </>
          ) : (
            <>
              <Select variant='standard' id='filter' fullWidth onChange={_dialogContainsFilter} value={displayDialogContainsFilter}>
                <MenuItem value='contains'>Contains</MenuItem>
                <MenuItem value='equals'>Equals</MenuItem>
                <MenuItem value='startswith'>Starts with</MenuItem>
              </Select>
              <TextField
                variant='standard'
                autoFocus
                margin='dense'
                id='containsFilter'
                type='text'
                fullWidth
                value={displayDialogContainsValue}
                onChange={_dialogContainsValue}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={_closeDialog} color='secondary'>
            Cancel
          </Button>
          <Button onClick={_submitFilter} color='primary'>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
