import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Phone from '../../../../../src/components/field/Phone';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import MuiPhoneNumber from 'material-ui-phone-number';

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
          value: '.phone'
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
  label: 'Phone Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'phoneTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
});
// const testIds = Phone.getTestIds(getDefaultProps().testId);
// Removed the call to getTestIds as it does not exist on MuiPhoneNumber

describe('Phone Component', () => {
  test('renders with required attribute', () => {
    // const props = getDefaultProps();
    // props.required = true;
    // const { getByTestId } = render(<Phone {...props} />);
    // screen.getByTestId('phone-number-input').GET
    // expect(getByTestId('phoneTestId')).toHaveAttribute('required');

    const props = getDefaultProps();
    props.required = true;
    const { rerender } = render(<Phone {...props} />);
    expect(screen.getByTestId('phoneTestId')).toHaveAttribute('required');
    // props.required = false;
    // rerender(<Phone {...props} />);
    // expect(screen.getByTestId(testIds.control)).not.toHaveAttribute('required');
  });

  // test('renders with disabled attribute', () => {
  //   const props = getDefaultProps();
  //   props.disabled = true;
  //   const { getByTestId, rerender } = render(<Phone {...props} />);
  //   expect(getByTestId('phoneTestId')).toHaveAttribute('disabled');

  //   props.disabled = false;
  //   rerender(<Phone {...props} />);
  //   expect(getByTestId('phoneTestId')).not.toHaveAttribute('disabled');
  // });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { rerender } = render(<Phone {...props} />);
    expect(screen.getByTestId('phoneTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Phone {...props} />);
    expect(screen.getByTestId('phoneTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<Phone {...props} />);
    expect(getByTestId('phoneTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Phone {...props} />);
    expect(getByTestId('phoneTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getAllByText } = render(<Phone {...props} />);
    const labels = getAllByText('Phone Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '+1234567890';
    const { getByText } = render(<Phone {...props} />);
    expect(getByText('+1234567890')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '+1234567890';
    const { getByText } = render(<Phone {...props} />);
    expect(getByText('+1234567890')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<Phone {...props} />);
    fireEvent.change(getByTestId('phoneTestId'), { target: { value: '+1234567890' } });
    fireEvent.blur(getByTestId('phoneTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<Phone {...props} />);
    fireEvent.change(getByTestId('phoneTestId'), { target: { value: '+1234567890' } });
    fireEvent.blur(getByTestId('phoneTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
