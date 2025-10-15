import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Email from '../../../../../src/components/field/Email/index';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import TextInput from '../../../../../src/components/field/TextInput';

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

const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.email'
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
  label: 'Email Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'emailTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
};

describe('Email Component', () => {
  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    const { getByTestId } = render(<Email {...props} />);
    expect(getByTestId('emailTestId')).toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    const { getByTestId, rerender } = render(<Email {...props} />);
    expect(getByTestId('emailTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Email {...props} />);
    expect(getByTestId('emailTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('emailTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Email {...props} />);
    expect(getByTestId('emailTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    const { getAllByText } = render(<Email {...props} />);
    const labels = getAllByText('Email Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'test@example.com';
    const { getByText } = render(<Email {...props} />);
    expect(getByText('test@example.com')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'test@example.com';
    const { getByText } = render(<Email {...props} />);
    expect(getByText('test@example.com')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('emailTestId'), { target: { value: 'test@example.com' } });
    fireEvent.blur(getByTestId('emailTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    const { getByTestId } = render(<Email {...props} />);
    fireEvent.change(getByTestId('emailTestId'), { target: { value: 'test@example.com' } });
    fireEvent.blur(getByTestId('emailTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
