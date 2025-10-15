import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DateTime from '../../../../../src/components/field/DateTime';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import { format } from '../../../../../src/components/helpers/formatters';
import TextInput from '../../../../../src/components/field/TextInput';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));

declare global {
  interface Window {
    PCore: any;
  }
}

window.PCore = {
  ...window.PCore,
  getEnvironmentInfo: (): any => {
    return {
      getUseLocale: () => {
        return 'en-US';
      },
      getLocale: () => {
        return 'en-US';
      },
      getTimeZone: () => 'America/New_York'
    };
  },
  getLocaleUtils(): any {
    return {
      getLocaleValue: value => {
        return value;
      }
    };
  }
};

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const validate = jest.fn();
const clearErrorMessages = jest.fn();

const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.dateTime'
        }),
        getValidationApi: () => ({
          validate
        }),
        clearErrorMessages
      }) as any
  ),
  label: 'DateTime Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'dateTimeTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
};

describe('DateTime Component', () => {
  const renderWithLocalization = ui => {
    return render(<LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>);
  };

  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy hh:mm a')[0]).toHaveAttribute('required');

    props.required = false;
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy hh:mm a')[1]).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy hh:mm a')[0]).toHaveAttribute('disabled');

    props.disabled = false;
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy hh:mm a')[1]).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    expect(getByTestId('dateTimeTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getByPlaceholderText('mm/dd/yyyy hh:mm a')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    const { getByLabelText } = renderWithLocalization(<DateTime {...props} />);
    expect(getByLabelText('DateTime Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '2023-10-10T10:10:00';
    const dateValue = format(props.value, 'datetime', {
      format: 'MM/DD/YYYY hh:mm a'
    });
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getByText(dateValue)).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '2023-10-10T10:10:00';
    const dateValue = format(props.value, 'datetime', {
      format: 'MM/DD/YYYY hh:mm a'
    });
    renderWithLocalization(<DateTime {...props} />);
    expect(screen.getByText(dateValue)).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<TextInput {...props} />);
    fireEvent.change(screen.getByTestId('dateTimeTestId'), { target: { value: '2023-10-10T10:10:00' } });
    fireEvent.blur(screen.getByTestId('dateTimeTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    renderWithLocalization(<DateTime {...props} />);
    fireEvent.change(screen.getByPlaceholderText('mm/dd/yyyy hh:mm a'), { target: { value: '2023-10-10T10:10:00' } });
    fireEvent.blur(screen.getByPlaceholderText('mm/dd/yyyy hh:mm a'));
  });
});
