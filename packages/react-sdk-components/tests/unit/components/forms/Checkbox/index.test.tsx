import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CheckboxComponent from '../../../../../src/components/field/Checkbox';
import handleEvent from '../../../../../src/components/helpers/event-utils';

import { insertInstruction, deleteInstruction, updateNewInstuctions } from '../../../../../src/components/helpers/instructions-utils';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));
jest.mock('../../../../../src/components/helpers/instructions-utils', () => ({
  insertInstruction: jest.fn(),
  deleteInstruction: jest.fn(),
  updateNewInstuctions: jest.fn()
}));

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const validate = jest.fn();
const clearErrorMessages = jest.fn();

const getDefaultProps = () => ({
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.checkbox'
        }),
        getValidationApi: () => ({
          validate
        }),
        clearErrorMessages
      }) as any
  ),
  label: 'Checkbox Label',
  caption: 'Checkbox Caption',
  required: false,
  disabled: false,
  value: false,
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'checkboxTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  trueLabel: 'True',
  falseLabel: 'False',
  selectionMode: '',
  datasource: {},
  selectionKey: '',
  selectionList: '',
  primaryField: '',
  referenceList: '',
  readonlyContextList: [{ key: '' }],
  onChange: jest.fn()
});

describe('CheckboxComponent', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { rerender } = render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeVisible();
    expect(screen.getByText('Checkbox Label').closest('legend')).toHaveClass('Mui-required');

    props.required = false;
    rerender(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label').closest('legend')).not.toHaveClass('Mui-required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByLabelText('Checkbox Caption')).toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByLabelText('Checkbox Caption')).toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('True')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('True')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    fireEvent.change(screen.getByTestId('checkboxTestId'), { target: { checked: true } });
    fireEvent.blur(screen.getByTestId('checkboxTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);

    const checkbox = screen.getByLabelText('Checkbox Caption') as HTMLInputElement;
    fireEvent.click(checkbox, {
      target: {
        checked: true
      }
    });
    expect(handleEvent).toHaveBeenCalled();
  });

  test('renders multiple checkboxes in multi-selection mode', () => {
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: '1', value: 'Option 1' },
        { key: '2', value: 'Option 2' },
        { key: '3', value: 'Option 3' },
        { key: '4', value: 'Option 4' }
      ]
    };
    props.selectionKey = 'selection.key';
    props.selectionList = 'selectionList';
    props.primaryField = 'primaryField';
    props.readonlyContextList = [{ key: '1' }];
    const { getByLabelText } = render(<CheckboxComponent {...props} />);
    expect(getByLabelText('Option 1').closest('span')).toHaveClass('Mui-checked');
  });

  test('invokes handlers for multi-selection mode', () => {
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: '1', value: 'Option 1' },
        { key: '2', value: 'Option 2' }
      ]
    };
    props.selectionKey = 'selection.key';
    props.selectionList = 'selectionList';
    props.primaryField = 'primaryField';
    props.readonlyContextList = [{ key: '1' }];
    render(<CheckboxComponent {...props} />);
    const checkbox1 = screen.getByLabelText('Option 1') as HTMLInputElement;
    fireEvent.click(checkbox1, {
      target: {
        checked: false
      }
    });
    const checkbox2 = screen.getByLabelText('Option 1') as HTMLInputElement;
    fireEvent.click(checkbox2, {
      target: {
        checked: true
      }
    });
    expect(insertInstruction).toHaveBeenCalled();
  });
});
