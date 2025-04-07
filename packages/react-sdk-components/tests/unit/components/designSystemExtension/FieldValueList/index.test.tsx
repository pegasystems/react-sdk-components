import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FieldValueList from '../../../../../src/components/designSystemExtension/FieldValueList/FieldValueList';

const theme = createTheme();

const defaultProps = {
  name: 'Test Field',
  value: 'Test Value',
  variant: 'inline',
  isHtml: false
};

describe('FieldValueList Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <FieldValueList {...defaultProps} />
      </ThemeProvider>
    );
    expect(getByText('Test Field')).toBeInTheDocument();
    expect(getByText('Test Value')).toBeInTheDocument();
  });

  it('renders correctly with stacked variant', () => {
    const props = { ...defaultProps, variant: 'stacked' };
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <FieldValueList {...props} />
      </ThemeProvider>
    );
    expect(getByText('Test Field')).toBeInTheDocument();
    expect(getByText('Test Value')).toBeInTheDocument();
  });

  it('renders correctly with HTML content', () => {
    const props = { ...defaultProps, isHtml: true, value: '<b>Test HTML Value</b>' };
    const { container } = render(
      <ThemeProvider theme={theme}>
        <FieldValueList {...props} />
      </ThemeProvider>
    );
    expect(container.querySelector('b')).toBeInTheDocument();
    expect(container.querySelector('b')?.textContent).toBe('Test HTML Value');
  });

  test('renders with "---" when value is undefined', () => {
    const props = { ...defaultProps, value: undefined };
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <FieldValueList {...props} />
      </ThemeProvider>
    );
    expect(getByText('---')).toBeVisible();
  });

  it('renders correctly with empty value', () => {
    const props = { ...defaultProps, value: '' };
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <FieldValueList {...props} />
      </ThemeProvider>
    );
    expect(getByText('---')).toBeInTheDocument();
  });
});
