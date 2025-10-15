import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Currency from '../../../../../src/components/field/Currency';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import { getLocale } from '../../../../../src/components/helpers/formatters/common';

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
        return 'en-GB';
      },
      getLocale: () => {
        return 'en-GB';
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
const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.currency'
        }),
        getValidationApi: () => ({
          validate
        }),
        getComponentName: () => 'Currency',
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Currency Label',
  required: true,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'currencyTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  currencyISOCode: 'USD',
  allowDecimals: true,
  onChange: jest.fn(),
  formatter: ''
};

describe('Currency Component', () => {
  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    const { getByTestId, rerender } = render(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).toHaveAttribute('required');

    props.required = false;
    rerender(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    const { getByTestId, rerender } = render(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId, rerender } = render(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Currency {...props} />);
    expect(getByTestId('currencyTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    const { getByText } = render(<Currency {...props} />);
    expect(getByText('Currency Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '1000';
    const { getByText } = render(<Currency {...props} />);
    expect(getByText('$1,000.00')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '1000';
    const { getByText } = render(<Currency {...props} />);
    expect(getByText('$1,000.00')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    const { getByTestId } = render(<Currency {...props} />);
    fireEvent.change(getByTestId('currencyTestId'), { target: { value: '1000' } });
    fireEvent.blur(getByTestId('currencyTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    const { getByTestId } = render(<Currency {...props} />);
    fireEvent.change(getByTestId('currencyTestId'), { target: { value: '1000' } });
    fireEvent.blur(getByTestId('currencyTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
