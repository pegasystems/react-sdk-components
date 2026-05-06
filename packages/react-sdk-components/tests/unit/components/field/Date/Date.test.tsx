import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DateComponent from '../../../../../src/components/field/Date/Date';
import handleEvent from '../../../../../src/components/helpers/event-utils';

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: (name: string) => {
    if (name === 'FieldValueList') {
      return ({ name: fieldName, value, variant }: any) => (
        <span data-test-id='mock-field-value-list' data-variant={variant}>
          {fieldName}: {value}
        </span>
      );
    }
    if (name === 'TextInput') {
      return (inputProps: any) => <input data-test-id={inputProps.testId || 'mock-text-input'} value={inputProps.value || ''} readOnly />;
    }
    return () => <div data-test-id={`mock-${name}`} />;
  }
}));

jest.mock('../../../../../src/components/helpers/event-utils', () => jest.fn());

jest.mock('../../../../../src/components/helpers/formatters', () => ({
  format: (val: any) => (val ? `formatted-${val}` : '')
}));

jest.mock('../../../../../src/components/helpers/date-format-utils', () => ({
  dateFormatInfoDefault: {
    dateFormatString: 'MM/DD/YYYY',
    dateFormatStringLC: 'mm/dd/yyyy',
    dateFormatMask: '__/__/____'
  },
  getDateFormatInfo: () => ({
    dateFormatString: 'MM/DD/YYYY',
    dateFormatStringLC: 'mm/dd/yyyy',
    dateFormatMask: '__/__/____'
  })
}));

const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn()
};

const getDefaultProps = (): any => ({
  getPConnect: () => ({
    getActionsApi: () => mockActions,
    getStateProps: () => ({ value: '.DateValue' })
  }),
  label: 'Date Field',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'dateTestId',
  helperText: '',
  displayMode: '',
  hideLabel: false
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>);
};

describe('Date', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders DatePicker with label', () => {
    // Arrange
    const props = getDefaultProps();

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(screen.getByLabelText('Date Field')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    // Arrange
    const props = getDefaultProps();
    props.required = true;

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  test('renders with disabled state', () => {
    // Arrange
    const props = getDefaultProps();
    props.disabled = true;

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('renders FieldValueList in DISPLAY_ONLY mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '2023-06-15';

    // Act
    const { getByTestId } = renderWithProvider(<DateComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl.textContent).toContain('Date Field');
    expect(fvl.textContent).toContain('formatted-2023-06-15');
  });

  test('renders FieldValueList in STACKED_LARGE_VAL mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '2023-06-15';

    // Act
    const { getByTestId } = renderWithProvider(<DateComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
    expect(fvl.textContent).toContain('formatted-2023-06-15');
  });

  test('hides label in DISPLAY_ONLY mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '2023-06-15';
    props.hideLabel = true;

    // Act
    const { getByTestId } = renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(getByTestId('mock-field-value-list').textContent).toBe(': formatted-2023-06-15');
  });

  test('hides label in STACKED_LARGE_VAL mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '2023-06-15';
    props.hideLabel = true;

    // Act
    const { getByTestId } = renderWithProvider(<DateComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl.textContent).toBe(': formatted-2023-06-15');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
  });

  test('renders TextInput in readOnly mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;

    // Act
    const { getByTestId } = renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(getByTestId('dateTestId')).toBeInTheDocument();
  });

  test('displays validation message as helper text', () => {
    // Arrange
    const props = getDefaultProps();
    props.validatemessage = 'Date is required';

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(screen.getByText('Date is required')).toBeVisible();
  });

  test('displays helperText when no validatemessage', () => {
    // Arrange
    const props = getDefaultProps();
    props.helperText = 'Pick a date';

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(screen.getByText('Pick a date')).toBeVisible();
  });

  test('renders with error status', () => {
    // Arrange
    const props = getDefaultProps();
    props.status = 'error';

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('calls handleEvent when a valid date is entered', async () => {
    // Arrange
    const props = getDefaultProps();
    renderWithProvider(<DateComponent {...props} />);

    // Act
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '06/15/2023' } });

    // Assert
    await waitFor(() => {
      expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.DateValue', '2023-06-15');
    });
  });

  test('does not call handleEvent when an invalid date is entered', () => {
    // Arrange
    const props = getDefaultProps();
    renderWithProvider(<DateComponent {...props} />);

    // Act
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid' } });

    // Assert
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('renders with a pre-set value', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = '2023-06-15';

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(screen.getByRole('textbox')).toHaveValue('06/15/2023');
  });

  test('updates dateValue when value prop changes', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = '2023-01-01';
    const { rerender } = renderWithProvider(<DateComponent {...props} />);
    expect(screen.getByRole('textbox')).toHaveValue('01/01/2023');

    // Act
    props.value = '2023-12-25';
    rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateComponent {...props} />
      </LocalizationProvider>
    );

    // Assert
    expect(screen.getByRole('textbox')).toHaveValue('12/25/2023');
  });

  test('renders with empty value (null dateValue)', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = '';

    // Act
    renderWithProvider(<DateComponent {...props} />);

    // Assert
    expect(screen.getByTestId('dateTestId')).toBeInTheDocument();
  });
});
