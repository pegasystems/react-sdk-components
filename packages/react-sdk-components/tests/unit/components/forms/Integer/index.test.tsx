import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Integer from '../../../../../src/components/field/Integer';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import TextInput from '../../../../../src/components/field/TextInput';

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
          value: '.integer'
        }),
        getValidationApi: () => ({
          validate
        }),
        getComponentName: () => 'Integer',
        updateDirtyCheckChangeList,
        clearErrorMessages,
        ignoreSuggestion,
        acceptSuggestion
      }) as any
  ),
  label: 'Integer Label',
  required: false,
  disabled: false,
  value: '',
  validatemessage: '',
  status: '',
  readOnly: false,
  testId: 'integerTestId',
  fieldMetadata: {},
  helperText: '',
  displayMode: '',
  hideLabel: false,
  placeholder: '',
  onChange: jest.fn()
});

describe('Integer Component', () => {
  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { getByTestId } = render(<Integer {...props} />);
    expect(getByTestId('integerTestId')).toHaveAttribute('required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.disabled = true;
    const { getByTestId, rerender } = render(<Integer {...props} />);
    expect(getByTestId('integerTestId')).toHaveAttribute('disabled');

    props.disabled = false;
    rerender(<Integer {...props} />);
    expect(getByTestId('integerTestId')).not.toHaveAttribute('disabled');
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId, rerender } = render(<TextInput {...props} />);
    expect(getByTestId('integerTestId')).toHaveAttribute('readonly');

    props.readOnly = false;
    rerender(<Integer {...props} />);
    expect(getByTestId('integerTestId')).not.toHaveAttribute('readonly');
  });

  test('renders with label', () => {
    const props = getDefaultProps();
    const { getAllByText } = render(<Integer {...props} />);
    const labels = getAllByText('Integer Label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]).toBeVisible();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = '1234';
    const { getByText } = render(<Integer {...props} />);
    expect(getByText('1234')).toBeVisible();
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = '1234';
    const { getByText } = render(<Integer {...props} />);
    expect(getByText('1234')).toBeVisible();
  });

  test('does not invoke onBlur handler for readOnly fields', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    const { getByTestId } = render(<TextInput {...props} />);
    fireEvent.change(getByTestId('integerTestId'), { target: { value: '1234' } });
    fireEvent.blur(getByTestId('integerTestId'));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test('invokes handlers for blur and change events', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<Integer {...props} />);
    fireEvent.change(getByTestId('integerTestId'), { target: { value: '1234' } });
    fireEvent.blur(getByTestId('integerTestId'));
    expect(handleEvent).toHaveBeenCalled();
  });

  test('disallows "." and "," characters', () => {
    const props = getDefaultProps();
    const { getByTestId } = render(<Integer {...props} />);
    const input = getByTestId('integerTestId') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1234.' } });
    expect(input.value).toBe('1234');
    fireEvent.change(input, { target: { value: '1234,' } });
    expect(input.value).toBe('1234');
  });
});

// // Integer.test.tsx
// import React from 'react';
// import { render, fireEvent } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import Integer from '../../../../../src/components/field/Integer';
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
//           value: '.integer'
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
//   label: 'Integer Label',
//   required: false,
//   disabled: false,
//   value: '',
//   validatemessage: '',
//   status: '',
//   readOnly: false,
//   testId: 'integerTestId',
//   fieldMetadata: {},
//   helperText: '',
//   displayMode: '',
//   hideLabel: false,
//   placeholder: '',
//   onChange: jest.fn()
// });

// describe('Integer Component', () => {
//   test('renders with required attribute', () => {
//     const props = getDefaultProps();
//     props.required = true;
//     const { getByLabelText } = render(<Integer {...props} />);
//     expect(getByLabelText('Integer Label')).toBeRequired();
//   });

//   test('renders with disabled attribute', () => {
//     const props = getDefaultProps();
//     props.disabled = true;
//     const { getByLabelTex, rerendert } = render(<Integer {...props} />);
//     expect(getByLabelText('Integer Label')).toBeDisabled();

//     props.disabled = false;
//     rerender(<Percentage {...props} />);
//     expect(getByTestId('percentageTestId')).not.toHaveAttribute('disabled');
//   });

//   test('renders with readOnly attribute', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     const { getByLabelText } = render(<Integer {...props} />);
//     expect(getByLabelText('Integer Label')).toHaveAttribute('readonly');
//   });

//   test('renders with label', () => {
//     const { getByLabelText } = render(<Integer {...getDefaultProps()} />);
//     expect(getByLabelText('Integer Label')).toBeInTheDocument();
//   });

//   test('renders in DISPLAY_ONLY mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'DISPLAY_ONLY';
//     props.value = '1234';
//     const { getByText } = render(<Integer {...props} />);
//     expect(getByText('1234')).toBeInTheDocument();
//   });

//   test('renders in STACKED_LARGE_VAL mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'STACKED_LARGE_VAL';
//     props.value = '1234';
//     const { getByText } = render(<Integer {...props} />);
//     expect(getByText('1234')).toBeInTheDocument();
//   });

//   test('invokes handleChange on value change', () => {
//     const props = getDefaultProps();
//     props.value = '1234';
//     const { getByLabelText } = render(<Integer {...props} />);
//     const integerInput = getByLabelText('Integer Label') as HTMLInputElement;
//     fireEvent.change(integerInput, { target: { value: '1235' } });
//     expect(integerInput.value).toBe('1235');
//   });

//   test('does not invoke onBlur handler for readOnly fields', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     const { getByLabelText } = render(<Integer {...props} />);
//     const integerInput = getByLabelText('Integer Label') as HTMLInputElement;
//     fireEvent.blur(integerInput);
//     expect(handleEvent).not.toHaveBeenCalled();
//   });

//   test('invokes handleBlur on blur event', () => {
//     const props = getDefaultProps();
//     const { getByLabelText } = render(<Integer {...props} />);
//     const integerInput = getByLabelText('Integer Label') as HTMLInputElement;
//     fireEvent.blur(integerInput);
//     expect(handleEvent).toHaveBeenCalled();
//   });

//   test('disallows "." and "," characters', () => {
//     const props = getDefaultProps();
//     const { getByLabelText } = render(<Integer {...props} />);
//     const integerInput = getByLabelText('Integer Label') as HTMLInputElement;
//     fireEvent.change(integerInput, { target: { value: '1234.' } });
//     expect(integerInput.value).toBe('1234');
//     fireEvent.change(integerInput, { target: { value: '1234,' } });
//     expect(integerInput.value).toBe('1234');
//   });
// }); // Integer.test.tsx
// // import React from 'react';
// // import { render, fireEvent } from '@testing-library/react';
// // import '@testing-library/jest-dom/extend-expect';
// // import Integer from './Integer';
// // import handleEvent from '../../helpers/event-utils';

// // jest.mock('../../helpers/event-utils');
// // jest.mock('../../../bridge/helpers/sdk_component_map', () => ({
// //   getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
// // }));

// // const updateFieldValue = jest.fn();
// // const triggerFieldChange = jest.fn();
// // const updateDirtyCheckChangeList = jest.fn();
// // const validate = jest.fn();
// // const clearErrorMessages = jest.fn();
// // const [ignoreSuggestion, acceptSuggestion] = [jest.fn(), jest.fn()];

// // const getDefaultProps = () => ({
// //   getPConnect: jest.fn(
// //     () =>
// //       ({
// //         getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
// //         getStateProps: () => ({
// //           value: '.integer'
// //         }),
// //         getValidationApi: () => ({
// //           validate
// //         }),
// //         updateDirtyCheckChangeList,
// //         clearErrorMessages,
// //         ignoreSuggestion,
// //         acceptSuggestion
// //       }) as any
// //   ),
// //   label: 'Integer Label',
// //   required: false,
// //   disabled: false,
// //   value: '',
// //   validatemessage: '',
// //   status: '',
// //   readOnly: false,
// //   testId: 'integerTestId',
// //   fieldMetadata: {},
// //   helperText: '',
// //   displayMode: '',
// //   hideLabel: false,
// //   placeholder: '',
// //   onChange: jest.fn()
// // });

// // describe('Integer Component', () => {
// //   test('renders with required attribute', () => {
// //     const props = getDefaultProps();
// //     props.required = true;
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     expect(getByLabelText('Integer Label')).toBeRequired();
// //   });

// //   test('renders with disabled attribute', () => {
// //     const props = getDefaultProps();
// //     props.disabled = true;
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     expect(getByLabelText('Integer Label')).toBeDisabled();
// //   });

// //   test('renders with readOnly attribute', () => {
// //     const props = getDefaultProps();
// //     props.readOnly = true;
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     expect(getByLabelText('Integer Label')).toHaveAttribute('readonly');
// //   });

// //   test('renders with label', () => {
// //     const { getByLabelText } = render(<Integer {...getDefaultProps()} />);
// //     expect(getByLabelText('Integer Label')).toBeInTheDocument();
// //   });

// //   test('renders in DISPLAY_ONLY mode', () => {
// //     const props = getDefaultProps();
// //     props.displayMode = 'DISPLAY_ONLY';
// //     props.value = '1234';
// //     const { getByText } = render(<Integer {...props} />);
// //     expect(getByText('1234')).toBeInTheDocument();
// //   });

// //   test('renders in STACKED_LARGE_VAL mode', () => {
// //     const props = getDefaultProps();
// //     props.displayMode = 'STACKED_LARGE_VAL';
// //     props.value = '1234';
// //     const { getByText } = render(<Integer {...props} />);
// //     expect(getByText('1234')).toBeInTheDocument();
// //   });

// //   test('invokes handleChange on value change', () => {
// //     const props = getDefaultProps();
// //     props.value = '1234';
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     const integerInput = getByLabelText('Integer Label');
// //     fireEvent.change(integerInput, { target: { value: '1235' } });
// //     expect(integerInput.value).toBe('1235');
// //   });

// //   test('does not invoke onBlur handler for readOnly fields', () => {
// //     const props = getDefaultProps();
// //     props.readOnly = true;
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     const integerInput = getByLabelText('Integer Label');
// //     fireEvent.blur(integerInput);
// //     expect(handleEvent).not.toHaveBeenCalled();
// //   });

// //   test('invokes handleBlur on blur event', () => {
// //     const props = getDefaultProps();
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     const integerInput = getByLabelText('Integer Label');
// //     fireEvent.blur(integerInput);
// //     expect(handleEvent).toHaveBeenCalled();
// //   });

// //   test('disallows "." and "," characters', () => {
// //     const props = getDefaultProps();
// //     const { getByLabelText } = render(<Integer {...props} />);
// //     const integerInput = getByLabelText('Integer Label');
// //     fireEvent.change(integerInput, { target: { value: '1234.' } });
// //     expect(integerInput.value).toBe('1234');
// //     fireEvent.change(integerInput, { target: { value: '1234,' } });
// //     expect(integerInput.value).toBe('1234');
// //   });
// // });
