import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AutoComplete from '../../../../../src/components/field/AutoComplete';
import TextInput from '../../../../../src/components/field/TextInput';
import handleEvent from '../../../../../src/components/helpers/event-utils';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/components/helpers/utils', () => ({
  getDataPage: jest.fn(),
  getOptionList: jest.fn((value) => {
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
          value: '.autoComplete'
        }),
        getValidationApi: () => ({
          validate
        }),
        getContextName() {
          return 'app/primary_1/workarea_1';
        },
        getDataObject() {
          return;
        },
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'AutoComplete',
  required: true,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'autoCompleteTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
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

describe('AutoComplete Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { rerender } = render(<AutoComplete {...props} />);
    expect(screen.getAllByText('AutoComplete')[0]).toHaveClass('Mui-required');

    props.required = false;
    rerender(<AutoComplete {...props} />);
    expect(screen.getAllByText('AutoComplete')[1]).not.toHaveAttribute('Mui-required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { rerender } = render(<AutoComplete {...props} />);
    expect(screen.getByText('AutoComplete')).toHaveClass('Mui-disabled');

    props.disabled = false;
    rerender(<AutoComplete {...props} />);
    expect(screen.getByText('AutoComplete')).not.toHaveClass('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('autoCompleteTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<AutoComplete {...props} />);
    expect(getByTestId('autoCompleteTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getByText } = render(<AutoComplete {...props} />);
    expect(getByText('AutoComplete')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Hi there!';
    const { getByText } = render(<AutoComplete {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Hi there!';
    const { getByText } = render(<AutoComplete {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('autoCompleteTestId'), { target: { value: 'Option 1' } });
    fireEvent.blur(getByTestId('autoCompleteTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByRole, getByText } = render(<AutoComplete {...props} />);
    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Option 1' } });
    fireEvent.click(getByText('Option 1'));
    fireEvent.blur(input);
    expect(handleEvent).toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByRole } = render(<AutoComplete {...props} />);
    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Option 1' } });
    fireEvent.blur(input);
    expect(handleEvent).toHaveBeenCalled();
  });

  test('handles input value changes correctly', () => {
    const props = getDefaultProps();
    const { getByRole, getByText } = render(<AutoComplete {...props} />);
    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Option 1' } });
    expect(getByText('Option 1')).toBeVisible();
  });
});
