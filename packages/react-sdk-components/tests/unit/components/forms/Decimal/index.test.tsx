import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Decimal from '../../../../../src/components/field/Decimal/index';
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
          value: '.decimal'
        }),
        getValidationApi: () => ({
          validate
        }),
        getComponentName: () => 'Decimal',
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Decimal Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'decimalTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  currencyISOCode: 'USD',
  decimalPrecision: 2,
  showGroupSeparators: true,
  formatter: '',
  onChange: jest.fn()
});

describe('Decimal Component', () => {
  console.log('PCore', window.PCore.getEnvironmentInfo().getUseLocale());
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { getByTestId } = render(<Decimal {...props} />);
    expect(getByTestId('decimalTestId')).toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<Decimal {...props} />);
    expect(getByTestId('decimalTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Decimal {...props} />);
    expect(getByTestId('decimalTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<Decimal {...props} />);
    expect(getByTestId('decimalTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Decimal {...props} />);
    expect(getByTestId('decimalTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getAllByText } = render(<Decimal {...props} />);
    const labels = getAllByText('Decimal Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '1234.56';
    const { getByText } = render(<Decimal {...props} />);
    expect(getByText('1,234.56')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '1234.56';
    const { getByText } = render(<Decimal {...props} />);
    expect(getByText('1,234.56')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<Decimal {...props} />);
    fireEvent.change(getByTestId('decimalTestId'), { target: { value: '1234.56' } });
    fireEvent.blur(getByTestId('decimalTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<Decimal {...props} />);
    fireEvent.change(getByTestId('decimalTestId'), { target: { value: '1234.56' } });
    fireEvent.blur(getByTestId('decimalTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
