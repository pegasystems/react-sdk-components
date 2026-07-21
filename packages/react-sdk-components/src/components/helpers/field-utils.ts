import type { SxProps } from '@mui/material';
import type { Status } from '../../hooks/useStatus';

const WARNING_FIELD_SX: SxProps = {
  '& .MuiFormHelperText-root': {
    color: 'error.main',
    marginLeft: '0px'
  }
};

const WARNING_FORM_CONTROL_SX: SxProps = {
  '& .MuiFormHelperText-root': {
    color: 'error.main'
  }
};

/**
 * Returns sx prop for TextField/MuiTelInput/Picker components based on status.
 * Shows red helper text when status is 'warning'.
 */
export const getFieldSx = (status: Status): SxProps | undefined => {
  return status === 'warning' ? WARNING_FIELD_SX : undefined;
};

/**
 * Returns sx prop for FormControl-based components (RadioButtons, Checkbox).
 * Shows red helper text when status is 'warning'.
 */
export const getFormControlSx = (status: Status): SxProps | undefined => {
  return status === 'warning' ? WARNING_FORM_CONTROL_SX : undefined;
};
