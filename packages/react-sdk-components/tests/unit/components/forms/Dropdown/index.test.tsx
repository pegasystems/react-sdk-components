import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Dropdown from '../../../../../src/components/field/Dropdown';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import TextInput from '../../../../../src/components/field/TextInput';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/components/helpers/utils', () => ({
  getDataPage: jest.fn(),
  getOptionList: jest.fn(value => {
    return value.datasource;
  })
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

const getDefaultProps = () => ({
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.dropdown'
        }),
        getValidationApi: () => ({
          validate
        }),
        getContextName() {
          return 'app/primary_1/workarea_1';
        },
        getCaseInfo() {
          return {
            getClassName() {
              return 'DIXL-MediaCo-Work-NewService';
            }
          };
        },
        getDataObject() {
          return;
        },
        // getCaseInfo: () => ({ getClassName: () => 'Work-' }),
        getLocaleRuleNameFromKeys: (className, contextName, ruleName) => `${className}!${contextName}!${ruleName}`,
        getLocalizedValue: value => value,
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Dropdown Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'dropdownTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: 'Select',
  onChange: jest.fn(),
  listType: 'associated',
  columns: [],
  datasource: [
    { key: 'option1', value: 'Option 1' },
    { key: 'option2', value: 'Option 2' },
    { key: 'option3', value: 'Option 3' },
    { key: 'option4', value: 'Option 4' }
  ]
});

describe('Dropdown Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { rerender } = render(<Dropdown {...props} />);
    expect(screen.getAllByText('Dropdown Label')[0]).toHaveClass('Mui-required');

    props.required = false;
    rerender(<Dropdown {...props} />);
    expect(screen.getAllByText('Dropdown Label')[1]).not.toHaveClass('Mui-required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { rerender } = render(<Dropdown {...props} />);
    expect(screen.getAllByText('Dropdown Label')[0]).toHaveClass('Mui-disabled');

    props.disabled = false;
    rerender(<Dropdown {...props} />);
    expect(screen.getAllByText('Dropdown Label')[1]).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('dropdownTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Dropdown {...props} />);
    expect(getByTestId('dropdownTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getAllByText } = render(<Dropdown {...props} />);
    const labels = getAllByText('Dropdown Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Option 1';
    const { getByText } = render(<Dropdown {...props} />);
    expect(getByText('Option 1')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Option 1';
    const { getByText } = render(<Dropdown {...props} />);
    expect(getByText('Option 1')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('dropdownTestId'), { target: { value: 'Option 1' } });
    fireEvent.blur(getByTestId('dropdownTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByRole, getByText } = render(<Dropdown {...props} />);
    const input = getByRole('combobox');
    fireEvent.mouseDown(input);
    fireEvent.click(getByText('Option 1'));
    fireEvent.blur(input);
    expect(handleEvent).toHaveBeenCalled();
  });
});
