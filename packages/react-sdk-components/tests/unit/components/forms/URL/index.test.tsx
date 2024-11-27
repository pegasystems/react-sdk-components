import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import URLComponent from '../../../../../src/components/field/URL';
import TextInput from '../../../../../src/components/field/TextInput';
import handleEvent from '../../../../../src/components/helpers/event-utils';

jest.mock('../../../../../src/components/helpers/event-utils');
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
}));

const updateFieldValue = jest.fn();
const triggerFieldChange = jest.fn();
const validate = jest.fn();

const getDefaultProps = () => ({
  getPConnect: jest.fn(
    () =>
      ({
        getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
        getStateProps: () => ({
          value: '.url'
        }),
        getValidationApi: () => ({
          validate
        }),
        getConfigProps: jest.fn(() => ({})),
        getDataObject: jest.fn(() => ({})),
        getCaseInfo: jest.fn(() => ({
          getClassName: jest.fn(() => 'TestClass')
        })),
        getLocalizedValue: jest.fn(value => value),
        getLocaleRuleNameFromKeys: jest.fn(() => 'localeRuleName')
      }) as any
  ),
  label: 'URL Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'urlTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  inline: false,
  onChange: jest.fn()
});

describe('URLComponent', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { getByTestId, rerender } = render(<URLComponent {...props} />);
    expect(getByTestId('urlTestId')).toHaveAttribute('required');

    props.required = false;
    rerender(<URLComponent {...props} />);
    expect(getByTestId('urlTestId')).not.toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<URLComponent {...props} />);
    expect(getByTestId('urlTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<URLComponent {...props} />);
    expect(getByTestId('urlTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('urlTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<URLComponent {...props} />);
    expect(getByTestId('urlTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    render(<URLComponent {...props} />);
    expect(screen.getByLabelText('URL Label')).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'https://example.com';
    render(<URLComponent {...props} />);
    expect(screen.getByText('https://example.com')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'https://example.com';
    render(<URLComponent {...props} />);
    expect(screen.getByText('https://example.com')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    render(<TextInput {...props} />);
    fireEvent.change(screen.getByTestId('urlTestId'), { target: { value: 'https://example.com' } });
    fireEvent.blur(screen.getByTestId('urlTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    render(<URLComponent {...props} />);
    fireEvent.change(screen.getByTestId('urlTestId'), { target: { value: 'https://example.com' } });
    fireEvent.blur(screen.getByTestId('urlTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });
});
