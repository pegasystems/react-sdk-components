import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import CheckboxComponent from '../../../../../src/components/field/Checkbox';

const handleEvent = jest.fn();
const validate = jest.fn();
const clearErrorMessages = jest.fn();
const insertInstruction = jest.fn();
const deleteInstruction = jest.fn();
const updateNewInstuctions = jest.fn();

jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => handleEvent(...args)
}));

jest.mock('../../../../../src/components/helpers/instructions-utils', () => ({
  __esModule: true,
  insertInstruction: (...args) => insertInstruction(...args),
  deleteInstruction: (...args) => deleteInstruction(...args),
  updateNewInstuctions: (...args) => updateNewInstuctions(...args)
}));

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  __esModule: true,
  getComponentFromMap: (name) => {
    if (name === 'SelectableCard') {
      return (props) => (
        <div data-test-id={`selectable-card-${props.testId}`}>
          <button
            data-test-id={`card-option-${props.testId}-opt1`}
            id='opt1'
            onClick={(e) => {
              props.onChange({
                target: { id: 'opt1', checked: true },
                stopPropagation: () => {}
              });
              props.onBlur(); // ✅ simulate blur after selection
            }}
          >
            Option 1
          </button>
        </div>
      );
    }
    if (name === 'FieldValueList') {
      return require('../FieldValueList').default;
    }
    return null;
  }
}));

const getPConnect = jest.fn(
  () =>
    ({
      getActionsApi: () => ({}),
      getStateProps: () => ({ value: '.checkbox' }),
      getValidationApi: () => ({ validate }),
      clearErrorMessages,
      setReferenceList: jest.fn(),
      getRawMetadata: () => ({ config: { imageDescription: 'data.description' } })
    }) as any
);

const defaultProps = {
  getPConnect,
  label: 'Checkbox Label',
  caption: 'Checkbox Caption',
  value: true,
  readOnly: false,
  testId: 'checkboxTestId',
  required: true,
  disabled: false,
  status: '',
  helperText: 'Checkbox helper text',
  validatemessage: '',
  displayMode: '',
  hideLabel: false,
  trueLabel: 'Yes',
  falseLabel: 'No',
  selectionMode: '',
  datasource: {
    source: [{ key: 'opt1', value: 'Option 1', text: 'Option 1' }]
  },
  selectionKey: 'data.key',
  selectionList: 'selectionList',
  primaryField: 'data.text',
  referenceList: '',
  readonlyContextList: [{ key: '' }],
  variant: '',
  hideFieldLabels: false,
  additionalProps: {},
  imagePosition: 'left',
  imageSize: 'medium',
  showImageDescription: 'true',
  renderMode: '',
  image: 'data.image',
  onChange: jest.fn()
};

describe('CheckboxComponent', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders with label and helper text', () => {
    const props = { ...defaultProps };
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeInTheDocument();
    expect(screen.getByText('Checkbox helper text')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    const { rerender } = render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeVisible();
    expect(screen.getByText('Checkbox Label').closest('legend')).toHaveClass('Mui-required');

    props.required = false;
    rerender(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label').closest('legend')).not.toHaveClass('Mui-required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    props.disabled = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('readonly');
  });

  test('renders with validation message overriding helper text', () => {
    const props = { ...defaultProps };
    props.validatemessage = 'Validation error';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Validation error')).toBeVisible();
    expect(screen.queryByText('Checkbox helper text')).not.toBeInTheDocument();
  });

  test('calls handleEvent on change when not readOnly', () => {
    const props = { ...defaultProps };
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleEvent).toHaveBeenCalledWith(expect.any(Object), 'changeNblur', '.checkbox', false);
  });

  test('calls validate on blur when not readOnly', () => {
    const props = { ...defaultProps };
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.blur(checkbox);
    expect(validate).toHaveBeenCalledWith(true);
  });

  test('does not call handleEvent or validate when readOnly', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.blur(checkbox);
    expect(handleEvent).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId('field-value-list')).toHaveTextContent('Checkbox CaptionYes');
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = false;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId('field-value-list')).toHaveTextContent('Checkbox CaptionNo');
  });

  test('renders multi-selection checkboxes and handles selection', () => {
    const props = { ...defaultProps };
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: 'opt1', value: 'Option 1', text: 'Option 1' },
        { key: 'opt2', value: 'Option 2', text: 'Option 2' }
      ]
    };
    props.readonlyContextList = [{ key: 'opt1' }];
    const { getByLabelText } = render(<CheckboxComponent {...props} />);
    const checkbox1 = screen.getByTestId('checkboxTestId:Option 1');
    const checkbox2 = screen.getByTestId('checkboxTestId:Option 2');
    expect(getByLabelText('Option 1').closest('input')).toBeChecked();
    expect(checkbox2).not.toBeChecked();

    fireEvent.click(checkbox2);
    expect(insertInstruction).toHaveBeenCalled();
    fireEvent.click(checkbox1);
    expect(deleteInstruction).toHaveBeenCalled();
  });

  // Card variant tests
  test('renders SelectableCard when variant is card', () => {
    const props = { ...defaultProps };
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId(`selectable-card-${props.testId}`)).toBeInTheDocument();
  });

  test('handles card option selection', () => {
    const props = { ...defaultProps };
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    const cardOption = screen.getByTestId(`card-option-${props.testId}-opt1`);
    fireEvent.click(cardOption);
    expect(insertInstruction).toHaveBeenCalledWith(expect.any(Object), props.selectionList, props.selectionKey, props.primaryField, {
      id: 'opt1',
      primary: 'opt1'
    });
  });

  test('validates on blur in card variant', () => {
    const props = { ...defaultProps };
    props.variant = 'card';
    props.readonlyContextList = []; // ✅ ensure this is defined
    render(<CheckboxComponent {...props} />);
    const cardOption = screen.getByTestId(`card-option-${props.testId}-opt1`);
    fireEvent.click(cardOption);
    expect(validate).toHaveBeenCalledWith([], props.selectionList);
  });

  test('renders label in card variant', () => {
    const props = { ...defaultProps };
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeInTheDocument();
  });
});
