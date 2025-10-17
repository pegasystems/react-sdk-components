import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Percentage from '../../../../../src/components/field/Percentage';

const mockHandleEvent = jest.fn();
jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => mockHandleEvent(...args)
}));

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));

jest.mock('../../../../../src/components/field/Currency/currency-utils', () => ({
  getCurrencyCharacters: jest.fn(() => ({
    theDecimalIndicator: '.',
    theDigitGroupSeparator: ','
  })),
  getCurrencyOptions: jest.fn(() => ({}))
}));

jest.mock('../../../../../src/components/helpers/formatters', () => ({
  format: jest.fn((value) => value)
}));

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
          value: '.percentage'
        }),
        getValidationApi: () => ({
          validate
        }),
        getComponentName: () => 'Percentage',
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Percentage Label',
  required: false,
  disabled: false,
  value: '25',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'percentageTestId',
  helperText: 'Helper text',
  displayMode: '',
  hideLabel: false,
  placeholder: 'Enter percentage',
  currencyISOCode: 'USD',
  showGroupSeparators: 'true',
  decimalPrecision: 2,
  onChange: jest.fn()
};

describe('Percentage Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders with label and placeholder', () => {
    render(<Percentage {...defaultProps} />);
    expect(screen.getByLabelText('Percentage Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter percentage')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    const props = { ...defaultProps, required: true };
    const { rerender } = render(<Percentage {...props} />);
    const input = screen.getByTestId('percentageTestId');
    expect(input).toBeRequired();

    props.required = false;
    rerender(<Percentage {...props} />);
    expect(input).not.toBeRequired();
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps, disabled: true };
    const { rerender } = render(<Percentage {...props} />);
    const input = screen.getByTestId('percentageTestId');
    expect(input).toBeDisabled();

    props.disabled = false;
    rerender(<Percentage {...props} />);
    expect(input).not.toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps, readOnly: true };
    const { rerender, getByTestId } = render(<Percentage {...props} />);
    const input = screen.getByLabelText('Percentage Label');
    expect(input).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with helper text', () => {
    render(<Percentage {...defaultProps} />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  test('renders with validation message overriding helper text', () => {
    const props = { ...defaultProps, validatemessage: 'Validation error' };
    render(<Percentage {...props} />);
    expect(screen.getByText('Validation error')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  test('updates value on change', () => {
    render(<Percentage {...defaultProps} />);
    const input = screen.getByLabelText('Percentage Label');
    fireEvent.change(input, { target: { value: '50' } });
    expect(input).toHaveValue('50%');
  });

  test('calls handleEvent on blur when not readOnly', () => {
    render(<Percentage {...defaultProps} />);
    const input = screen.getByLabelText('Percentage Label');
    fireEvent.change(input, { target: { value: '75' } });
    fireEvent.blur(input);
    expect(mockHandleEvent).toHaveBeenCalledWith(expect.any(Object), 'changeNblur', '.percentage', '75');
  });

  test('does not call handleEvent on blur when readOnly', () => {
    const props = { ...defaultProps, readOnly: true };
    render(<Percentage {...props} />);
    const input = screen.getByLabelText('Percentage Label');
    fireEvent.blur(input);
    expect(mockHandleEvent).not.toHaveBeenCalled();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps, displayMode: 'DISPLAY_ONLY', value: '30' };
    render(<Percentage {...props} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps, displayMode: 'STACKED_LARGE_VAL', value: '45' };
    render(<Percentage {...props} />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });
});
