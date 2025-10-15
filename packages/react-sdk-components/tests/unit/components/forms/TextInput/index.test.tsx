import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TextInput from '../../../../../src/components/field/TextInput';

const mockHandleEvent = jest.fn();
jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => mockHandleEvent(...args)
}));

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
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
          value: '.textInput'
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
  label: 'Test Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'textInputTestId',
  fieldMetadata: { maxLength: 50 },
  helperText: 'Helper text',
  displayMode: '',
  hideLabel: false,
  placeholder: 'Enter text',
  onChange: jest.fn()
};

describe('TextInput Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders with label and placeholder', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    const { rerender } = render(<TextInput {...props} />);
    const input = screen.getByTestId('textInputTestId');
    expect(input).toBeRequired();

    props.required = false;
    rerender(<TextInput {...props} />);
    expect(input).not.toBeRequired();
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    const { rerender } = render(<TextInput {...props} />);
    const input = screen.getByTestId('textInputTestId');
    expect(input).toBeDisabled();

    props.disabled = false;
    rerender(<TextInput {...props} />);
    expect(input).not.toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps, readOnly: true };
    const { rerender, getByTestId } = render(<TextInput {...props} />);
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with helper text', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  test('renders with validation message overriding helper text', () => {
    const props = { ...defaultProps, validatemessage: 'Validation error' };
    render(<TextInput {...props} />);
    expect(screen.getByText('Validation error')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  test('renders with maxLength attribute', () => {
    render(<TextInput {...defaultProps} />);
    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('maxlength', '50');
  });

  test('updates value on change', () => {
    render(<TextInput {...defaultProps} />);
    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'New value' } });
    expect(input).toHaveValue('New value');
  });

  test('calls handleEvent on blur when not readOnly', () => {
    render(<TextInput {...defaultProps} />);
    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'Blur value' } });
    fireEvent.blur(input);
    expect(mockHandleEvent).toHaveBeenCalledWith(expect.any(Object), 'changeNblur', '.textInput', 'Blur value');
  });

  test('does not call handleEvent on blur when readOnly', () => {
    const props = { ...defaultProps, readOnly: true };
    render(<TextInput {...props} />);
    const input = screen.getByLabelText('Test Label');
    fireEvent.blur(input);
    expect(mockHandleEvent).not.toHaveBeenCalled();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps, displayMode: 'DISPLAY_ONLY', value: 'Display Value' };
    render(<TextInput {...props} />);
    expect(screen.getByText('Display Value')).toBeInTheDocument();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps, displayMode: 'STACKED_LARGE_VAL', value: 'Stacked Value' };
    render(<TextInput {...props} />);
    expect(screen.getByText('Stacked Value')).toBeInTheDocument();
  });
});
