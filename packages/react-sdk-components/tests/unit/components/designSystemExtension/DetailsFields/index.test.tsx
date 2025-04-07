// import React from 'react';
// import { render } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import DetailsFields from '../../../../../src/components/designSystemExtension/DetailsFields';
// // import createPConnectComponent from '../../../bridge/react_pconnect';

// jest.mock('../../../../../src/bridge/react_pconnect', () => jest.fn(() => <div data-test-id='pconnect-component'>PConnect Component</div>));

// interface DetailsFieldsProps {
//   fields: any[];
// }

// const getDefaultProps = (): DetailsFieldsProps => ({
//   fields: [
//     {
//       getPConnect: () => ({
//         getComponentName: () => 'TextInput',
//         getConfigProps: () => ({ label: 'Text Input' }),
//         getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//         getInheritedProps: () => ({})
//       })
//     },
//     {
//       getPConnect: () => ({
//         getComponentName: () => 'Status',
//         getConfigProps: () => ({ label: 'Status' }),
//         getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//         getInheritedProps: () => ({})
//       })
//     },
//     {
//       getPConnect: () => ({
//         getComponentName: () => 'Email',
//         getConfigProps: () => ({ label: 'Email' }),
//         getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//         getInheritedProps: () => ({})
//       })
//     }
//   ]
// });

// describe('DetailsFields Component', () => {
//   test('renders with fields', () => {
//     const props = getDefaultProps();
//     const { getByText } = render(<DetailsFields {...props} />);
//     expect(getByText('Text Input')).toBeVisible();
//     expect(getByText('Status')).toBeVisible();
//     expect(getByText('Email')).toBeVisible();
//   });

//   test('renders with correct field types', () => {
//     const props = getDefaultProps();
//     const { getByText } = render(<DetailsFields {...props} />);
//     expect(getByText('Text Input')).toBeVisible();
//     expect(getByText('Status')).toBeVisible();
//     expect(getByText('Email')).toBeVisible();
//   });

//   test('renders with different field values', () => {
//     const props = getDefaultProps();
//     props.fields = [
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'TextInput',
//           getConfigProps: () => ({ label: 'New Text Input' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       },
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'Email',
//           getConfigProps: () => ({ label: 'New Email' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       }
//     ];
//     const { getByText } = render(<DetailsFields {...props} />);
//     expect(getByText('New Text Input')).toBeVisible();
//     expect(getByText('New Email')).toBeVisible();
//   });

//   test('renders with missing field values', () => {
//     const props = getDefaultProps();
//     props.fields = [
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'TextInput',
//           getConfigProps: () => ({ label: '' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       },
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'Email',
//           getConfigProps: () => ({ label: '' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       }
//     ];
//     const { getByText } = render(<DetailsFields {...props} />);
//     expect(getByText('---')).toBeVisible();
//   });

//   test('renders with different field types', () => {
//     const props = getDefaultProps();
//     props.fields = [
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'Checkbox',
//           getConfigProps: () => ({ label: 'Checkbox' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       },
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'Phone',
//           getConfigProps: () => ({ label: 'Phone' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       },
//       {
//         getPConnect: () => ({
//           getComponentName: () => 'Currency',
//           getConfigProps: () => ({ label: 'Currency' }),
//           getReferencedView: () => ({ config: { readOnly: true, displayMode: 'DISPLAY_ONLY' } }),
//           getInheritedProps: () => ({})
//         })
//       }
//     ];
//     const { getByText } = render(<DetailsFields {...props} />);
//     expect(getByText('Checkbox')).toBeVisible();
//     expect(getByText('Phone')).toBeVisible();
//     expect(getByText('Currency')).toBeVisible();
//   });
// });
// import React from 'react';
// import { render } from '@testing-library/react';
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import DetailsFields from '../../../../../src/components/designSystemExtension/DetailsFields';

// jest.mock('../../../../../src/bridge/react_pconnect', () => jest.fn(() => <div data-test-id='pconnect-component'>PConnect Component</div>));
// const theme = createTheme();
// const mockReferencedViewGetPConnect = jest.fn().mockReturnValue('Referenced View pConnect');
// const defaultProps = {
//   fields: [
//     {
//       getPConnect: () => ({
//         getComponentName: () => 'TextInput',
//         getConfigProps: () => ({ label: 'Field 1' }),
//         getReferencedView: () => ({
//           config: { value: 'Value 1', readOnly: true, displayMode: 'DISPLAY_ONLY' }
//         }),
//         getInheritedProps: () => ({}),
//         getReferencedViewPConnect: () => ({
//           getPConnect: mockReferencedViewGetPConnect
//         })
//       })
//     },
//     {
//       getPConnect: () => ({
//         getComponentName: () => 'Date',
//         getConfigProps: () => ({ label: 'Field 2' }),
//         getReferencedView: () => ({
//           config: { value: '2025-03-16', readOnly: true, displayMode: 'DISPLAY_ONLY' }
//         }),
//         getInheritedProps: () => ({}),
//         getReferencedViewPConnect: () => ({
//           getPConnect: mockReferencedViewGetPConnect
//         })
//       })
//     }
//   ]
// };

// describe('DetailsFields Component', () => {
//   it('renders correctly with default props', () => {
//     const { getByText } = render(
//       <ThemeProvider theme={theme}>
//         <DetailsFields {...defaultProps} />
//       </ThemeProvider>
//     );
//     expect(getByText('Field 1')).toBeInTheDocument();
//     expect(getByText('Value 1')).toBeInTheDocument();
//     expect(getByText('Field 2')).toBeInTheDocument();
//     expect(getByText('2025-03-16')).toBeInTheDocument();
//   });

//   it('renders correctly with empty fields', () => {
//     const { container } = render(
//       <ThemeProvider theme={theme}>
//         <DetailsFields fields={[]} />
//       </ThemeProvider>
//     );
//     expect(container).toBeEmptyDOMElement();
//   });
// });
