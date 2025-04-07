import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import WssQuickCreate from '../../../../../src/components/designSystemExtension/WssQuickCreate';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

interface WssQuickCreateProps {
  heading: string;
  actions?: any[];
}

const getDefaultProps = (): WssQuickCreateProps => ({
  heading: 'Quick Links',
  actions: [
    { label: 'Action 1', onClick: jest.fn(), icon: 'icon1.png' },
    { label: 'Action 2', onClick: jest.fn(), icon: 'icon2.png' }
  ]
});

describe('WssQuickCreate Component', () => {
  test('renders with heading', () => {
    const props = getDefaultProps();
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <WssQuickCreate {...props} />
      </ThemeProvider>
    );
    expect(getByText('Quick Links')).toBeVisible();
  });

  test('renders with actions', () => {
    const props = getDefaultProps();
    const { getByText, getByAltText } = render(
      <ThemeProvider theme={theme}>
        <WssQuickCreate {...props} />
      </ThemeProvider>
    );
    expect(getByText('Action 1')).toBeVisible();
    expect(getByText('Action 2')).toBeVisible();
    expect(getByAltText('Action 1')).toBeVisible();
    expect(getByAltText('Action 2')).toBeVisible();
  });

  test('handles action button clicks', () => {
    const props = getDefaultProps();
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <WssQuickCreate {...props} />
      </ThemeProvider>
    );
    fireEvent.click(getByText('Action 1'));
    expect(props.actions?.[0].onClick).toHaveBeenCalled();
    fireEvent.click(getByText('Action 2'));
    expect(props.actions?.[1].onClick).toHaveBeenCalled();
  });

  test('renders without actions', () => {
    const props = getDefaultProps();
    props.actions = [];
    const { queryByText } = render(
      <ThemeProvider theme={theme}>
        <WssQuickCreate {...props} />
      </ThemeProvider>
    );
    expect(queryByText('Action 1')).toBeNull();
    expect(queryByText('Action 2')).toBeNull();
  });
});
