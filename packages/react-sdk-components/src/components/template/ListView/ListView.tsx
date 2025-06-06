/* eslint-disable no-plusplus */

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */

import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import MoreIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import SubjectIcon from '@mui/icons-material/Subject';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Radio } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';

import { filterData } from '../../helpers/simpleTableHelpers';

import './ListView.css';
import { getDateFormatInfo } from '../../helpers/date-format-utils';
import { getCurrencyOptions } from '../../field/Currency/currency-utils';
import { format } from '../../helpers/formatters';

import useInit from './hooks';
import { PConnProps } from '../../../types/PConnProps';

interface ListViewProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  bInForm?: boolean;
  globalSearch?: boolean;
  referenceList?: any[];
  // rowClickAction?: any;
  selectionMode?: string;
  referenceType?: string;
  payload?: any;
  parameters?: any;
  compositeKeys?: any;
  showDynamicFields?: boolean;
  readonlyContextList?: any;
  value: any;
}

const SELECTION_MODE = { SINGLE: 'single', MULTI: 'multi' };

let myRows: any[];

let menuColumnId = '';
let menuColumnType = '';
let menuColumnLabel = '';

let sortColumnId: any;

const filterByColumns: any[] = [];

export default function ListView(props: ListViewProps) {
  const { getPConnect, bInForm = true } = props;
  const {
    globalSearch,
    referenceList,
    /* rowClickAction, */
    selectionMode,
    referenceType,
    payload,
    parameters,
    compositeKeys,
    showDynamicFields,
    readonlyContextList: selectedValues,
    value
  } = props;
  const ref = useRef({}).current;
  const cosmosTableRef = useRef();
  // List component context
  const [listContext, setListContext] = useState<any>({});
  const { meta } = listContext;
  const xRayApis = PCore.getDebugger().getXRayRuntime();
  const xRayUid = xRayApis.startXRay();

  useInit({
    ...props,
    setListContext,
    ref,
    showDynamicFields,
    xRayUid,
    cosmosTableRef
  });

  const thePConn = getPConnect();
  const componentConfig = thePConn.getComponentConfig();
  const resolvedConfigProps: any = thePConn.getConfigProps() as ListViewProps;

  /** By default, pyGUID is used for Data classes and pyID is for Work classes as row-id/key */
  const defRowID = referenceType === 'Case' ? 'pyID' : 'pyGUID';

  /** If compositeKeys is defined, use dynamic value, else fallback to pyID or pyGUID. */
  const rowID = compositeKeys && compositeKeys?.length === 1 ? compositeKeys[0] : defRowID;

  const [arRows, setRows] = useState<any[]>([]);
  const [rowsData, setRowsData] = useState<any[]>([]);
  const [arColumns, setColumns] = useState<any[]>([]);
  const [response, setResponse] = useState<any[]>([]);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof any>('');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [selectedValue, setSelectedValue] = useState(value);

  // This basically will hold the list of all current filters
  const filters = useRef({});

  // Will contain the list of columns specific for an instance
  const columnList: any = useRef([]);
  const filterPayload: any = useRef();
  // Will be sent in the dashboardFilterPayload
  let selectParam: any[] = [];

  // dataview parameters coming from the ListPage
  // This constant will also be used for parameters coming from from other components/utility functions in future
  const dataViewParameters = parameters;

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        width: '100%'
      },
      paper: {
        width: '100%',
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        display: 'grid'
      },
      search: {
        padding: '5px 5px'
      },
      table: {
        minWidth: 750
      },
      tableInForm: {
        minWidth: 750,
        maxHeight: 550,
        overflow: 'auto'
      },
      moreIcon: {
        verticalAlign: 'bottom'
      },
      filteredIcon: {
        verticalAlign: 'bottom'
      },
      cell: {
        whiteSpace: 'nowrap'
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
      title: {
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(1)
      }
    })
  );

  const classes = useStyles();

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property: keyof any) => (event: React.MouseEvent<unknown>) => {
    sortColumnId = property;
    handleRequestSort(event, property);
  };

  function descendingComparator<T>(a: T, b: T, orderedBy: keyof T) {
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
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
  }

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const AssignDashObjects = ['Assign-Worklist', 'Assign-WorkBasket'];
  function getHeaderCells(colFields, fields) {
    return colFields.map((field: any, index) => {
      let theField = field.config.value.substring(field.config.value.indexOf(' ') + 1);
      if (theField.indexOf('.') === 0) {
        theField = theField.substring(1);
      }
      const colIndex = fields.findIndex(ele => ele.name === theField);
      const displayAsLink = field.config.displayAsLink;
      const headerRow: any = {};
      headerRow.id = fields[index].id;
      headerRow.type = field.type;
      headerRow.displayAsLink = displayAsLink;
      headerRow.numeric = field.type === 'Decimal' || field.type === 'Integer' || field.type === 'Percentage' || field.type === 'Currency' || false;
      headerRow.disablePadding = false;
      headerRow.label = fields[index].label;
      if (colIndex > -1) {
        headerRow.classID = fields[colIndex].classID;
      }
      if (displayAsLink) {
        headerRow.isAssignmentLink = AssignDashObjects.includes(headerRow.classID);
        if (field.config.value?.startsWith('@CA')) {
          headerRow.isAssociation = true;
        }
      }
      return headerRow;
    });
  }

  function getUsingData(arTableData): any[] {
    if (selectionMode === SELECTION_MODE.SINGLE || selectionMode === SELECTION_MODE.MULTI) {
      const record = arTableData?.length > 0 ? arTableData[0] : '';
      if (typeof record === 'object' && !('pyGUID' in record) && !('pyID' in record)) {
        // eslint-disable-next-line no-console
        console.error('pyGUID or pyID values are mandatory to select the required row from the list');
      }
    }
    return arTableData?.map((data: any) => {
      return data;
    });
  }

  /** Will return field from a filter expression */
  function getFieldFromFilter(filter, dateRange = false) {
    let fieldValue;
    if (dateRange) {
      fieldValue = filter?.AND[0]?.condition.lhs.field;
    } else {
      fieldValue = filter?.condition.lhs.field;
    }
    return fieldValue;
  }

  // Will be triggered when EVENT_DASHBOARD_FILTER_CHANGE fires
  function processFilterChange(data) {
    const { filterId, filterExpression } = data;
    let dashboardFilterPayload: any = {
      query: {
        filter: {},
        select: []
      }
    };

    filters.current[filterId] = filterExpression;
    let isDateRange = data.filterExpression?.AND;
    // Will be AND by default but making it dynamic in case we support dynamic relational ops in future
    const relationalOp = 'AND';

    let field = getFieldFromFilter(filterExpression, isDateRange);
    selectParam = [];
    // Constructing the select parameters list (will be sent in dashboardFilterPayload)
    columnList.current.forEach(col => {
      selectParam.push({
        field: col
      });
    });

    // Checking if the triggered filter is applicable for this list
    if (data.filterExpression !== null && !(columnList.current?.length && columnList.current?.includes(field))) {
      return;
    }
    // This is a flag which will be used to reset dashboardFilterPayload in case we don't find any valid filters
    let validFilter = false;

    let index = 1;
    // Iterating over the current filters list to create filter data which will be POSTed
    for (const filterExp of Object.keys(filters.current)) {
      const filter = filters.current[filterExp];
      // If the filter is null then we can skip this iteration
      if (filter === null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // Checking if the filter is of type- Date Range
      isDateRange = filter?.AND;
      field = getFieldFromFilter(filter, isDateRange);

      if (!(columnList.current.length && columnList.current.includes(field))) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // If we reach here that implies we've at least one valid filter, hence setting the flag
      validFilter = true;
      /** Below are the 2 cases for- Text & Date-Range filter types where we'll construct filter data which will be sent in the dashboardFilterPayload
       * In Constellation DX Components, through Repeating Structures they might be using several APIs to do it. We're doing it here
       */
      if (isDateRange) {
        const dateRelationalOp = filter?.AND ? 'AND' : 'OR';
        dashboardFilterPayload.query.filter.filterConditions = {
          ...dashboardFilterPayload.query.filter.filterConditions,
          [`T${index++}`]: { ...filter[relationalOp][0].condition },
          [`T${index++}`]: { ...filter[relationalOp][1].condition }
        };
        if (dashboardFilterPayload.query.filter.logic) {
          dashboardFilterPayload.query.filter.logic = `${dashboardFilterPayload.query.filter.logic} ${relationalOp} (T${
            index - 2
          } ${dateRelationalOp} T${index - 1})`;
        } else {
          dashboardFilterPayload.query.filter.logic = `(T${index - 2} ${relationalOp} T${index - 1})`;
        }

        dashboardFilterPayload.query.select = selectParam;
      } else {
        dashboardFilterPayload.query.filter.filterConditions = {
          ...dashboardFilterPayload.query.filter.filterConditions,
          [`T${index++}`]: { ...filter.condition, ignoreCase: true }
        };

        if (dashboardFilterPayload.query.filter.logic) {
          dashboardFilterPayload.query.filter.logic = `${dashboardFilterPayload.query.filter.logic} ${relationalOp} T${index - 1}`;
        } else {
          dashboardFilterPayload.query.filter.logic = `T${index - 1}`;
        }

        dashboardFilterPayload.query.select = selectParam;
      }
    }

    // Reset the dashboardFilterPayload if we end up with no valid filters for the list
    if (!validFilter) {
      dashboardFilterPayload = undefined;
    }
    filterPayload.current = dashboardFilterPayload;
    fetchDataFromServer();
  }

  // Will be triggered when EVENT_DASHBOARD_FILTER_CLEAR_ALL fires
  function processFilterClear() {
    filterPayload.current = undefined;
    fetchDataFromServer();
  }

  function fetchAllData(fields): any {
    let query: any = null;
    if (payload) {
      query = payload.query;
    } else if (fields?.length && meta.isQueryable) {
      if (filterPayload.current) {
        query = {
          select: fields,
          filter: filterPayload.current?.query?.filter
        };
      } else {
        query = { select: fields };
      }
    } else if (filterPayload.current) {
      query = filterPayload.current?.query;
    }
    const context = getPConnect().getContextName();
    // getDataAsync isn't returning correct data for the Page(i.e. ListView within a page) case
    return !bInForm
      ? // @ts-ignore - 3rd parameter "context" should be optional in getData method
        PCore.getDataApiUtils().getData(referenceList, payload)
      : // @ts-ignore - Argument of type 'null' is not assignable to parameter of type 'object'
        PCore.getDataPageUtils().getDataAsync(referenceList, context, payload ? payload.dataViewParameters : dataViewParameters, null, query);
  }

  const buildSelect = (fieldDefs, colId, patchQueryFields = [], compositeKeys = []) => {
    const listFields: any = [];
    if (colId) {
      const field = getField(fieldDefs, colId);
      listFields.push({
        field: field.name
      });
    } else {
      // NOTE: If we ever decide to not set up all the `fieldDefs` on select, ensure that the fields
      //  corresponding to `state.groups` are set up. Needed in Client-mode grouping/pagination.
      fieldDefs.forEach(field => {
        if (!listFields.find(f => f.field === field.name)) {
          listFields.push({
            field: field.name
          });
        }
      });
      patchQueryFields.forEach(k => {
        if (!listFields.find(f => f.field === k)) {
          listFields.push({
            field: k
          });
        }
      });
    }

    compositeKeys.forEach(k => {
      if (!listFields.find(f => f.field === k)) {
        listFields.push({
          field: k
        });
      }
    });
    return listFields;
  };

  const addItemKeyInSelect = (fieldDefs, itemKey, select, compositeKeys) => {
    const elementFound = getField(fieldDefs, itemKey);

    if (
      itemKey &&
      !elementFound &&
      Array.isArray(select) &&
      !(compositeKeys !== null && compositeKeys?.length) &&
      !select.find(sel => sel.field === itemKey)
    ) {
      return [
        ...select,
        {
          field: itemKey
        }
      ];
    }

    return select;
  };

  const getField = (fieldDefs, columnId) => {
    const fieldsMap = getFieldsMap(fieldDefs);
    return fieldsMap.get(columnId);
  };

  const getFieldsMap = fieldDefs => {
    const fieldsMap = new Map();
    fieldDefs.forEach(element => {
      fieldsMap.set(element.id, element);
    });
    return fieldsMap;
  };

  async function fetchDataFromServer() {
    let bCallSetRowsColumns = true;
    const { fieldDefs, itemKey, patchQueryFields } = meta;
    let listFields = fieldDefs ? buildSelect(fieldDefs, undefined, patchQueryFields, compositeKeys) : [];
    listFields = addItemKeyInSelect(fieldDefs, itemKey, listFields, compositeKeys);
    const workListJSON = await fetchAllData(listFields);

    // this is an unresovled version of this.fields$, need unresolved, so can get the property reference
    const columnFields = componentConfig.presets[0].children[0].children;

    const tableDataResults = !bInForm ? workListJSON.data.data : workListJSON.data;

    const myColumns = getHeaderCells(columnFields, fieldDefs);

    const selectParams: any = [];

    myColumns.forEach(column => {
      selectParams.push({
        field: column.id
      });
    });

    const colList: any = [];

    selectParams.forEach(col => {
      colList.push(col.field);
    });

    columnList.current = colList;

    setResponse(tableDataResults);

    const usingDataResults = getUsingData(tableDataResults);

    // store globally, so can be searched, filtered, etc.
    myRows = usingDataResults;

    setRowsData(myRows);
    // At this point, if we have data ready to render and haven't been asked
    //  to NOT call setRows and setColumns, call them
    if (bCallSetRowsColumns) {
      setRows(myRows);
      setColumns(myColumns);
    }

    return () => {
      // Inspired by https://juliangaramendy.dev/blog/use-promise-subscription
      // The useEffect closure lets us have access to the bCallSetRowsColumns
      //  variable inside the useEffect and inside the "then" clause of the
      //  workListData promise
      //  So, if this cleanup code gets run before the promise .then is called,
      //  we can avoid calling the useState setters which would otherwise show a warning
      bCallSetRowsColumns = false;
    };
  }

  useEffect(() => {
    if (listContext.meta) {
      fetchDataFromServer();
      setTimeout(() => {
        PCore.getPubSubUtils().subscribe(
          PCore.getConstants().PUB_SUB_EVENTS.EVENT_DASHBOARD_FILTER_CHANGE,
          data => {
            processFilterChange(data);
          },
          `dashboard-component-${'id'}`,
          false,
          getPConnect().getContextName()
        );
        PCore.getPubSubUtils().subscribe(
          PCore.getConstants().PUB_SUB_EVENTS.EVENT_DASHBOARD_FILTER_CLEAR_ALL,
          () => {
            filters.current = {};
            processFilterClear();
          },
          `dashboard-component-${'id'}`,
          false,
          getPConnect().getContextName()
        );
      }, 0);

      return function cleanupSubscriptions() {
        PCore.getPubSubUtils().unsubscribe(
          PCore.getConstants().PUB_SUB_EVENTS.EVENT_DASHBOARD_FILTER_CHANGE,
          `dashboard-component-${'id'}`,
          getPConnect().getContextName()
        );
        PCore.getPubSubUtils().unsubscribe(
          PCore.getConstants().PUB_SUB_EVENTS.EVENT_DASHBOARD_FILTER_CLEAR_ALL,
          `dashboard-component-${'id'}`,
          getPConnect().getContextName()
        );
      };
    }
  }, [listContext]);

  function searchFilter(value: string, rows: any[]) {
    const cols = arColumns.map(ele => {
      return ele.id;
    });

    function filterArray(el: any): boolean {
      return Object.keys(el).some(key => {
        // only search columns that are displayed (pzInsKey and pxRefObjectClass are added and may or may not be displayed)
        if (cols.includes(key)) {
          const myVal = el[key];
          if (myVal !== null && typeof myVal !== 'undefined') {
            const strVal = String(myVal); // Ensure myVal is a string
            return strVal.toLowerCase().includes(value.toLowerCase());
          }
        }
        return false;
      });
    }

    rows = rows.filter(filterArray);

    return rows;
  }

  function _onSearch(event: any) {
    const searchValue = event.target.value;
    const filteredRows = searchFilter(searchValue, rowsData?.slice());

    setRows(filteredRows);
  }

  function showToast(message: string) {
    const theMessage = `Assignment: ${message}`;
    // eslint-disable-next-line no-console
    console.error(theMessage);
    setSnackbarMessage(message);
    setShowSnackbar(true);
  }

  function openAssignment(row) {
    const { pxRefObjectClass, pzInsKey } = row;
    const sTarget = thePConn.getContainerName();

    const options = { containerName: sTarget, channelName: '' };

    thePConn
      .getActionsApi()
      .openAssignment(pzInsKey, pxRefObjectClass, options)
      .then(() => {
        // console.log("openAssignment successful");
      })
      .catch(() => {
        showToast(`openAssignment failed!`);
      });
  }

  // function _rowClick(row: any) {
  //   // eslint-disable-next-line sonarjs/no-small-switch
  //   switch (rowClickAction) {
  //     case 'openAssignment':
  //       openAssignment(row);
  //       break;

  //     default:
  //       break;
  //   }
  // }

  function openWork(row) {
    const { pxRefObjectKey } = row;
    const pxRefObjectClass = row.pxRefObjectClass || row.pxObjClass;
    if (pxRefObjectClass !== '' && pxRefObjectKey !== '') {
      thePConn.getActionsApi().openWorkByHandle(pxRefObjectKey, pxRefObjectClass);
    }
  }

  function handleSnackbarClose(event: React.SyntheticEvent<any> | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  }

  function _menuClick(event, columnId: string, columnType: string, label: string) {
    menuColumnId = columnId;
    menuColumnType = columnType;
    menuColumnLabel = label;

    setAnchorEl(event.currentTarget);
  }

  function _menuClose() {
    setAnchorEl(null);
  }

  const [filterBy, setFilterBy] = useState<string>();
  const [containsDateOrTime, setContainsDateOrTime] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('string');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [displayDialogFilterName, setDisplayDialogFilterName] = useState<string>('');
  const [displayDialogContainsFilter, setDisplayDialogContainsFilter] = useState<string>('contains');
  const [displayDialogContainsValue, setDisplayDialogContainsValue] = useState<string>('');
  const [displayDialogDateFilter, setDisplayDialogDateFilter] = useState<string>('notequal');
  const [displayDialogDateValue, setDisplayDialogDateValue] = useState<string>('');

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

  function _groupMenu() {
    setAnchorEl(null);
  }

  function _closeDialog() {
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

  function filterSortGroupBy() {
    // get original data set
    let theData = myRows.slice();

    // last filter config data is global
    theData = theData.filter(filterData(filterByColumns));

    // move data to array and then sort
    setRows(theData);
    createSortHandler(sortColumnId);
  }

  function _dialogContainsFilter(event) {
    // dialogContainsFilter = event.target.value;
    setDisplayDialogContainsFilter(event.target.value);
  }

  function _dialogContainsValue(event) {
    // dialogContainsValue = event.target.value;
    setDisplayDialogContainsValue(event.target.value);
  }

  function _dialogDateFilter(event) {
    // dialogDateFilter = event.target.value;
    setDisplayDialogDateFilter(event.target.value);
  }

  function _dialogDateValue(event) {
    setDisplayDialogDateValue(event.target.value);
  }

  function _submitFilter() {
    updateFilterWithInfo();
    filterSortGroupBy();

    setOpen(false);
  }

  function _showButton(name, row) {
    let bReturn = false;
    const { pxRefObjectClass, pzInsKey, pxRefObjectKey } = row;
    switch (name) {
      case 'pxTaskLabel':
        if (pxRefObjectClass !== '' && pzInsKey !== '') {
          bReturn = true;
        }
        break;

      case 'pxRefObjectInsName':
        if (pxRefObjectClass !== '' && pxRefObjectKey !== '') {
          bReturn = true;
        }
        break;

      default:
        break;
    }

    return bReturn;
  }

  function _listViewClick(row, column) {
    const name = column.id;
    if (column.displayAsLink) {
      const { pxObjClass } = row;
      let { pzInsKey } = row;
      if (column.isAssociation) {
        const associationCategory = name.split(':')[0];
        pzInsKey = row[`${associationCategory}:pzInsKey`];
      }
      if (column.isAssignmentLink) {
        thePConn.getActionsApi().openAssignment(pzInsKey, pxObjClass, {
          containerName: 'primary',
          channelName: ''
        });
      } else {
        thePConn.getActionsApi().openWorkByHandle(pzInsKey, pxObjClass);
      }
    } else {
      switch (name) {
        case 'pxTaskLabel':
          openAssignment(row);
          break;

        case 'pxRefObjectInsName':
          openWork(row);
          break;

        default:
          break;
      }
    }
  }

  function _listTitle() {
    const defaultTitle = 'List';
    let title = resolvedConfigProps.title || resolvedConfigProps?.label || defaultTitle;
    const inheritedProps = resolvedConfigProps?.inheritedProps;

    // Let any title in resolvedConfigProps that isn't the default take precedence
    //  but only look in inheritedProps if they exist
    if (title === defaultTitle && inheritedProps) {
      for (const inheritedProp of inheritedProps) {
        if (inheritedProp?.prop === 'label') {
          title = inheritedProp?.value;
          break;
        }
      }
    }

    return title;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const reqObj = {};
    if (compositeKeys?.length > 1) {
      const index = response.findIndex(element => element[rowID] === value);
      const selectedRow = response[index];
      compositeKeys.forEach(element => {
        reqObj[element] = selectedRow[element];
      });
    } else {
      reqObj[rowID] = value;
    }
    getPConnect()?.getListActions?.()?.setSelectedRows([reqObj]);
    setSelectedValue(value);
  };

  const onCheckboxClick = event => {
    const value = event?.target?.value;
    const checked = event?.target?.checked;
    const reqObj: any = {};
    if (compositeKeys?.length > 1) {
      const index = response.findIndex(element => element[rowID] === value);
      const selectedRow = response[index];
      compositeKeys.forEach(element => {
        reqObj[element] = selectedRow[element];
      });
      reqObj.$selected = checked;
    } else {
      reqObj[rowID] = value;
      reqObj.$selected = checked;
    }
    getPConnect()?.getListActions()?.setSelectedRows([reqObj]);
  };

  const processColumnValue = (column, value) => {
    let val;
    const type = column.type;
    let theDateFormatInfo;
    let theFormat;
    let theCurrencyOptions;
    switch (type) {
      case 'Date':
      case 'DateTime':
        theDateFormatInfo = getDateFormatInfo();
        theFormat = type === 'DateTime' ? `${theDateFormatInfo.dateFormatStringLong} hh:mm a` : theDateFormatInfo.dateFormatStringLong;
        val = format(value, column.type, { format: theFormat });
        break;

      case 'Currency':
        theCurrencyOptions = getCurrencyOptions(PCore?.getEnvironmentInfo()?.getLocale() as string);
        val = format(value, column.type, theCurrencyOptions);
        break;

      default:
        val = column.format && typeof value === 'number' ? column.format(value) : value || '---';
    }
    return val;
  };

  return (
    <>
      {arColumns && arColumns.length > 0 && (
        <Paper className={classes.paper}>
          <Typography className={classes.title} variant='h6' color='textPrimary' gutterBottom>
            {_listTitle()}
          </Typography>
          {globalSearch && (
            <Grid container spacing={1} alignItems='flex-end' className={classes.search}>
              <Grid item>
                <SearchIcon />
              </Grid>
              <Grid item>
                <TextField
                  label={PCore.getLocaleUtils().getLocaleValue('Search', 'Search')}
                  fullWidth
                  variant='outlined'
                  placeholder=''
                  size='small'
                  id='search'
                  onChange={_onSearch}
                />
              </Grid>
            </Grid>
          )}
          <>
            {!bInForm ? (
              <TableContainer id='list-view' className={classes.tableInForm}>
                <Table stickyHeader aria-label='sticky table'>
                  <TableHead>
                    <TableRow>
                      {arColumns.map(column => {
                        return (
                          <TableCell className={classes.cell} key={column.id} sortDirection={orderBy === column.id ? order : false}>
                            <TableSortLabel
                              active={orderBy === column.id}
                              direction={orderBy === column.id ? order : 'asc'}
                              onClick={createSortHandler(column.id)}
                            >
                              {column.label}
                              {_showFilteredIcon(column.id) && <FilterListIcon className={classes.filteredIcon} />}
                              {orderBy === column.id ? (
                                <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span>
                              ) : null}
                            </TableSortLabel>
                            <MoreIcon
                              className={classes.moreIcon}
                              onClick={event => {
                                _menuClick(event, column.id, column.type, column.label);
                              }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {arRows &&
                      stableSort(arRows, getComparator(order, orderBy))
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(row => {
                          return (
                            <TableRow key={row.pxRefObjectInsName || row.pyID}>
                              {arColumns.map(column => {
                                const value = row[column.id];
                                return (
                                  <TableCell key={column.id} align={column.align} className={classes.cell}>
                                    {_showButton(column.id, row) || column.displayAsLink ? (
                                      <Link
                                        component='button'
                                        onClick={() => {
                                          _listViewClick(row, column);
                                        }}
                                        underline='hover'
                                      >
                                        {column.format && typeof value === 'number' ? column.format(value) : value}
                                      </Link>
                                    ) : (
                                      <>{column.format && typeof value === 'number' ? column.format(value) : value || '---'}</>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer id='list-view'>
                <Table>
                  <TableHead>
                    <TableRow>
                      {(selectionMode === SELECTION_MODE.SINGLE || selectionMode === SELECTION_MODE.MULTI) && <TableCell />}
                      {arColumns.map(column => {
                        return (
                          <TableCell className={classes.cell} key={column.id} sortDirection={orderBy === column.id ? order : false}>
                            <TableSortLabel
                              active={orderBy === column.id}
                              direction={orderBy === column.id ? order : 'asc'}
                              onClick={createSortHandler(column.id)}
                            >
                              {column.label}
                              {orderBy === column.id ? (
                                <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span>
                              ) : null}
                            </TableSortLabel>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {arRows &&
                      arRows.length > 0 &&
                      stableSort(arRows, getComparator(order, orderBy))
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(row => {
                          return (
                            <TableRow key={row[rowID]}>
                              {selectionMode === SELECTION_MODE.SINGLE && (
                                <TableCell>
                                  <Radio
                                    onChange={handleChange}
                                    value={row[rowID]}
                                    name='radio-buttons'
                                    inputProps={{ 'aria-label': 'A' }}
                                    checked={selectedValue === row[rowID]}
                                  />
                                </TableCell>
                              )}
                              {selectionMode === SELECTION_MODE.MULTI && (
                                <TableCell>
                                  <Checkbox
                                    onChange={onCheckboxClick}
                                    checked={selectedValues.some(selectedValue => selectedValue[rowID] === row[rowID])}
                                    value={row[rowID]}
                                  />
                                </TableCell>
                              )}
                              {arColumns.map(column => {
                                const value = row[column.id];
                                return (
                                  <TableCell className={classes.cell} key={column.id} align={column.align}>
                                    {processColumnValue(column, value)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
                {arRows && arRows.length === 0 && <div className='no-records'>No records found.</div>}
              </TableContainer>
            )}
          </>
          {arRows && arRows.length > 0 && (
            <TablePagination
              id='pagination'
              rowsPerPageOptions={[10, 25, 100]}
              component='div'
              count={arRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Paper>
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
              <Select variant='standard' fullWidth onChange={_dialogContainsFilter} value={displayDialogContainsFilter}>
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

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton size='small' aria-label='close' color='inherit' onClick={handleSnackbarClose}>
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />
    </>
  );
}
