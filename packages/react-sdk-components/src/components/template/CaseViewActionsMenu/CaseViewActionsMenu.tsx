import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { PConnProps } from '../../../types/PConnProps';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

interface CaseViewActionsMenuProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  availableActions: any[];
  availableProcesses: any[];
  caseTypeID: string;
  caseTypeName: string;
}

export default function CaseViewActionsMenu(props: CaseViewActionsMenuProps) {
  const { getPConnect, availableActions, availableProcesses, caseTypeID, caseTypeName } = props;
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

  function handleSnackbarClose(event: React.SyntheticEvent | React.MouseEvent, reason?: string) {
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

  return (
    <>
      <Button id='actions-menu' aria-controls='simple-menu' aria-haspopup='true' onClick={handleClick}>
        {localizedVal('Actions...', localeCategory)}
      </Button>
      <Menu id='simple-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
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
