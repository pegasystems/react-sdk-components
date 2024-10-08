import { useEffect, useRef, useState } from 'react';
import { Theme } from '@mui/material/styles';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import isDeepEqual from 'fast-deep-equal/react';

import { Utils } from '../../helpers/utils';
import { PConnProps } from '../../../types/PConnProps';

interface CaseHistoryProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'silver',
      backgroundColor: theme.palette.text.disabled,
      color: theme.palette.getContrastText(theme.palette.text.disabled)
    },
    body: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'silver'
      // fontSize: 14,
    }
  })
)(TableCell);

export default function CaseHistory(props: CaseHistoryProps) {
  const { getPConnect } = props;
  const thePConn = getPConnect();
  // let waitingForData = true;

  const displayedColumns = [
    {
      label: thePConn.getLocalizedValue('Date', '', ''),
      type: 'DateTime',
      fieldName: 'pxTimeCreated'
    }, // 2nd and 3rd args empty string until typedef marked correctly
    {
      label: thePConn.getLocalizedValue('Description', '', ''),
      type: 'TextInput',
      fieldName: 'pyMessageKey'
    }, // 2nd and 3rd args empty string until typedef marked correctly
    {
      label: thePConn.getLocalizedValue('Performed by', '', ''),
      type: 'TextInput',
      fieldName: 'pyPerformer'
    } // 2nd and 3rd args empty string until typedef marked correctly
  ];

  const rowData: any = useRef([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [waitingForData, setWaitingForData] = useState<boolean>(true);

  const caseID = thePConn.getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID, ''); // 2nd arg empty string until typedef marked correctly
  const dataViewName = 'D_pyWorkHistory';
  const context = thePConn.getContextName();

  function computeRowData(rows: Object[]): void {
    const theRowData: Object[] = [];

    rows.forEach((row: any, rowIndex: number) => {
      // Now, for each property in the index of row properties (displayedColumns), add an object
      //  to a new array of values
      const rowDisplayValues: any = [];

      displayedColumns.forEach((column: any, rowValIndex) => {
        const theType = column.type;
        const theFieldName = column.fieldName;
        const theValue =
          theType === 'Date' || theType === 'DateTime' ? Utils.generateDateTime(row[theFieldName], 'DateTime-Short') : row[theFieldName];
        rowDisplayValues[rowValIndex] = theValue;
      });

      theRowData[rowIndex] = rowDisplayValues;
    });

    if (!isDeepEqual(theRowData, rowData.current)) {
      // Only update rowData.current when it actually changes (to prevent infinite loop)
      rowData.current = theRowData;
    }
  }

  // Get the case history data when component mounted/initialized
  useEffect(() => {
    let bCallSetWaitingForData = true;

    const historyData = PCore.getDataApiUtils().getData(
      dataViewName,
      { dataViewParameters: [{ CaseInstanceKey: caseID }] } as any,
      context
    ) as Promise<any>;

    historyData.then((historyJSON: any) => {
      const tableDataResults = historyJSON.data.data;

      // compute the rowData using the tableDataResults
      computeRowData(tableDataResults);

      // At this point, if we have data ready to render and haven't been asked
      //  to NOT call setWaitingForData, we can stop progress indicator
      if (bCallSetWaitingForData) {
        setWaitingForData(false);
      }
    });

    return () => {
      // Inspired by https://juliangaramendy.dev/blog/use-promise-subscription
      // The useEffect closure lets us have access to the bCallSetWaitingForData
      //  variable inside the useEffect and inside the "then" clause of the
      //  historyData promise
      //  So, if this cleanup code gets run before the promise .then is called,
      //  we can avoid calling the useState setter which would otherwise show a warning
      bCallSetWaitingForData = false;
    };
  }, []);

  function getTableHeader() {
    const theRowKey = 'CaseHistory.TableHeader';

    const theHeaderCells: any[] = displayedColumns.map((headerCol, index) => {
      const theCellKey = `${theRowKey}.${index}`;
      return <StyledTableCell key={theCellKey}>{headerCol.label}</StyledTableCell>;
    });

    return <TableRow key={theRowKey}>{theHeaderCells}</TableRow>;
  }

  function getTableData() {
    const theDataRows: any[] = [];

    // Note: using rowData.current since we're using useRef as a mutatable
    //  value that's only updated when it changes.
    if (rowData.current.length > 0) {
      rowData.current.forEach((dataRow: Object[], index) => {
        // using dataRow[0]-dataRow[1] as the array key since it's a unique value
        const theKey = `CaseHistory-${index}`;
        theDataRows.push(
          <TableRow key={theKey}>
            <StyledTableCell>{dataRow[0] ? dataRow[0] : ('---' as any)}</StyledTableCell>
            <StyledTableCell>{dataRow[1] ? dataRow[1] : ('---' as any)}</StyledTableCell>
            <StyledTableCell>{dataRow[2] ? dataRow[2] : ('---' as any)}</StyledTableCell>
          </TableRow>
        );
      });
    }

    return theDataRows;
  }

  return (
    <div id='CaseHistory'>
      <TableContainer>
        <Table>
          <TableHead>{getTableHeader()}</TableHead>
          <TableBody>{getTableData()}</TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
