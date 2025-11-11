import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Avatar, Typography, Badge, List, ListItem, ListItemText } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Utils } from '../../helpers/utils';
import type { PConnProps } from '../../../types/PConnProps';

import './ToDo.css';

const fetchMyWorkList = (datapage, fields, numberOfRecords, includeTotalCount, context) => {
  return PCore.getDataPageUtils()
    .getDataAsync(
      datapage,
      context,
      {},
      {
        pageNumber: 1,
        pageSize: numberOfRecords
      },
      {
        select: Object.keys(fields).map(key => ({ field: PCore.getAnnotationUtils().getPropertyName(fields[key]) }))
      },
      {
        invalidateCache: true,
        additionalApiParams: {
          includeTotalCount
        }
      }
    )
    .then(response => {
      return {
        ...response,
        data: (Array.isArray(response?.data) ? response.data : []).map(row =>
          Object.keys(fields).reduce((obj, key) => {
            obj[key] = row[PCore.getAnnotationUtils().getPropertyName(fields[key])];
            return obj;
          }, {})
        )
      };
    });
};

interface ToDoProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  datasource?: any;
  myWorkList?: any;

  caseInfoID?: string;
  headerText?: string;

  itemKey?: string;
  showTodoList?: boolean;
  type?: string;

  context?: string;
  isConfirm?: boolean;
}

const isChildCase = assignment => {
  return assignment.isChild;
};

function topThreeAssignments(assignmentsSource: any[]): any[] {
  return Array.isArray(assignmentsSource) ? assignmentsSource.slice(0, 3) : [];
}

function getID(assignment: any) {
  if (assignment.value) {
    const refKey = assignment.value;
    return refKey.substring(refKey.lastIndexOf(' ') + 1);
  }
  const refKey = assignment.ID;
  const arKeys = refKey.split('!')[0].split(' ');
  return arKeys[2];
}

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderRadius: 16
  },
  avatar: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.getContrastText(theme.palette.primary.light)
  },
  todoWrapper: {
    padding: theme.spacing(1),
    margin: theme.spacing(1)
  },
  psdkTodoAssignmentStatus: {
    backgroundColor: 'var(--app-neutral-light-color)',
    borderRadius: '0.125rem',
    color: theme.embedded.resolutionTextColor,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    lineHeight: 'calc(0.5rem * 2.5)',
    height: 'calc(0.5rem * 2.5)',
    padding: '0 0.5rem',
    textTransform: 'uppercase'
  }
}));

export default function ToDo(props: ToDoProps) {
  const {
    getPConnect,
    context,
    datasource = [],
    headerText = 'To do',
    showTodoList = true,
    myWorkList = {},
    type = 'worklist',
    isConfirm = false
  } = props;

  const CONSTS = PCore.getConstants();

  const bLogging = true;
  const currentUser = PCore.getEnvironmentInfo().getOperatorName() ?? '';
  const currentUserInitials = Utils.getInitials(currentUser);
  const assignmentsSource = datasource?.source || myWorkList?.source;

  const [bShowMore, setBShowMore] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage]: any = useState('');

  const [assignments, setAssignments] = useState<any[]>(initAssignments());

  const thePConn = getPConnect();
  const classes = useStyles();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Todo';
  const showlessLocalizedValue = localizedVal('show_less', 'CosmosFields');
  const showMoreLocalizedValue = localizedVal('show_more', 'CosmosFields');
  const canPerform = assignments?.[0]?.canPerform === 'true' || assignments?.[0]?.canPerform === true;
  const [count, setCount] = useState(0);

  const {
    WORK_BASKET: { MY_WORK_LIST }
  } = PCore.getConstants();

  function initAssignments(): any[] {
    if (assignmentsSource) {
      return topThreeAssignments(assignmentsSource);
    }
    // turn off todolist
    return [];
  }

  const deferLoadWorklistItems = useCallback(
    responseData => {
      setCount(responseData.totalCount);
      setAssignments(responseData.data);
    },
    [MY_WORK_LIST]
  );

  useEffect(() => {
    if (Object.keys(myWorkList).length && myWorkList.datapage) {
      fetchMyWorkList(myWorkList.datapage, getPConnect().getComponentConfig()?.myWorkList.fields, 3, true, context).then(responseData => {
        deferLoadWorklistItems(responseData);
      });
    }
  }, []);

  const getAssignmentId = assignment => {
    return type === CONSTS.TODO ? assignment.ID : assignment.id;
  };

  const getPriority = assignment => {
    return type === CONSTS.TODO ? assignment.urgency : assignment.priority;
  };

  const getAssignmentName = assignment => {
    return type === CONSTS.TODO
      ? localizedVal(assignment.name, '', PCore.getLocaleUtils().getCaseLocaleReference(assignment.classname))
      : localizedVal(assignment.stepName, '', PCore.getLocaleUtils().getCaseLocaleReference(assignment.classname));
  };

  function showToast(message: string) {
    const theMessage = `Assignment: ${message}`;

    console.error(theMessage);
    setSnackbarMessage(message);
    setShowSnackbar(true);
  }

  function handleSnackbarClose(event: React.SyntheticEvent<any> | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  }

  function _showMore() {
    setBShowMore(false);
    if (type === CONSTS.WORKLIST && count && count > assignments.length && !assignmentsSource) {
      fetchMyWorkList(myWorkList.datapage, getPConnect().getComponentConfig()?.myWorkList.fields, count, false, context).then(response => {
        setAssignments(response.data);
      });
    } else {
      setAssignments(assignmentsSource);
    }
  }

  function _showLess() {
    setBShowMore(true);
    setAssignments(assignments => assignments.slice(0, 3));
  }

  function clickGo(assignment) {
    const id = getAssignmentId(assignment);
    let { classname = '' } = assignment;
    const sTarget = thePConn.getContainerName();
    const sTargetContainerName = sTarget;

    const options: any = {
      containerName: sTargetContainerName,
      channelName: ''
    };

    if (classname === null || classname === '') {
      classname = thePConn.getCaseInfo().getClassName();
    }

    if (sTarget === 'workarea') {
      options.isActionFromToDoList = true;
      options.target = '';
      options.context = null;
      options.isChild = isChildCase(assignment);
    } else {
      options.isActionFromToDoList = false;
      options.target = sTarget;
    }

    thePConn
      .getActionsApi()
      .openAssignment(id, classname, options)
      .then(() => {
        if (bLogging) {
          console.log(`openAssignment completed`);
        }
      })
      .catch(() => {
        showToast(`Submit failed!`);
      });
  }

  const renderTaskId = (type, getPConnect, showTodoList, assignment) => {
    const displayID = getID(assignment);

    if ((showTodoList && type !== CONSTS.TODO) || assignment.isChild === true) {
      /* Supress link for todo inside flow step */
      return <Button size='small' color='primary'>{`${assignment.name} ${getID(assignment)}`}</Button>;
    }
    return displayID;
  };

  const getListItemComponent = assignment => {
    const caseLocaleRef = PCore.getLocaleUtils().getCaseLocaleReference(assignment.classname);
    if (isDesktop) {
      return (
        <>
          {localizedVal('In', localeCategory)}
          {renderTaskId(type, getPConnect, showTodoList, assignment)}
          {type === CONSTS.WORKLIST && assignment.status ? `\u2022 ` : undefined}
          {type === CONSTS.WORKLIST && assignment.status ? (
            <span className='psdk-todo-assignment-status'>{localizedVal(assignment.status, '', caseLocaleRef)}</span>
          ) : undefined}
          {` \u2022  ${localizedVal('Urgency', localeCategory)}  ${getPriority(assignment)}`}
        </>
      );
    }
    return (
      <>
        <Button size='small' color='primary'>{`${assignment.name} ${getID(assignment)}`}</Button>
        {` \u2022 ${localizedVal('Urgency', localeCategory)}  ${getPriority(assignment)}`}
      </>
    );
  };

  const getCount = () => (assignmentsSource ? assignmentsSource.length : type === CONSTS.WORKLIST ? count : 0);

  const toDoContent = (
    <>
      {showTodoList && (
        <CardHeader
          title={
            <Badge badgeContent={getCount()} overlap='rectangular' color='primary'>
              <Typography variant='h6'>{headerText}&nbsp;&nbsp;&nbsp;</Typography>
            </Badge>
          }
        />
      )}
      <List>
        {assignments.map(assignment => (
          <div className='psdk-todo-avatar-header' key={getAssignmentId(assignment)}>
            <Avatar className={classes.avatar} style={{ marginRight: '16px' }}>
              {currentUserInitials}
            </Avatar>
            <div style={{ display: 'block' }}>
              <Typography variant='h6'>{localizedVal(assignment?.name, localeCategory)}</Typography>
              {`${localizedVal('In', localeCategory)} ${getID(assignment)} \u2022  ${localizedVal(
                'Urgency',
                localeCategory
              )}  ${getPriority(assignment)}`}
            </div>
            {(!isConfirm || canPerform) && (
              <div style={{ marginLeft: 'auto' }}>
                <IconButton id='go-btn' onClick={() => clickGo(assignment)} size='large'>
                  <ArrowForwardIosOutlinedIcon />
                </IconButton>
              </div>
            )}
          </div>
        ))}
      </List>
    </>
  );

  return (
    <>
      {type === CONSTS.WORKLIST && (
        <Card className={classes.root}>
          {showTodoList && (
            <CardHeader
              title={
                <Badge badgeContent={getCount()} overlap='rectangular' color='primary'>
                  <Typography variant='h6'>{headerText}&nbsp;&nbsp;&nbsp;</Typography>
                </Badge>
              }
              avatar={<Avatar className={classes.avatar}>{currentUserInitials}</Avatar>}
            />
          )}
          <CardContent>
            <List>
              {assignments.map(assignment => (
                <ListItem
                  key={getAssignmentId(assignment)}
                  dense
                  divider
                  onClick={() => clickGo(assignment)}
                  secondaryAction={
                    <IconButton onClick={() => clickGo(assignment)} size='large'>
                      <ArrowForwardIosOutlinedIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={getAssignmentName(assignment)} secondary={getListItemComponent(assignment)} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {type === CONSTS.TODO && !isConfirm && <Card className={classes.todoWrapper}>{toDoContent}</Card>}
      {type === CONSTS.TODO && isConfirm && <>{toDoContent}</>}

      {getCount() > 3 && (
        <Box display='flex' justifyContent='center'>
          {bShowMore ? (
            <Button color='primary' onClick={_showMore}>
              {showMoreLocalizedValue === 'show_more' ? 'Show more' : showMoreLocalizedValue}
            </Button>
          ) : (
            <Button onClick={_showLess}>{showlessLocalizedValue === 'show_less' ? 'Show less' : showlessLocalizedValue}</Button>
          )}
        </Box>
      )}

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
