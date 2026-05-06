import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Currency from '../../../../../src/components/field/Currency/Currency';
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
    return () => <div data-test-id={`mock-${name}`} />;
  }
}));

jest.mock('../../../../../src/components/helpers/event-utils', () => jest.fn());

jest.mock('../../../../../src/components/field/Currency/currency-utils', () => ({
  getCurrencyCharacters: () => ({
    theCurrencySymbol: '$',
    theDecimalIndicator: '.',
    theDigitGroupSeparator: ','
  }),
  getCurrencyOptions: () => ({
    locale: 'en-US',
    style: 'currency',
    currency: 'USD'
  })
}));

jest.mock('../../../../../src/components/helpers/formatters', () => ({
  format: (_value: any) => `$${_value}`
}));

const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn()
};

const getDefaultProps = (): any => ({
  getPConnect: () => ({
    getActionsApi: () => mockActions,
    getStateProps: () => ({ value: '.CurrencyValue' }),
    getComponentName: () => 'Currency'
  }),
  label: 'Amount',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'currencyTestId',
  helperText: '',
  displayMode: '',
  hideLabel: false,
  currencyISOCode: 'USD',
  placeholder: 'Enter amount',
  allowDecimals: true
});

describe('Currency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with label and placeholder', () => {
    // Arrange
    const props = getDefaultProps();

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    // Arrange
    const props = getDefaultProps();
    props.required = true;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    // Arrange
    const props = getDefaultProps();
    props.disabled = true;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toHaveAttribute('readonly');
  });

  test('renders FieldValueList in DISPLAY_ONLY mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '100';

    // Act
    const { getByTestId } = render(<Currency {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl.textContent).toContain('Amount');
    expect(fvl.textContent).toContain('$100');
  });

  test('renders FieldValueList in STACKED_LARGE_VAL mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '200';

    // Act
    const { getByTestId } = render(<Currency {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
    expect(fvl.textContent).toContain('$200');
  });

  test('hides label in DISPLAY_ONLY mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '100';
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<Currency {...props} />);

    // Assert
    expect(getByTestId('mock-field-value-list').textContent).toBe(': $100');
  });

  test('hides label in STACKED_LARGE_VAL mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '100';
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<Currency {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl.textContent).toBe(': $100');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
  });

  test('displays validation message as helper text', () => {
    // Arrange
    const props = getDefaultProps();
    props.validatemessage = 'Required field';

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByText('Required field')).toBeVisible();
  });

  test('displays helperText when no validatemessage', () => {
    // Arrange
    const props = getDefaultProps();
    props.helperText = 'Enter currency';

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByText('Enter currency')).toBeVisible();
  });

  test('renders with error status', () => {
    // Arrange
    const props = getDefaultProps();
    props.status = 'error';

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toHaveAttribute('aria-invalid', 'true');
  });

  test('calls handleEvent on blur when not readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = '123';
    render(<Currency {...props} />);

    // Act
    fireEvent.blur(screen.getByTestId('currencyTestId'));

    // Assert
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.CurrencyValue', '123');
  });

  test('does not call handleEvent on blur when readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;
    props.value = '123';
    render(<Currency {...props} />);

    // Act
    fireEvent.blur(screen.getByTestId('currencyTestId'));

    // Assert
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('renders with value and updates on value change', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = '500';
    const { rerender } = render(<Currency {...props} />);

    // Assert initial value
    expect(screen.getByTestId('currencyTestId')).toHaveValue('$500.00');

    // Act
    props.value = '1000';
    rerender(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toHaveValue('$1,000.00');
  });

  test('handles onValueChange updating internal state', () => {
    // Arrange
    const props = getDefaultProps();
    render(<Currency {...props} />);

    // Act
    fireEvent.change(screen.getByTestId('currencyTestId'), {
      target: { value: '$456.00' }
    });
    fireEvent.blur(screen.getByTestId('currencyTestId'));

    // Assert
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.CurrencyValue', expect.any(String));
  });

  test('uses default placeholder when placeholder is not provided', () => {
    // Arrange
    const props = getDefaultProps();
    delete props.placeholder;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toBeInTheDocument();
  });

  test('renders with allowDecimals false (no decimal places)', () => {
    // Arrange
    const props = getDefaultProps();
    props.allowDecimals = false;
    props.value = '100';

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toHaveValue('$100');
  });

  test('renders with default currencyISOCode when not provided', () => {
    // Arrange
    const props = getDefaultProps();
    delete props.currencyISOCode;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toBeInTheDocument();
  });

  test('renders with default empty value when value is not provided', () => {
    // Arrange
    const props = getDefaultProps();
    delete props.value;

    // Act
    render(<Currency {...props} />);

    // Assert
    expect(screen.getByTestId('currencyTestId')).toBeInTheDocument();
  });
});
