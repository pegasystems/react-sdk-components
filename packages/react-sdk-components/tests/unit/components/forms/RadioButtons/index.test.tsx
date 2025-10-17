import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RadioButtons from '../../../../../src/components/field/RadioButtons';

const mockHandleEvent = jest.fn();
jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => mockHandleEvent(...args)
}));

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));
jest.mock('../../../../../src/components/helpers/utils', () => ({
  getOptionList: jest.fn(() => [
    { key: 'option1', value: 'Option 1' },
    { key: 'option2', value: 'Option 2' }
  ])
}));

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const validate = jest.fn();
let rawMetaData = {
  config: {
    value: '@P .Radiobuttonpick'
  },
  type: 'RadioButtons'
};
const defaultProps = {
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.radio'
        }),
        getRawMetadata: jest.fn(() => rawMetaData),
        getValidationApi: () => ({
          validate
        }),
        getConfigProps: jest.fn(() => ({})),
        getDataObject: jest.fn(() => ({})),
        getCaseInfo: jest.fn(() => ({
          getClassName: jest.fn(() => 'TestClass')
        })),
        getLocalizedValue: jest.fn((value) => value),
        getLocaleRuleNameFromKeys: jest.fn(() => 'localeRuleName')
      }) as any
  ),
  label: 'Radio Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'radioTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  inline: false,
  onChange: jest.fn()
};

describe('RadioButtons Component', () => {
  test('renders with required attribute', () => {
    const props = { ...defaultProps };
    props.required = true;
    render(<RadioButtons {...props} />);
    expect(screen.getByText('Radio Label')).toBeVisible();
    expect(screen.getByText('Radio Label').closest('legend')).toHaveClass('Mui-required');
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<RadioButtons {...props} />);
    expect(screen.getByLabelText('Option 1')).toBeDisabled();
    expect(screen.getByLabelText('Option 2')).toBeDisabled();
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps };
    props.disabled = true;
    render(<RadioButtons {...props} />);
    expect(screen.getByLabelText('Option 1')).toBeDisabled();
    expect(screen.getByLabelText('Option 2')).toBeDisabled();
  });

  test('renders with label', () => {
    const props = { ...defaultProps };
    render(<RadioButtons {...props} />);
    expect(screen.getByText('Radio Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Option 1';
    render(<RadioButtons {...props} />);
    expect(screen.getByText('Option 1')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps };
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Option 1';
    render(<RadioButtons {...props} />);
    expect(screen.getByText('Option 1')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = { ...defaultProps };
    props.readOnly = true;
    render(<RadioButtons {...props} />);
    fireEvent.change(screen.getByLabelText('Option 1'), { target: { value: 'Option 1' } });
    fireEvent.blur(screen.getByLabelText('Option 1'));
    expect(mockHandleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = { ...defaultProps };
    render(<RadioButtons {...props} />);
    const radioButtons = screen.getByLabelText('Option 1') as HTMLInputElement;
    fireEvent.click(radioButtons, {
      target: {
        value: 'Option 1'
      }
    });
    expect(radioButtons.value).toBe('option1');
    expect(mockHandleEvent).toHaveBeenCalled();
  });
});
