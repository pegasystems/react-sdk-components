// import React from 'react';
// import { render, fireEvent, screen } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import CheckboxComponent from '../../../../../src/components/field/Checkbox';
// import handleEvent from '../../../../../src/components/helpers/event-utils';

// import { insertInstruction, deleteInstruction, updateNewInstuctions } from '../../../../../src/components/helpers/instructions-utils';

// jest.mock('../../../../../src/components/helpers/event-utils');
// jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
//   getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
// }));
// jest.mock('../../../../../src/components/helpers/instructions-utils', () => ({
//   insertInstruction: jest.fn(),
//   deleteInstruction: jest.fn(),
//   updateNewInstuctions: jest.fn()
// }));

// const updateFieldValue = jest.fn();
// const triggerFieldChange = jest.fn();
// const validate = jest.fn();
// const clearErrorMessages = jest.fn();

// const getDefaultProps = () => ({
//   getPConnect: jest.fn(
//     () =>
//       ({
//         getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
//         getStateProps: () => ({
//           value: '.checkbox'
//         }),
//         getValidationApi: () => ({
//           validate
//         }),
//         clearErrorMessages
//       }) as any
//   ),
//   label: 'Checkbox Label',
//   caption: 'Checkbox Caption',
//   required: false,
//   disabled: false,
//   value: false,
//   validatemessage: '',
//   status: '',
//   readOnly: false,
//   testId: 'checkboxTestId',
//   fieldMetadata: {},
//   helperText: '',
//   displayMode: '',
//   hideLabel: false,
//   trueLabel: 'True',
//   falseLabel: 'False',
//   selectionMode: '',
//   datasource: {},
//   selectionKey: '',
//   selectionList: '',
//   primaryField: '',
//   referenceList: '',
//   readonlyContextList: [{ key: '' }],
//   onChange: jest.fn()
// });

// describe('CheckboxComponent', () => {
//   test('renders with required attribute', () => {
//     const props = getDefaultProps();
//     props.required = true;
//     const { rerender } = render(<CheckboxComponent {...props} />);
//     expect(screen.getByText('Checkbox Label')).toBeVisible();
//     expect(screen.getByText('Checkbox Label').closest('legend')).toHaveClass('Mui-required');

//     props.required = false;
//     rerender(<CheckboxComponent {...props} />);
//     expect(screen.getByText('Checkbox Label').closest('legend')).not.toHaveClass('Mui-required');
//   });

//   test('renders with disabled attribute', () => {
//     const props = getDefaultProps();
//     props.disabled = true;
//     render(<CheckboxComponent {...props} />);
//     expect(screen.getByLabelText('Checkbox Caption')).toBeDisabled();
//   });

//   test('renders with readOnly attribute', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     render(<CheckboxComponent {...props} />);
//     expect(screen.getByLabelText('Checkbox Caption')).toHaveAttribute('readonly');
//   });

//   test('renders with label', () => {
//     const props = getDefaultProps();
//     render(<CheckboxComponent {...props} />);
//     expect(screen.getByText('Checkbox Label')).toBeVisible();
//   });

//   test('renders in DISPLAY_ONLY mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'DISPLAY_ONLY';
//     props.value = true;
//     render(<CheckboxComponent {...props} />);
//     expect(screen.getByText('True')).toBeVisible();
//   });

//   test('renders in STACKED_LARGE_VAL mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'STACKED_LARGE_VAL';
//     props.value = true;
//     render(<CheckboxComponent {...props} />);
//     expect(screen.getByText('True')).toBeVisible();
//   });

//   test('does not invoke onBlur handler for readOnly fields', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     render(<CheckboxComponent {...props} />);
//     fireEvent.change(screen.getByTestId('checkboxTestId'), { target: { checked: true } });
//     fireEvent.blur(screen.getByTestId('checkboxTestId'));
//     expect(handleEvent).not.toHaveBeenCalled();
//   });

//   test('invokes handlers for blur and change events', () => {
//     const props = getDefaultProps();
//     render(<CheckboxComponent {...props} />);

//     const checkbox = screen.getByLabelText('Checkbox Caption') as HTMLInputElement;
//     fireEvent.click(checkbox, {
//       target: {
//         checked: true
//       }
//     });
//     expect(handleEvent).toHaveBeenCalled();
//   });

//   test('renders multiple checkboxes in multi-selection mode', () => {
//     const props = getDefaultProps();
//     props.selectionMode = 'multi';
//     props.datasource = {
//       source: [
//         { key: '1', value: 'Option 1' },
//         { key: '2', value: 'Option 2' },
//         { key: '3', value: 'Option 3' },
//         { key: '4', value: 'Option 4' }
//       ]
//     };
//     props.selectionKey = 'selection.key';
//     props.selectionList = 'selectionList';
//     props.primaryField = 'primaryField';
//     props.readonlyContextList = [{ key: '1' }];
//     const { getByLabelText } = render(<CheckboxComponent {...props} />);
//     expect(getByLabelText('Option 1').closest('span')).toHaveClass('Mui-checked');
//   });

//   test('invokes handlers for multi-selection mode', () => {
//     const props = getDefaultProps();
//     props.selectionMode = 'multi';
//     props.datasource = {
//       source: [
//         { key: '1', value: 'Option 1' },
//         { key: '2', value: 'Option 2' }
//       ]
//     };
//     props.selectionKey = 'selection.key';
//     props.selectionList = 'selectionList';
//     props.primaryField = 'primaryField';
//     props.readonlyContextList = [{ key: '1' }];
//     render(<CheckboxComponent {...props} />);
//     const checkbox1 = screen.getByLabelText('Option 1') as HTMLInputElement;
//     fireEvent.click(checkbox1, {
//       target: {
//         checked: false
//       }
//     });
//     const checkbox2 = screen.getByLabelText('Option 1') as HTMLInputElement;
//     fireEvent.click(checkbox2, {
//       target: {
//         checked: true
//       }
//     });
//     expect(insertInstruction).toHaveBeenCalled();
//   });
// });

import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import CheckboxComponent from '../../../../../src/components/field/Checkbox';

const handleEvent = jest.fn();
const validate = jest.fn();
const clearErrorMessages = jest.fn();
const insertInstruction = jest.fn();
const deleteInstruction = jest.fn();
const updateNewInstuctions = jest.fn();

jest.mock('../../../../../src/components/helpers/event-utils', () => ({
  __esModule: true,
  default: (...args) => handleEvent(...args)
}));

jest.mock('../../../../../src/components/helpers/instructions-utils', () => ({
  __esModule: true,
  insertInstruction: (...args) => insertInstruction(...args),
  deleteInstruction: (...args) => deleteInstruction(...args),
  updateNewInstuctions: (...args) => updateNewInstuctions(...args)
}));

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  __esModule: true,
  getComponentFromMap: name => {
    if (name === 'SelectableCard') {
      return props => (
        <div data-test-id={`selectable-card-${props.testId}`}>
          <button
            data-test-id={`card-option-${props.testId}-opt1`}
            id='opt1'
            onClick={e => {
              props.onChange({
                target: { id: 'opt1', checked: true },
                stopPropagation: () => {}
              });
              props.onBlur(); // ✅ simulate blur after selection
            }}
          >
            Option 1
          </button>
        </div>
      );
    }
    if (name === 'FieldValueList') {
      return require('../FieldValueList').default;
    }
    // if (name === 'FieldValueList') {
    //   return ({ name, value, variant }) => <div data-test-id={`field-value-${variant ?? 'default'}`}>{`${name}: ${value}`}</div>;
    // }
    return null;
  }
}));

const getPConnect = jest.fn(
  () =>
    ({
      getActionsApi: () => ({}),
      getStateProps: () => ({ value: '.checkbox' }),
      getValidationApi: () => ({ validate }),
      clearErrorMessages,
      setReferenceList: jest.fn(),
      getRawMetadata: () => ({ config: { imageDescription: 'data.description' } })
    }) as any
);

const getDefaultProps = () => ({
  getPConnect,
  label: 'Checkbox Label',
  caption: 'Checkbox Caption',
  value: true,
  readOnly: false,
  testId: 'checkboxTestId',
  required: true,
  disabled: false,
  status: '',
  helperText: 'Checkbox helper text',
  validatemessage: '',
  displayMode: '',
  hideLabel: false,
  trueLabel: 'Yes',
  falseLabel: 'No',
  selectionMode: '',
  datasource: {
    source: [{ key: 'opt1', value: 'Option 1', text: 'Option 1' }]
  },
  selectionKey: 'data.key',
  selectionList: 'selectionList',
  primaryField: 'data.text',
  referenceList: '',
  readonlyContextList: [{ key: '' }],
  variant: '',
  hideFieldLabels: false,
  additionalProps: {},
  imagePosition: 'left',
  imageSize: 'medium',
  showImageDescription: 'true',
  renderMode: '',
  image: 'data.image',
  onChange: jest.fn()
});

describe('CheckboxComponent', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test('renders with label and helper text', () => {
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeInTheDocument();
    expect(screen.getByText('Checkbox helper text')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    const { rerender } = render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeVisible();
    expect(screen.getByText('Checkbox Label').closest('legend')).toHaveClass('Mui-required');

    props.required = false;
    rerender(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label').closest('legend')).not.toHaveClass('Mui-required');
  });

  test('renders with disabled attribute', () => {
    const props = getDefaultProps();
    props.required = true;
    props.disabled = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('renders with readOnly attribute', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('readonly');
  });

  test('renders with validation message overriding helper text', () => {
    const props = getDefaultProps();
    props.validatemessage = 'Validation error';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Validation error')).toBeVisible();
    expect(screen.queryByText('Checkbox helper text')).not.toBeInTheDocument();
  });

  test('calls handleEvent on change when not readOnly', () => {
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleEvent).toHaveBeenCalledWith(expect.any(Object), 'changeNblur', '.checkbox', false);
  });

  test('calls validate on blur when not readOnly', () => {
    const props = getDefaultProps();
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.blur(checkbox);
    expect(validate).toHaveBeenCalledWith(true);
  });

  test('does not call handleEvent or validate when readOnly', () => {
    const props = getDefaultProps();
    props.readOnly = true;
    render(<CheckboxComponent {...props} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.blur(checkbox);
    expect(handleEvent).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
  });

  test('renders in DISPLAY_ONLY mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = true;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId('field-value-list')).toHaveTextContent('Checkbox CaptionYes');
  });

  test('renders in STACKED_LARGE_VAL mode', () => {
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = false;
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId('field-value-list')).toHaveTextContent('Checkbox CaptionNo');
  });

  test('renders multi-selection checkboxes and handles selection', () => {
    const props = getDefaultProps();
    props.selectionMode = 'multi';
    props.datasource = {
      source: [
        { key: 'opt1', value: 'Option 1', text: 'Option 1' },
        { key: 'opt2', value: 'Option 2', text: 'Option 2' }
      ]
    };
    props.readonlyContextList = [{ key: 'opt1' }];
    const { getByLabelText } = render(<CheckboxComponent {...props} />);
    const checkbox1 = screen.getByTestId('checkboxTestId:Option 1');
    const checkbox2 = screen.getByTestId('checkboxTestId:Option 2');
    expect(getByLabelText('Option 1').closest('input')).toBeChecked();
    expect(checkbox2).not.toBeChecked();

    fireEvent.click(checkbox2);
    expect(insertInstruction).toHaveBeenCalled();
    fireEvent.click(checkbox1);
    expect(deleteInstruction).toHaveBeenCalled();
  });

  // Card variant tests
  test('renders SelectableCard when variant is card', () => {
    const props = getDefaultProps();
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByTestId(`selectable-card-${props.testId}`)).toBeInTheDocument();
  });

  test('handles card option selection', () => {
    const props = getDefaultProps();
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    const cardOption = screen.getByTestId(`card-option-${props.testId}-opt1`);
    fireEvent.click(cardOption);
    expect(insertInstruction).toHaveBeenCalledWith(expect.any(Object), props.selectionList, props.selectionKey, props.primaryField, {
      id: 'opt1',
      primary: 'opt1'
    });
  });

  test('validates on blur in card variant', () => {
    const props = getDefaultProps();
    props.variant = 'card';
    props.readonlyContextList = []; // ✅ ensure this is defined
    render(<CheckboxComponent {...props} />);
    const cardOption = screen.getByTestId(`card-option-${props.testId}-opt1`);
    fireEvent.click(cardOption);
    expect(validate).toHaveBeenCalledWith([], props.selectionList);
  });

  test('renders label in card variant', () => {
    const props = getDefaultProps();
    props.variant = 'card';
    render(<CheckboxComponent {...props} />);
    expect(screen.getByText('Checkbox Label')).toBeInTheDocument();
  });
});
