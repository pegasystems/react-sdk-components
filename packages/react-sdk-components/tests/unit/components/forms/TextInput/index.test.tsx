import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TextInput from '../../../../../src/components/field/TextInput/index';
import handleEvent from '../../../../../src/components/helpers/event-utils';

jest.mock('../../../../../src/components/helpers/event-utils');

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
  label: 'TextInput',
  required: true,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'textInputTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
});

describe('TextInput Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).toHaveAttribute('required');

    props.required = false;
    rerender(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<TextInput {...props} />);
    expect(getByTestId('textInputTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getByText } = render(<TextInput {...props} />);
    expect(getByText('TextInput')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Hi there!';
    const { getByText } = render(<TextInput {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Hi there!';
    const { getByText } = render(<TextInput {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('textInputTestId'), { target: { value: 'a' } });
    fireEvent.blur(getByTestId('textInputTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('textInputTestId'), { target: { value: 'a' } });
    fireEvent.blur(getByTestId('textInputTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
