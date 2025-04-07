// import React from 'react';
// import { render, fireEvent, act } from '@testing-library/react';
// import UserReference from '../../../../../src/components/field/UserReference';
// import { getComponentFromMap } from '../../../../../src/bridge/helpers/sdk_component_map';
// import FieldValueList from '../FieldValueList';
// jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
//   getComponentFromMap: jest.fn()
// }));

// const AutoComplete = jest.fn(() => <div data-test-id='autoComplete'>AutoComplete</div>);
// const Dropdown = jest.fn(() => <div data-test-id='dropdown'>Dropdown</div>);
// const MockFieldValueList = jest.fn(() => <FieldValueList name='User Reference Label' value='User Name' variant='' />);

// (getComponentFromMap as jest.Mock).mockImplementation(component => {
//   switch (component) {
//     case 'AutoComplete':
//       return AutoComplete;
//     case 'Dropdown':
//       return Dropdown;
//     default:
//       return MockFieldValueList;
//   }
// });

// declare global {
//   interface Window {
//     PCore: any;
//   }
// }
// const operatorsMock = [
//   {
//     pzInsKey: 'Z2xvYmFsVXNlcl82M2MwNjU4ZmViYTNiMTUzYTY0MTllYjE',
//     ID: 'Z2xvYmFsVXNlcl82M2MwNjU4ZmViYTNiMTUzYTY0MTllYjE',
//     BusinessID: 'john.doe.com',
//     Name: 'John Doe'
//   },
//   {
//     pzInsKey: 'Z2xvYmFsVXNlcl82M2MwNjVmN2ViYTNiMTUzYTY0MTllYjI',
//     ID: 'Z2xvYmFsVXNlcl82M2MwNjVmN2ViYTNiMTUzYTY0MTllYjI',
//     BusinessID: 'smith.doe.com',
//     Name: 'Smith Doe'
//   }
// ];
// const operatorGlimpseMock = {
//   data: {
//     data: [
//       {
//         pzInsKey: 'Z2xvYmFsVXNlcl82M2MwNjVmN2ViYTNiMTUzYTY0MTllYjI',
//         ID: 'Z2xvYmFsVXNlcl82M2MwNjVmN2ViYTNiMTUzYTY0MTllYjI',
//         Email: 'smith.doe.com',
//         BusinessID: 'smith.doe.com',
//         AccessGroup: 'globalGomechanicdefaultag',
//         Name: 'Smith Doe'
//       }
//     ]
//   }
// };
// window.PCore = {
//   ...window.PCore,
//   getEnvironmentInfo: (): any => {
//     return {
//       getDefaultOperatorDP: () => {
//         return 'D_pyC11nOperatorsList';
//       }
//     };
//   },
//   getUserApi: jest.fn().mockImplementation(() => {
//     return {
//       getOperatorDetails: () => {
//         return new Promise(resolve => {
//           resolve(operatorGlimpseMock);
//         });
//       }
//     };
//   }),
//   getRestClient: jest.fn(() => ({
//     invokeRestApi: jest.fn(() => {
//       const resp = {
//         data: {
//           data: operatorsMock
//         }
//       };
//       return Promise.resolve(resp);
//     })
//   }))
// };

// const getDefaultProps = () => ({
//   getPConnect: jest.fn(
//     () =>
//       ({
//         getContextName: jest.fn(),
//         getActionsApi: jest.fn(),
//         getStateProps: jest.fn(() => ({ value: '.userReference' })),
//         getValidationApi: jest.fn(),
//         getCaseInfo: jest.fn(() => ({ getClassName: jest.fn() })),
//         getDataObject: jest.fn(),
//         getLocalizedValue: jest.fn(),
//         clearErrorMessages: jest.fn(),
//         setReferenceList: jest.fn()
//       }) as any
//   ),
//   label: 'UserReference',
//   displayAs: '',
//   displayMode: '',
//   value: '',
//   testId: 'userReferenceTestId',
//   helperText: '',
//   validatemessage: '',
//   placeholder: '',
//   showAsFormattedText: false,
//   additionalProps: {},
//   hideLabel: false,
//   readOnly: false,
//   required: false,
//   disabled: false,
//   onChange: jest.fn(),
//   variant: 'inline'
// });

// describe('UserReference Component', () => {
//   test('renders with Dropdown when displayAs is DROPDOWN_LIST', async () => {
//     const props = getDefaultProps();
//     props.displayAs = 'Drop-down list';
//     await act(async () => {
//       const { getByTestId } = render(<UserReference {...props} />);
//       expect(getByTestId('dropdown')).toBeVisible();
//     });
//   });

//   test('renders with AutoComplete when displayAs is SEARCH_BOX', async () => {
//     const props = getDefaultProps();
//     props.displayAs = 'Search box';
//     await act(async () => {
//       const { getByTestId } = render(<UserReference {...props} />);
//       expect(getByTestId('autoComplete')).toBeVisible();
//     });
//   });

//   test('renders with required attribute', async () => {
//     const props = getDefaultProps();
//     props.required = true;
//     await act(async () => {
//       const { getByTestId, rerender } = render(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).toHaveAttribute('required');

//       props.required = false;
//       rerender(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).not.toHaveAttribute('required');
//     });
//   });

//   test('renders with disabled attribute', async () => {
//     const props = getDefaultProps();
//     props.disabled = true;
//     await act(async () => {
//       const { getByTestId, rerender } = render(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).toBeDisabled();

//       props.disabled = false;
//       rerender(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).not.toBeDisabled();
//     });
//   });

//   test('renders with readOnly attribute', async () => {
//     const props = getDefaultProps();
//     props.readOnly = true;
//     await act(async () => {
//       const { getByTestId, rerender } = render(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).toHaveAttribute('readonly');

//       props.readOnly = false;
//       rerender(<UserReference {...props} />);
//       expect(getByTestId('userReferenceTestId')).not.toHaveAttribute('readonly');
//     });
//   });

//   test('renders with label', async () => {
//     const props = getDefaultProps();
//     await act(async () => {
//       const { getByText } = render(<UserReference {...props} />);
//       expect(getByText('User Reference Label')).toBeVisible();
//     });
//   });

//   test('renders in DISPLAY_ONLY mode', async () => {
//     const props = getDefaultProps();
//     props.displayMode = 'DISPLAY_ONLY';
//     props.value = 'User Name';
//     await act(async () => {
//       const { getByText } = render(<UserReference {...props} />);
//       expect(getByText('User Name')).toBeVisible();
//     });
//   });

//   test('renders in STACKED_LARGE_VAL mode', async () => {
//     const props = getDefaultProps();
//     props.displayMode = 'STACKED_LARGE_VAL';
//     props.value = 'User Name';
//     await act(async () => {
//       const { getByText } = render(<UserReference {...props} />);
//       expect(getByText('User Name')).toBeVisible();
//     });
//   });
// });
