// import React from 'react';
// import { render, fireEvent, screen } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import Phone from '../../../../../src/components/field/Phone';
// import handleEvent from '../../../../../src/components/helpers/event-utils';

// jest.mock('../../../../../src/components/helpers/event-utils');
// jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
//   getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
// }));

// const updateFieldValue = jest.fn();
// const triggerFieldChange = jest.fn();
// const updateDirtyCheckChangeList = jest.fn();
// const validate = jest.fn();
// const clearErrorMessages = jest.fn();
// const [ignoreSuggestion, acceptSuggestion] = [jest.fn(), jest.fn()];

// const getDefaultProps = () => ({
//   getPConnect: jest.fn(
//     () =>
//       ({
//         getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
//         getStateProps: () => ({
//           value: '.phone'
//         }),
//         getValidationApi: () => ({
//           validate
//         }),
//         updateDirtyCheckChangeList,
//         clearErrorMessages,
//         ignoreSuggestion,
//         acceptSuggestion
//       }) as any
//   ),
//   label: 'Phone Label',
//   required: false,
//   disabled: false,
//   value: '',
//   validatemessage: '',
//   status: '',
//   readOnly: false,
//   testId: 'phoneTestId',
//   fieldMetadata: {},
//   helperText: '',
//   displayMode: '',
//   hideLabel: false,
//   placeholder: 'phone number',
//   onChange: jest.fn()
// });
// // const testIds = Phone.getTestIds(getDefaultProps().testId);
// // Removed the call to getTestIds as it does not exist on MuiPhoneNumber

// describe('Phone Component', () => {
//   test('renders with required attribute', () => {
//     const props = getDefaultProps();
//     props.required = true;
//     const { rerender } = render(<Phone {...props} />);
//     expect(screen.getByPlaceholderText('phone number')).toHaveAttribute('required');

//     props.required = false;
//     rerender(<Phone {...props} />);
//     expect(screen.getByPlaceholderText('phone number')).not.toHaveAttribute('required');
//   });

//   // test('renders with disabled attribute', () => {
//   //   const props = getDefaultProps();
//   //   props.disabled = true;
//   //   const { getByTestId, rerender } = render(<Phone {...props} />);
//   //   expect(getByTestId('phoneTestId')).toHaveAttribute('disabled');

//   //   props.disabled = false;
//   //   rerender(<Phone {...props} />);
//   //   expect(getByTestId('phoneTestId')).not.toHaveAttribute('disabled');
//   // });

//   test('renders with disabled attribute', () => {
//     const props = getDefaultProps();
//     props.disabled = true;
//     const { rerender } = render(<Phone {...props} />);
//     expect(screen.getByPlaceholderText('phone number')).toHaveAttribute('disabled');

//     props.disabled = false;
//     rerender(<Phone {...props} />);
//     expect(screen.getByPlaceholderText('phone number')).not.toHaveAttribute('disabled');
//   });

//   test('renders with readOnly attribute', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     const { getByTestId, rerender } = render(<Phone {...props} />);
//     expect(getByTestId('phoneTestId')).toHaveAttribute('readonly');

//     props.readOnly = false;
//     rerender(<Phone {...props} />);
//     expect(getByTestId('phoneTestId')).not.toHaveAttribute('readonly');
//   });

//   test('renders with label', () => {
//     const props = getDefaultProps();
//     const { getAllByText } = render(<Phone {...props} />);
//     const labels = getAllByText('Phone Label');
//     expect(labels.length).toBeGreaterThan(0);
//     expect(labels[0]).toBeVisible();
//   });

//   test('renders in DISPLAY_ONLY mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'DISPLAY_ONLY';
//     props.value = '+1234567890';
//     const { getByText } = render(<Phone {...props} />);
//     expect(getByText('+1234567890')).toBeVisible();
//   });

//   test('renders in STACKED_LARGE_VAL mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'STACKED_LARGE_VAL';
//     props.value = '+1234567890';
//     const { getByText } = render(<Phone {...props} />);
//     expect(getByText('+1234567890')).toBeVisible();
//   });

//   test('does not invoke onBlur handler for readOnly fields', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     const { getByTestId, getByPlaceholderText } = render(<Phone {...props} />);
//     fireEvent.change(getByPlaceholderText('phone number'), { target: { value: '+1234567890' } });
//     fireEvent.blur(getByPlaceholderText('phone number'));
//     expect(handleEvent).not.toHaveBeenCalled();
//   });

//   test('invokes handlers for blur and change events', () => {
//     const props = getDefaultProps();
//     const { getByTestId, getByPlaceholderText } = render(<Phone {...props} />);
//     fireEvent.change(getByPlaceholderText('phone number'), { target: { value: '+1234567890' } });
//     fireEvent.blur(getByPlaceholderText('phone number'));
//     expect(handleEvent).toHaveBeenCalled();
//   });
// });

// # Unit test suite for the Phone component

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Phone from '../../../../../src/components/field/Phone';

const mockHandleEvent = jest.fn();
jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => mockHandleEvent(...args)
}));

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(name => {
    if (name === 'FieldValueList') {
      return require('../FieldValueList').default;
    }
    return null;
  })
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
          value: '.phoneInput'
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
  label: 'Phone Number',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'phoneInputTestId',
  helperText: 'Enter phone number',
  displayMode: '',
  hideLabel: false,
  placeholder: 'Enter phone',
  onChange: jest.fn()
};

describe('Phone Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders with label and placeholder', () => {
    render(<Phone {...defaultProps} />);
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter phone')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    const props = { ...defaultProps, required: true };
    const { rerender } = render(<Phone {...props} />);
    const input = screen.getByTestId('phoneInputTestId');
    expect(input).toBeRequired();

    props.required = false;
    rerender(<Phone {...props} />);
    expect(input).not.toBeRequired();
  });

  test('renders with disabled attribute', () => {
    const props = { ...defaultProps, disabled: true };
    const { rerender } = render(<Phone {...props} />);
    const input = screen.getByTestId('phoneInputTestId');
    expect(input).toBeDisabled();

    props.disabled = false;
    rerender(<Phone {...props} />);
    expect(input).not.toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = { ...defaultProps, readOnly: true };
    render(<Phone {...props} />);
    const input = screen.getByTestId('phoneInputTestId');
    expect(input).toHaveAttribute('readonly');
  });

  test('renders with helper text', () => {
    render(<Phone {...defaultProps} />);
    expect(screen.getByText('Enter phone number')).toBeInTheDocument();
  });

  test('renders with validation message overriding helper text', () => {
    const props = { ...defaultProps, validatemessage: 'Invalid phone' };
    render(<Phone {...props} />);
    expect(screen.getByText('Invalid phone')).toBeInTheDocument();
    expect(screen.queryByText('Enter phone number')).not.toBeInTheDocument();
  });

  test('updates value on change', () => {
    render(<Phone {...defaultProps} />);
    const input = screen.getByTestId('phoneInputTestId');
    fireEvent.change(input, { target: { value: '+1 555-123-4567' } });
    expect(input).toHaveValue('+1 555-123-4567');
  });

  test('calls handleEvent on blur when not readOnly', () => {
    render(<Phone {...defaultProps} />);
    const input = screen.getByTestId('phoneInputTestId');
    fireEvent.change(input, { target: { value: '+1 555-123-4567' } });
    fireEvent.blur(input);
    expect(mockHandleEvent).toHaveBeenCalledWith(expect.any(Object), 'changeNblur', '.phoneInput', expect.stringContaining('+15551234567'));
  });

  test('does not call handleEvent on blur when readOnly', () => {
    const props = { ...defaultProps, readOnly: true };
    render(<Phone {...props} />);
    const input = screen.getByTestId('phoneInputTestId');
    fireEvent.blur(input);
    expect(mockHandleEvent).not.toHaveBeenCalled();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = { ...defaultProps, displayMode: 'DISPLAY_ONLY', value: '+1 555-123-4567' };
    render(<Phone {...props} />);
    expect(screen.getByText('+1 555-123-4567')).toBeInTheDocument();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = { ...defaultProps, displayMode: 'STACKED_LARGE_VAL', value: '+1 555-123-4567' };
    render(<Phone {...props} />);
    expect(screen.getByText('+1 555-123-4567')).toBeInTheDocument();
  });
});
