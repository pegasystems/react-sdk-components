import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import type { PConnProps } from '../../../types/PConnProps';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface CaseViewActionsMenuProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  availableActions: any[];
  availableProcesses: any[];
  // Data object review actions (sourced from dataInfo.actions by the parent CaseView)
  dataObjectAvailableActions?: any[];
  dataObjectCreateCaseActions?: any[];
  caseTypeID: string;
  caseTypeName: string;
}

export default function CaseViewActionsMenu(props: CaseViewActionsMenuProps) {
  const {
    getPConnect,
    availableActions,
    availableProcesses,
    dataObjectAvailableActions = [],
    dataObjectCreateCaseActions = [],
    caseTypeID,
    caseTypeName
  } = props;
  const thePConn = getPConnect();

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'CaseView';
  const localeKey = `${caseTypeID}!CASE!${caseTypeName}`.toUpperCase();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage]: any = useState('');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const arMenuItems: any[] = [];

  function showToast(message: string) {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  }

  function handleSnackbarClose(event: React.SyntheticEvent<any> | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }
    setShowSnackbar(false);
  }

  function _actionMenuActionsClick(data) {
    const actionsAPI = thePConn.getActionsApi();
    const openLocalAction = actionsAPI.openLocalAction.bind(actionsAPI);

    openLocalAction(data.ID, {
      ...data,
      containerName: 'modal',
      type: 'express'
    });
    // after doing the action, close the menu...
    handleClose();
  }

  function _actionMenuProcessClick(process) {
    const actionsAPI = thePConn.getActionsApi();
    const openProcessAction = actionsAPI.openProcessAction.bind(actionsAPI);
    openProcessAction(process.ID, {
      ...process
    })
      .then(() => {})
      .catch(() => {
        showToast(`${process.name} Submit failed!`);
      });
    handleClose();
  }

  function _dataObjectActionClick(action) {
    const actionsAPI = thePConn.getActionsApi();
    const openDataObjectAction = actionsAPI.openDataObjectAction.bind(actionsAPI);
    const className = thePConn.getValue('.classID', 'dataInfo.content');
    const dataRecord = thePConn.getValue('.content', 'dataInfo');
    openDataObjectAction(className, dataRecord, action.ID, localizedVal(action.name, '', localeKey));
    handleClose();
  }

  function _dataObjectCreateCaseClick(action) {
    const actionsAPI = thePConn.getActionsApi();
    const createWork = actionsAPI.createWork.bind(actionsAPI);
    const targetDataReferenceField = action.targetDataReferenceField;
    const field = targetDataReferenceField?.field;
    const startingFields: any = {};
    (targetDataReferenceField?.inputs || []).forEach(input => {
      if (!startingFields[field]) {
        startingFields[field] = {};
      }
      startingFields[field][input.linkedField] = thePConn.getValue(`.${input.linkedField}`, '');
    });
    createWork(action.ID, { startingFields });
    handleClose();
  }

  availableActions.forEach(action => {
    arMenuItems.push(
      <MenuItem key={action.ID} onClick={() => _actionMenuActionsClick(action)}>
        {localizedVal(action.name, '', localeKey)}
      </MenuItem>
    );
  });

  availableProcesses.forEach(process => {
    arMenuItems.push(
      <MenuItem key={process.ID} onClick={() => _actionMenuProcessClick(process)}>
        {localizedVal(process.name, '', localeKey)}
      </MenuItem>
    );
  });

  dataObjectAvailableActions.forEach(action => {
    arMenuItems.push(
      <MenuItem key={action.ID} onClick={() => _dataObjectActionClick(action)}>
        {localizedVal(action.name, '', localeKey)}
      </MenuItem>
    );
  });

  dataObjectCreateCaseActions.forEach(action => {
    arMenuItems.push(
      <MenuItem key={action.ID} onClick={() => _dataObjectCreateCaseClick(action)}>
        {localizedVal(action.name, '', localeKey)}
      </MenuItem>
    );
  });

  // Guard against opening an empty menu
  const isMenuOpen = Boolean(anchorEl) && arMenuItems.length > 0;

  return (
    <>
      <Button id='actions-menu' aria-controls='simple-menu' aria-haspopup='true' disabled={arMenuItems.length === 0} onClick={handleClick}>
        {localizedVal('Actions...', localeCategory)}
      </Button>
      <Menu id='simple-menu' anchorEl={anchorEl} keepMounted open={isMenuOpen} onClose={handleClose}>
        {arMenuItems}
      </Menu>
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
