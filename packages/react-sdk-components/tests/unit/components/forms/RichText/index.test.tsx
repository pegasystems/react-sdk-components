// import React from 'react';
// import { render, fireEvent, screen } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import RichText from '../../../../../src/components/field/RichText';
// import handleEvent from '../../../../../src/components/helpers/event-utils';
// import RichTextEditor from '../../../../../src/components/designSystemExtension/RichTextEditor';

// const updateFieldValue = jest.fn();
// const triggerFieldChange = jest.fn();
// const validate = jest.fn();

// const getDefaultProps = () => ({
//   getPConnect: jest.fn(
//     () =>
//       ({
//         getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
//         getStateProps: () => ({
//           value: '.richText'
//         }),
//         getValidationApi: () => ({
//           validate
//         }),
//         getConfigProps: jest.fn(() => ({})),
//         getDataObject: jest.fn(() => ({})),
//         getCaseInfo: jest.fn(() => ({
//           getClassName: jest.fn(() => 'TestClass')
//         })),
//         getLocalizedValue: jest.fn(value => value),
//         getLocaleRuleNameFromKeys: jest.fn(() => 'localeRuleName')
//       }) as any
//   ),
//   label: 'RichText Label',
//   required: false,
//   disabled: false,
//   value: '',
//   validatemessage: '',
//   status: '',
//   readOnly: false,
//   testId: 'richTextTestId',
//   fieldMetadata: {},
//   helperText: '',
//   displayMode: '',
//   hideLabel: false,
//   placeholder: '',
//   additionalProps: {},
//   onChange: jest.fn()
// });

// jest.mock('../../../../../src/components/helpers/event-utils');
// jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
//   getComponentFromMap: jest.fn(componentName => {
//     switch (componentName) {
//       case 'FieldValueList':
//         return require('../FieldValueList').default;
//       case 'RichTextEditor':
//         // return React.forwardRef((props: { testId: string; label: string }, ref) => (
//         //   <div ref={ref as React.RefObject<HTMLDivElement>} data-testid={props.testId}>
//         //     {props.label}
//         //   </div>
//         // ));
//         const props = getDefaultProps();
//         return (
//           <RichTextEditor
//             {...props}
//             defaultValue={props.value}
//             labelHidden={props.hideLabel}
//             info={props.helperText}
//             error={false}
//             onBlur={jest.fn()}
//           />
//         );
//       default:
//         return null;
//     }
//   })
// }));

// describe('RichText Component', () => {
//   test('renders with required attribute', () => {
//     const props = getDefaultProps();
//     props.required = true;
//     render(<RichText {...props} />);
//     expect(screen.getByText('RichText Label')).toBeVisible();
//     expect(screen.getByTestId('richTextTestId').closest('label')).toHaveClass('Mui-required');
//   });

//   test('renders with disabled attribute', () => {
//     const props = getDefaultProps();
//     props.disabled = true;
//     render(<RichText {...props} />);
//     expect(screen.getByTestId('richTextTestId')).toBeDisabled();
//   });

//   test('renders with readOnly attribute', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     render(<RichText {...props} />);
//     expect(screen.getByTestId('richTextTestId')).toHaveAttribute('readonly');
//   });

//   test('renders with label', () => {
//     const props = getDefaultProps();
//     render(<RichText {...props} />);
//     expect(screen.getByLabelText('RichText Label')).toBeVisible();
//   });

//   test('renders in DISPLAY_ONLY mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'DISPLAY_ONLY';
//     props.value = '<p>Rich text content</p>';
//     render(<RichText {...props} />);
//     expect(screen.getByText('Rich text content')).toBeVisible();
//   });

//   test('renders in STACKED_LARGE_VAL mode', () => {
//     const props = getDefaultProps();
//     props.displayMode = 'STACKED_LARGE_VAL';
//     props.value = '<p>Rich text content</p>';
//     render(<RichText {...props} />);
//     expect(screen.getByText('Rich text content')).toBeVisible();
//   });

//   test('does not invoke onBlur handler for readOnly fields', () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     render(<RichText {...props} />);
//     fireEvent.change(screen.getByTestId('richTextTestId'), { target: { value: '<p>Rich text content</p>' } });
//     fireEvent.blur(screen.getByTestId('richTextTestId'));
//     expect(handleEvent).not.toHaveBeenCalled();
//   });

//   test('invokes handlers for blur and change events', () => {
//     const props = getDefaultProps();
//     render(<RichText {...props} />);
//     fireEvent.change(screen.getByTestId('richTextTestId'), { target: { value: '<p>Rich text content</p>' } });
//     fireEvent.blur(screen.getByTestId('richTextTestId'));
//     expect(handleEvent).toHaveBeenCalled();
//   });
// });

// // import React from 'react';
// // import { render, fireEvent, screen } from '@testing-library/react';
// // import '@testing-library/jest-dom/extend-expect';
// // import RichText from './RichText';
// // import handleEvent from '../../helpers/event-utils';

// // jest.mock('../../helpers/event-utils');
// // jest.mock('../../../bridge/helpers/sdk_component_map', () => ({
// //   getComponentFromMap: jest.fn(() => require('../FieldValueList').default)
// // }));

// // const updateFieldValue = jest.fn();
// // const triggerFieldChange = jest.fn();
// // const validate = jest.fn();

// // const getDefaultProps = () => ({
// //   getPConnect: jest.fn(
// //     () =>
// //       ({
// //         getActionsApi: () => ({ updateFieldValue, triggerFieldChange }),
// //         getStateProps: () => ({
// //           value: '.richText'
// //         }),
// //         getValidationApi: () => ({
// //           validate
// //         }),
// //         getConfigProps: jest.fn(() => ({})),
// //         getDataObject: jest.fn(() => ({})),
// //         getCaseInfo: jest.fn(() => ({
// //           getClassName: jest.fn(() => 'TestClass')
// //         })),
// //         getLocalizedValue: jest.fn((value) => value),
// //         getLocaleRuleNameFromKeys: jest.fn(() => 'localeRuleName')
// //       }) as any
// //   ),
// //   label: 'RichText Label',
// //   required: false,
// //   disabled: false,
// //   value: '',
// //   validatemessage: '',
// //   status: '',
// //   readOnly: false,
// //   testId: 'richTextTestId',
// //   fieldMetadata: {},
// //   helperText: '',
// //   displayMode: '',
// //   hideLabel: false,
// //   placeholder: '',
// //   additionalProps: {},
// //   onChange: jest.fn()
// // });

// // describe('RichText Component', () => {
// //   test('renders with required attribute', () => {
// //     const props = getDefaultProps();
// //     props.required = true;
// //     render(<RichText {...props} />);
// //     expect(screen.getByTestId('richTextTestId')).toHaveAttribute('required');
// //   });

// //   test('renders with disabled attribute', () => {
// //     const props = getDefaultProps();
// //     props.disabled = true;
// //     render(<RichText {...props} />);
// //     expect(screen.getByTestId('richTextTestId')).toBeDisabled();
// //   });

// //   test('renders with readOnly attribute', () => {
// //     const props = getDefaultProps();
// //     props.readOnly = true;
// //     render(<RichText {...props} />);
// //     expect(screen.getByTestId('richTextTestId')).toHaveAttribute('readonly');
// //   });

// //   test('renders with label', () => {
// //     const props = getDefaultProps();
// //     render(<RichText {...props} />);
// //     expect(screen.getByLabelText('RichText Label')).toBeVisible();
// //   });

// //   test('renders in DISPLAY_ONLY mode', () => {
// //     const props = getDefaultProps();
// //     props.displayMode = 'DISPLAY_ONLY';
// //     props.value = '<p>Rich text content</p>';
// //     render(<RichText {...props} />);
// //     expect(screen.getByText('Rich text content')).toBeVisible();
// //   });

// //   test('renders in STACKED_LARGE_VAL mode', () => {
// //     const props = getDefaultProps();
// //     props.displayMode = 'STACKED_LARGE_VAL';
// //     props.value = '<p>Rich text content</p>';
// //     render(<RichText {...props} />);
// //     expect(screen.getByText('Rich text content')).toBeVisible();
// //   });

// //   test('does not invoke onBlur handler for readOnly fields', () => {
// //     const props = getDefaultProps();
// //     props.readOnly = true;
// //     render(<RichText {...props} />);
// //     fireEvent.change(screen.getByTestId('richTextTestId'), { target: { value: '<p>Rich text content</p>' } });
// //     fireEvent.blur(screen.getByTestId('richTextTestId'));
// //     expect(handleEvent).not.toHaveBeenCalled();
// //   });

// //   test('invokes handlers for blur and change events', () => {
// //     const props = getDefaultProps();
// //     render(<RichText {...props} />);
// //     fireEvent.change(screen.getByTestId('richTextTestId'), { target: { value: '<p>Rich text content</p>' } });
// //     fireEvent.blur(screen.getByTestId('richTextTestId'));
// //     expect(handleEvent).toHaveBeenCalled();
// //   });
// // });
