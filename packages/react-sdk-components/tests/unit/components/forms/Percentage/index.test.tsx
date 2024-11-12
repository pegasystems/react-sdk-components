import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Percentage from '../../../../../src/components/field/Percentage';
import handleEvent from '../../../../../src/components/helpers/event-utils';

declare global {
  interface Window {
    PCore: any;
  }
}

window.PCore = {
  ...window.PCore,
  getEnvironmentInfo: (): any => {
    return {
      getUseLocale: () => {
        return 'en-US';
      },
      getLocale: () => {
        return 'en-US';
      }
    };
  }
};

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
          value: '.percentage'
        }),
        getValidationApi: () => ({
          validate
        }),
        getComponentName: () => 'Percentage',
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Percentage Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'percentageTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
});

describe('Percentage Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { getByTestId } = render(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Percentage {...props} />);
    expect(getByTestId('percentageTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getAllByText } = render(<Percentage {...props} />);
    const labels = getAllByText('Percentage Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '50';
    const { getByText } = render(<Percentage {...props} />);
    expect(getByText('50.00%')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '50';
    const { getByText } = render(<Percentage {...props} />);
    expect(getByText('50.00%')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<Percentage {...props} />);
    fireEvent.change(getByTestId('percentageTestId'), { target: { value: '50' } });
    fireEvent.blur(getByTestId('percentageTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<Percentage {...props} />);
    fireEvent.change(getByTestId('percentageTestId'), { target: { value: '50' } });
    fireEvent.blur(getByTestId('percentageTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
