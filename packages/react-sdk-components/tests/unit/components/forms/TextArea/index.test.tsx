import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import TextArea from '../../../../../src/components/field/TextArea';
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
          value: '.textArea'
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
  label: 'TextArea',
  required: true,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'textAreaTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
});

describe('TextArea Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    const { getByTestId, rerender } = render(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).toHaveAttribute('required');

    props.required = false;
    rerender(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<TextArea {...props} />);
    expect(getByTestId('textAreaTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getByText } = render(<TextArea {...props} />);
    expect(getByText('TextArea')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Hi there!';
    const { getByText } = render(<TextArea {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Hi there!';
    const { getByText } = render(<TextArea {...props} />);
    expect(getByText('Hi there!')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<TextArea {...props} />);
    fireEvent.change(getByTestId('textAreaTestId'), { target: { value: 'a' } });
    fireEvent.blur(getByTestId('textAreaTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<TextArea {...props} />);
    fireEvent.change(getByTestId('textAreaTestId'), { target: { value: 'a' } });
    fireEvent.blur(getByTestId('textAreaTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
