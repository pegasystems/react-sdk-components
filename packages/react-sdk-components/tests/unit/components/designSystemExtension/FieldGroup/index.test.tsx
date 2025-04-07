// import React from 'react';
// import { render, fireEvent } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
// import FieldGroup from '../../../../../src/components/designSystemExtension/FieldGroup';

// interface FieldGroupProps {
//   name?: string;
//   collapsible?: boolean;
//   instructions?: string;
// }

// const getDefaultProps = (): FieldGroupProps => ({
//   name: 'Test Field Group',
//   collapsible: false,
//   instructions: 'Test instructions'
// });

// describe('FieldGroup Component', () => {
//   test('renders with name', () => {
//     const props = getDefaultProps();
//     const { getByText } = render(<FieldGroup {...props} />);
//     expect(getByText('Test Field Group')).toBeVisible();
//   });

//   test('renders with instructions', () => {
//     const props = getDefaultProps();
//     const { getByText } = render(<FieldGroup {...props} />);
//     expect(getByText('Test instructions')).toBeVisible();
//   });

//   test('renders without instructions when instructions prop is "none"', () => {
//     const props = getDefaultProps();
//     props.instructions = 'none';
//     const { queryByText } = render(<FieldGroup {...props} />);
//     expect(queryByText('Test instructions')).toBeNull();
//   });

//   test('handles collapsible prop correctly', () => {
//     const props = getDefaultProps();
//     props.collapsible = true;
//     const { getByText, getByTestId } = render(<FieldGroup {...props} />);
//     expect(getByText('Test Field Group')).toBeVisible();
//     expect(getByTestId('KeyboardArrowDownIcon')).toBeVisible();
//     fireEvent.click(getByText('Test Field Group'));
//     expect(getByTestId('KeyboardArrowRightIcon')).toBeVisible();
//   });

//   test('renders children correctly', () => {
//     const props = getDefaultProps();
//     const { getByText } = render(
//       <FieldGroup {...props}>
//         <div>Child Component</div>
//       </FieldGroup>
//     );
//     expect(getByText('Child Component')).toBeVisible();
//   });

//   test('collapses and expands correctly when collapsible', () => {
//     const props = getDefaultProps();
//     props.collapsible = true;
//     const { getByText, queryByText } = render(
//       <FieldGroup {...props}>
//         <div>Child Component</div>
//       </FieldGroup>
//     );
//     expect(getByText('Child Component')).toBeVisible();
//     fireEvent.click(getByText('Test Field Group'));
//     expect(queryByText('Child Component')).toBeNull();
//     fireEvent.click(getByText('Test Field Group'));
//     expect(getByText('Child Component')).toBeVisible();
//   });
// });

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FieldGroup from '../../../../../src/components/designSystemExtension/FieldGroup';

const theme = createTheme();

const defaultProps = {
  name: 'Test Field Group',
  collapsible: true,
  instructions: 'Test instructions'
};

describe('FieldGroup Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <FieldGroup {...defaultProps}>
          <div>Child Component</div>
        </FieldGroup>
      </ThemeProvider>
    );
    expect(getByText('Test Field Group')).toBeInTheDocument();
    expect(getByText('Test instructions')).toBeInTheDocument();
    expect(getByText('Child Component')).toBeInTheDocument();
  });

  it('handles collapsible prop correctly', () => {
    const { getByText, queryByText } = render(
      <ThemeProvider theme={theme}>
        <FieldGroup {...defaultProps}>
          <div>Child Component</div>
        </FieldGroup>
      </ThemeProvider>
    );
    const header = getByText('Test Field Group');
    fireEvent.click(header);
    expect(queryByText('Child Component')).not.toBeInTheDocument();
    fireEvent.click(header);
    expect(getByText('Child Component')).toBeInTheDocument();
  });

  it('renders correctly without instructions', () => {
    const props = { ...defaultProps, instructions: undefined };
    const { queryByText } = render(
      <ThemeProvider theme={theme}>
        <FieldGroup {...props}>
          <div>Child Component</div>
        </FieldGroup>
      </ThemeProvider>
    );
    expect(queryByText('Test instructions')).not.toBeInTheDocument();
  });

  it('renders correctly without name', () => {
    const props = { ...defaultProps, name: undefined };
    const { queryByText } = render(
      <ThemeProvider theme={theme}>
        <FieldGroup {...props}>
          <div>Child Component</div>
        </FieldGroup>
      </ThemeProvider>
    );
    expect(queryByText('Test Field Group')).not.toBeInTheDocument();
  });
});
