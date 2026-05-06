import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckboxComponent from '../../../../../src/components/field/Checkbox/Checkbox';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import { insertInstruction, deleteInstruction, updateNewInstuctions } from '../../../../../src/components/helpers/instructions-utils';

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: (name: string) => {
    if (name === 'FieldValueList') {
      return ({ name: fieldName, value, variant }: any) => (
        <span data-test-id='mock-field-value-list' data-variant={variant}>
          {fieldName}: {value}
        </span>
      );
    }
    if (name === 'SelectableCard') {
      return (cardProps: any) => (
        <div data-test-id='mock-selectable-card'>
          <input type='checkbox' data-test-id='card-checkbox' onChange={cardProps.onChange} />
          <button data-test-id='card-blur' onClick={cardProps.onBlur}>
            blur
          </button>
          {cardProps.showNoValue && <span data-test-id='no-value'>No value</span>}
        </div>
      );
    }
    return () => <div data-test-id={`mock-${name}`} />;
  }
}));

jest.mock('../../../../../src/components/helpers/event-utils', () => jest.fn());

jest.mock('../../../../../src/components/helpers/instructions-utils', () => ({
  insertInstruction: jest.fn(),
  deleteInstruction: jest.fn(),
  updateNewInstuctions: jest.fn()
}));

jest.mock('@mui/styles/makeStyles', () => () => () => ({
  checkbox: 'checkbox',
  selectableCard: 'selectableCard'
}));

const mockValidate = jest.fn();
const mockClearErrorMessages = jest.fn();
const mockSetReferenceList = jest.fn();
const mockOnClick = jest.fn();
const mockInsert = jest.fn();
const mockDeleteEntry = jest.fn();
const mockInitDefaultPageInstructions = jest.fn();

const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn(),
  onClick: mockOnClick
};

const getDefaultProps = (): any => ({
  getPConnect: () => ({
    getActionsApi: () => mockActions,
    getStateProps: () => ({ value: '.CheckboxValue' }),
    getValidationApi: () => ({ validate: mockValidate }),
    clearErrorMessages: mockClearErrorMessages,
    setReferenceList: mockSetReferenceList,
    getListActions: () => ({
      insert: mockInsert,
      deleteEntry: mockDeleteEntry,
      initDefaultPageInstructions: mockInitDefaultPageInstructions
    }),
    getValue: () => [],
    getPageReference: () => '',
    getFieldMetadata: () => ({}),
    getRawMetadata: () => ({ config: { imageDescription: '.SomeDesc' } })
  }),
  label: 'Test Checkbox',
  caption: 'Check this',
  value: false,
  readOnly: false,
  testId: 'checkboxTestId',
  required: false,
  disabled: false,
  status: '',
  helperText: '',
  validatemessage: '',
  displayMode: '',
  hideLabel: false,
  trueLabel: 'Yes',
  falseLabel: 'No',
  selectionMode: 'single',
  datasource: undefined,
  selectionKey: '',
  selectionList: '',
  primaryField: '',
  readonlyContextList: [],
  referenceList: '',
  variant: '',
  hideFieldLabels: false,
  additionalProps: {},
  imagePosition: 'top',
  imageSize: 'medium',
  showImageDescription: 'true',
  renderMode: '',
  image: '.Image'
});

describe('CheckboxComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders single checkbox with caption and label', () => {
    // Arrange
    const props = getDefaultProps();

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByText('Test Checkbox')).toBeVisible();
    expect(screen.getByText('Check this')).toBeVisible();
  });

  test('renders with required state', () => {
    // Arrange
    const props = getDefaultProps();
    props.required = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  test('renders checkbox as checked when value is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('renders checkbox as unchecked when value is false', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = false;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('calls handleEvent on change when not readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.CheckboxValue', true);
  });

  test('calls validate on blur when not readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.blur(screen.getByRole('checkbox'));

    // Assert
    expect(mockValidate).toHaveBeenCalledWith(false);
  });

  test('does not call handleEvent on change when readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;

    // Act
    render(<CheckboxComponent {...props} />);
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('does not call validate on blur when readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;

    // Act
    render(<CheckboxComponent {...props} />);
    fireEvent.blur(screen.getByRole('checkbox'));

    // Assert
    expect(mockValidate).not.toHaveBeenCalled();
  });

  test('renders FieldValueList in DISPLAY_ONLY mode with trueLabel when value is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl.textContent).toContain('Check this');
    expect(fvl.textContent).toContain('Yes');
  });

  test('renders FieldValueList in DISPLAY_ONLY mode with falseLabel when value is false', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = false;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    expect(getByTestId('mock-field-value-list').textContent).toContain('No');
  });

  test('renders FieldValueList in STACKED_LARGE_VAL mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = true;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
    expect(fvl.textContent).toContain('Yes');
  });

  test('renders FieldValueList in STACKED_LARGE_VAL mode with falseLabel when value is false', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = false;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
    expect(fvl.textContent).toContain('No');
  });

  test('hides label in DISPLAY_ONLY mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    expect(getByTestId('mock-field-value-list').textContent).toBe(': Yes');
  });

  test('hides label in STACKED_LARGE_VAL mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = true;
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl.textContent).toBe(': Yes');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
  });

  test('displays validation message as helper text', () => {
    // Arrange
    const props = getDefaultProps();
    props.validatemessage = 'Field is required';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByText('Field is required')).toBeVisible();
  });

  test('displays helperText when no validatemessage', () => {
    // Arrange
    const props = getDefaultProps();
    props.helperText = 'Help text here';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByText('Help text here')).toBeVisible();
  });

  test('renders with error status', () => {
    // Arrange
    const props = getDefaultProps();
    props.status = 'error';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('hides label when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.hideLabel = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.queryByText('Test Checkbox')).not.toBeInTheDocument();
  });

  test('renders disabled checkbox', () => {
    // Arrange
    const props = getDefaultProps();
    props.disabled = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  test('updates checked state when value prop changes', () => {
    // Arrange
    const props = getDefaultProps();
    props.value = false;
    const { rerender } = render(<CheckboxComponent {...props} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    // Act
    props.value = true;
    rerender(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  // Multi-mode tests
  test('renders multiple checkboxes in multi selectionMode', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: 'opt1', value: 'Option 1' },
        { key: 'opt2', value: 'Option 2' },
        { key: 'opt3', value: 'Option 3' }
      ]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(screen.getByText('Option 1')).toBeVisible();
    expect(screen.getByText('Option 2')).toBeVisible();
  });

  test('renders multi checkboxes with text property as label', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'ValueLabel', text: 'TextLabel' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.getByText('TextLabel')).toBeVisible();
  });

  test('multi checkbox shows checked when selectedvalues matches', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: 'opt1', value: 'Option 1' },
        { key: 'opt2', value: 'Option 2' }
      ]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [{ SelectedKey: 'opt1' }];

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  test('multi checkbox calls insertInstruction on check', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'Option 1' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(insertInstruction).toHaveBeenCalled();
    expect(mockClearErrorMessages).toHaveBeenCalledWith({
      property: '.SelectedList',
      category: '',
      context: ''
    });
  });

  test('multi checkbox calls deleteInstruction on uncheck', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'Option 1' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [{ SelectedKey: 'opt1' }];

    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(deleteInstruction).toHaveBeenCalled();
  });

  test('multi checkbox calls validate on blur', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'Option 1' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.blur(screen.getByRole('checkbox'));

    // Assert
    expect(mockValidate).toHaveBeenCalledWith([], '.SelectedList');
  });

  test('multi checkbox handles empty datasource source', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {};
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  test('multi checkbox with text fallback in insertInstruction and deleteInstruction', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'FallbackValue' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [{ SelectedKey: 'opt1' }];
    render(<CheckboxComponent {...props} />);

    // Act - uncheck to trigger delete path with element.text ?? element.value
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(deleteInstruction).toHaveBeenCalled();
  });

  test('multi checkbox insert path with text property uses text over value', () => {
    // Arrange
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [{ key: 'opt1', value: 'FallbackValue', text: 'TextValue' }]
    };
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.readonlyContextList = [];
    render(<CheckboxComponent {...props} />);

    // Act - check to trigger insert path with element.text ?? element.value
    fireEvent.click(screen.getByRole('checkbox'));

    // Assert
    expect(insertInstruction).toHaveBeenCalledWith(expect.anything(), '.SelectedList', '.SelectedKey', '.Primary', {
      id: 'opt1',
      primary: 'TextValue'
    });
  });

  // Card variant tests
  test('renders SelectableCard when variant is card', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.selectionKey = '.SelectedKey';
    props.primaryField = '.Primary';
    props.datasource = { source: [{ SelectedKey: 'opt1' }] };
    props.readonlyContextList = [];

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    expect(getByTestId('mock-selectable-card')).toBeVisible();
    expect(screen.getByText('Test Checkbox')).toBeVisible();
  });

  test('card variant onChange calls handleCheckboxChange with checked', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.datasource = { source: [{ SelectedKey: 'opt1' }] };
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act - the onChange handler expects e.target.checked and e.target.id
    const cardCheckbox = screen.getByTestId('card-checkbox');
    Object.defineProperty(cardCheckbox, 'id', { value: 'opt1', writable: true });
    fireEvent.click(cardCheckbox);

    // Assert
    expect(insertInstruction).toHaveBeenCalled();
  });

  test('card variant onChange handles uncheck (delete)', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.datasource = { source: [{ SelectedKey: 'opt1' }] };
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act - first check then uncheck
    const cardCheckbox = screen.getByTestId('card-checkbox');
    Object.defineProperty(cardCheckbox, 'id', { value: 'opt1', writable: true });
    fireEvent.click(cardCheckbox); // check
    jest.clearAllMocks();
    fireEvent.click(cardCheckbox); // uncheck

    // Assert
    expect(deleteInstruction).toHaveBeenCalled();
  });

  test('card variant onBlur calls validate', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.datasource = { source: [] };
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act
    fireEvent.click(screen.getByTestId('card-blur'));

    // Assert
    expect(mockValidate).toHaveBeenCalledWith([], '.SelectedList');
  });

  test('card variant shows no-value in ReadOnly renderMode with empty selectedvalues', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.renderMode = 'ReadOnly';
    props.selectionKey = '.SelectedKey';
    props.primaryField = '.Primary';
    props.datasource = { source: [] };
    props.readonlyContextList = [];

    // Act
    const { getByTestId } = render(<CheckboxComponent {...props} />);

    // Assert
    expect(getByTestId('no-value')).toBeVisible();
  });

  test('card variant does not show no-value when selectedvalues exist', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.renderMode = 'ReadOnly';
    props.selectionKey = '.SelectedKey';
    props.primaryField = '.Primary';
    props.datasource = { source: [] };
    props.readonlyContextList = [{ SelectedKey: 'opt1' }];

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(screen.queryByTestId('no-value')).not.toBeInTheDocument();
  });

  // referenceList / updateNewInstuctions
  test('calls setReferenceList and updateNewInstuctions when referenceList has length and not readOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.referenceList = '.SomeRefList';
    props.selectionList = '.SelectedList';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(mockSetReferenceList).toHaveBeenCalledWith('.SelectedList');
    expect(updateNewInstuctions).toHaveBeenCalled();
  });

  test('does not call setReferenceList when readOnly mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.referenceList = '.SomeRefList';
    props.readOnly = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(mockSetReferenceList).not.toHaveBeenCalled();
  });

  test('does not call setReferenceList when renderMode is ReadOnly', () => {
    // Arrange
    const props = getDefaultProps();
    props.referenceList = '.SomeRefList';
    props.renderMode = 'ReadOnly';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(mockSetReferenceList).not.toHaveBeenCalled();
  });

  test('does not call setReferenceList when displayMode is DISPLAY_ONLY', () => {
    // Arrange
    const props = getDefaultProps();
    props.referenceList = '.SomeRefList';
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(mockSetReferenceList).not.toHaveBeenCalled();
  });

  test('does not call setReferenceList when referenceList is empty', () => {
    // Arrange
    const props = getDefaultProps();
    props.referenceList = '';

    // Act
    render(<CheckboxComponent {...props} />);

    // Assert
    expect(mockSetReferenceList).not.toHaveBeenCalled();
  });

  test('card variant onChange with item not found in datasource', () => {
    // Arrange
    const props = getDefaultProps();
    props.variant = 'card';
    props.selectionKey = '.SelectedKey';
    props.selectionList = '.SelectedList';
    props.primaryField = '.Primary';
    props.datasource = { source: [{ SelectedKey: 'opt1' }] };
    props.readonlyContextList = [];

    render(<CheckboxComponent {...props} />);

    // Act - pass an id that doesn't match any item
    const cardCheckbox = screen.getByTestId('card-checkbox');
    Object.defineProperty(cardCheckbox, 'id', { value: 'nonexistent', writable: true });
    fireEvent.click(cardCheckbox);

    // Assert - should still call insertInstruction with undefined values
    expect(insertInstruction).toHaveBeenCalled();
  });
});
