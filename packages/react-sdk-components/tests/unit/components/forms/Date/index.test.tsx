import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Date from '../../../../../src/components/field/Date';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import TextInput from '../../../../../src/components/field/TextInput';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
      }
    };
  },
  getLocaleUtils(): any {
    return {
      getLocaleValue: (value) => {
        return value;
      }
    };
  }
};

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const updateDirtyCheckChangeList = jest.fn();
const validate = jest.fn();
const clearErrorMessages = jest.fn();
const [ignoreSuggestion, acceptSuggestion] = [jest.fn(), jest.fn()];
const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.date'
        }),
        getValidationApi: () => ({
          validate
        }),
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Date',
  required: true,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'dateTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
};

describe('Date Component', () => {
  const renderWithLocalization = (ui) => {
    return render(<LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>);
  };

  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    renderWithLocalization(<Date {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy')[0]).toHaveAttribute('required');

    props.required = false;
    renderWithLocalization(<Date {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy')[1]).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    renderWithLocalization(<Date {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy')[0]).toHaveAttribute('disabled');

    props.disabled = false;
    renderWithLocalization(<Date {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy')[1]).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    expect(getByTestId('dateTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    renderWithLocalization(<Date {...props} />);
    expect(screen.getAllByPlaceholderText('mm/dd/yyyy')[0]).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    const { getByText } = renderWithLocalization(<Date {...props} />);
    expect(getByText('Date')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '2023-01-01';
    const { getByText } = renderWithLocalization(<Date {...props} />);
    expect(getByText('01/01/2023')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '2023-01-01';
    const { getByText } = renderWithLocalization(<Date {...props} />);
    expect(getByText('01/01/2023')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<TextInput {...props} />);
    fireEvent.change(screen.getByTestId('dateTestId'), { target: { value: '2023-01-01' } });
    fireEvent.blur(screen.getByTestId('dateTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    props.readOnly = false;
    renderWithLocalization(<Date {...props} />);
    fireEvent.click(screen.getByPlaceholderText('mm/dd/yyyy'));
    fireEvent.change(screen.getByPlaceholderText('mm/dd/yyyy'), { target: { value: '2023-01-01' } });
  });
});
