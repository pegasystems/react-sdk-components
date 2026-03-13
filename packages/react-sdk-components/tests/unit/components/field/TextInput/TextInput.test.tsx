import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TextInput from '../../../../../src/components/field/TextInput';
import handleEvent from '../../../../../src/components/helpers/event-utils';

// Mock getComponentFromMap to return a mock FieldValueList instead of reading the real module
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

// Mock handleEvent to avoid reading its real implementation
jest.mock('../../../../../src/components/helpers/event-utils', () => jest.fn());

const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn()
};

const getDefaultProps = (): any => {
  return {
    required: true,
    testId: 'textInputTestId',
    label: 'TextInput',
    displayMode: false,
    getPConnect: () => ({
      getActionsApi: () => mockActions,
      getStateProps: () => ({ value: '.TextInputValue' })
    })
  };
};

describe('Test Text Input component', () => {
  test('TextInput Component renders with required', () => {
    const props = getDefaultProps();
    const TextInputComponent = render(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).toHaveAttribute('required');

    props.required = false;
    TextInputComponent.rerender(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).not.toHaveAttribute('required');
  });

  test('TextInput Component renders with disabled', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const TextInputComponent = render(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    TextInputComponent.rerender(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).not.toHaveAttribute('disabled');
  });

  test('TextInput Component renders with readonly', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const TextInputComponent = render(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    TextInputComponent.rerender(<TextInput {...props} />);
    expect(TextInputComponent.getByTestId('textInputTestId')).not.toHaveAttribute('readonly');
  });

  test('TextInput Component renders with label', () => {
    const props = getDefaultProps();
    const { getByText } = render(<TextInput {...props} />);
    const labelDiv = getByText('TextInput');
    expect(labelDiv).toBeVisible();
  });

  test('TextInput Component renders with displayMode as LabelsLeft', () => {
    const props = getDefaultProps();
    props.value = 'Hi there!';
    props.displayMode = 'DISPLAY_ONLY';
    const { getByTestId } = render(<TextInput {...props} />);
    const fieldValueList = getByTestId('mock-field-value-list');
    expect(fieldValueList).toBeVisible();
    expect(fieldValueList.textContent).toContain('Hi there!');
  });

  test('TextInput Component invoke handlers for blur and change events', () => {
    const props = getDefaultProps();
    const TextInputComponent = render(<TextInput {...props} />);
    fireEvent.change(TextInputComponent.getByTestId('textInputTestId'), {
      target: { value: 'a' }
    });
    fireEvent.blur(TextInputComponent.getByTestId('textInputTestId'));
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.TextInputValue', 'a');
  });

  test('TextInput Component should not invoke on blur handler for read only fields', () => {
    (handleEvent as jest.Mock).mockClear();
    const props = getDefaultProps();
    props.readOnly = true;
    const TextInputComponent = render(<TextInput {...props} />);
    fireEvent.change(TextInputComponent.getByTestId('textInputTestId'), {
      target: { value: 'a' }
    });
    fireEvent.blur(TextInputComponent.getByTestId('textInputTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('FieldValueList child component is rendered in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.value = 'Test Value';
    props.displayMode = 'DISPLAY_ONLY';
    const { getByTestId, getByText } = render(<TextInput {...props} />);
    expect(getByTestId('mock-field-value-list')).toBeVisible();
    expect(getByText('TextInput: Test Value')).toBeVisible();
  });

  test('FieldValueList child component is rendered in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.value = 'Stacked Value';
    props.displayMode = 'STACKED_LARGE_VAL';
    const { getByTestId } = render(<TextInput {...props} />);
    const fieldValueList = getByTestId('mock-field-value-list');
    expect(fieldValueList).toBeVisible();
    expect(fieldValueList).toHaveAttribute('data-variant', 'stacked');
  });

  test('FieldValueList hides label in DISPLAY_ONLY mode when hideLabel is true', () => {
    const props = getDefaultProps();
    props.value = 'Hidden Label';
    props.displayMode = 'DISPLAY_ONLY';
    props.hideLabel = true;
    const { getByTestId } = render(<TextInput {...props} />);
    const fieldValueList = getByTestId('mock-field-value-list');
    expect(fieldValueList).toBeVisible();
    expect(fieldValueList.textContent).toBe(': Hidden Label');
  });

  test('FieldValueList hides label in STACKED_LARGE_VAL mode when hideLabel is true', () => {
    const props = getDefaultProps();
    props.value = 'Stacked Hidden';
    props.displayMode = 'STACKED_LARGE_VAL';
    props.hideLabel = true;
    const { getByTestId } = render(<TextInput {...props} />);
    const fieldValueList = getByTestId('mock-field-value-list');
    expect(fieldValueList).toBeVisible();
    expect(fieldValueList.textContent).toBe(': Stacked Hidden');
    expect(fieldValueList).toHaveAttribute('data-variant', 'stacked');
  });
});
