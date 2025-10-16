import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Time from '../../../../../src/components/field/Time';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import TextInput from '../../../../../src/components/field/TextInput';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));

const mockHandleEvent = jest.fn();
jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => mockHandleEvent(...args)
}));

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const validate = jest.fn();

const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.time'
        }),
        getValidationApi: () => ({
          validate
        }),
        getConfigProps: jest.fn(() => ({})),
        getDataObject: jest.fn(() => ({})),
        getCaseInfo: jest.fn(() => ({
          getClassName: jest.fn(() => 'TestClass')
        })),
        getLocalizedValue: jest.fn((value) => value),
        getLocaleRuleNameFromKeys: jest.fn(() => 'localeRuleName')
      }) as any
  ),
  label: 'Time Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'timeTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
};

describe('Time Component', () => {
  const renderWithLocalization = (ui) => {
    return render(<LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>);
  };

  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    renderWithLocalization(<Time {...props} />);
    expect(screen.getAllByPlaceholderText('hh:mm am')[0]).toHaveAttribute('required');

    props.required = false;
    renderWithLocalization(<Time {...props} />);
    expect(screen.getAllByPlaceholderText('hh:mm am')[1]).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    renderWithLocalization(<Time {...props} />);
    expect(screen.getAllByPlaceholderText('hh:mm am')[0]).toBeDisabled();

    props.disabled = false;
    renderWithLocalization(<Time {...props} />);
    expect(screen.getAllByPlaceholderText('hh:mm am')[1]).not.toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    expect(getByTestId('timeTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByPlaceholderText('hh:mm am')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByLabelText('Time Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '12:00';
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByText('12:00')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '12:00';
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByText('12:00')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<TextInput {...props} />);
    fireEvent.change(screen.getByTestId('timeTestId'), { target: { value: '12:00' } });
    fireEvent.blur(screen.getByTestId('timeTestId'));
    expect(mockHandleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    renderWithLocalization(<Time {...props} />);
    fireEvent.change(screen.getByPlaceholderText('hh:mm am'), { target: { value: '12:00 am' } });
    fireEvent.blur(screen.getByPlaceholderText('hh:mm am'));
    expect(mockHandleEvent).toHaveBeenCalled();
  });

  test('renders with helper text', () => {
    const props = { ...defaultProps };
    props.helperText = 'Helper Text';
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByText('Helper Text')).toBeVisible();
  });

  test('renders with testId', () => {
    const props = { ...defaultProps };
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByTestId('timeTestId')).toBeVisible();
  });

  test('renders with value', () => {
    const props = { ...defaultProps };
    props.value = '12:00';
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByDisplayValue('12:00 pm')).toBeVisible();
  });

  test('renders with validatemessage', () => {
    const props = { ...defaultProps };
    props.validatemessage = 'Invalid Time';
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByText('Invalid Time')).toBeVisible();
  });

  test('renders with validation message overriding helper text', () => {
    const props = { ...defaultProps, validatemessage: 'Validation error' };
    renderWithLocalization(<Time {...props} />);
    expect(screen.getByText('Validation error')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});
