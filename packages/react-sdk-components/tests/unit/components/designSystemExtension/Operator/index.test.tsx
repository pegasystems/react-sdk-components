import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Operator from '../../../../../src/components/designSystemExtension/Operator';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Utils from '../../../../../src/components/helpers/utils';

const theme = createTheme();

jest.mock('../../../../../src/components/helpers/utils', () => ({
  generateDateTime: jest.fn(() => 'Formatted DateTime')
}));

declare global {
  interface Window {
    PCore: any;
  }
}

window.PCore = {
  ...window.PCore,
  getUserApi: () => ({
    getOperatorDetails: jest.fn(() => Promise.resolve({
      data: {
        pyOperatorInfo: {
          pyUserName: 'Test User',
          pyPosition: 'Test Position',
          pyOrganization: 'Test Organization',
          pyReportToUserName: 'Test Manager',
          pyTelephone: '123-456-7890',
          pyEmailAddress: 'test@example.com'
        }
      }
    }))
  }),
  getLocaleUtils: () => ({
    getLocaleValue: jest.fn((value) => value)
  })
};



interface OperatorProps {
  label: string;
  createDateTime: string;
  createLabel: string;
  createOperator: { userName: string; userId: string };
  updateDateTime: string;
  updateLabel: string;
  updateOperator: { userName: string; userId: string };
  displayLabel?: any;
}

const getDefaultProps = () => ({
  getPConnect: jest.fn(
    () =>
      ({
        getStateProps: () => ({
          value: '.autoComplete'
        }),
        getValidationApi: () => ({
          validate: jest.fn()
        }),
        getContextName() {
          return 'app/primary_1/workarea_1';
        },
        getDataObject() {
          return;
        }
      }) as any
  ),
  label: 'Create Operator',
  createDateTime: '2023-01-01T00:00:00Z',
  createLabel: 'Created By',
  createOperator: { userName: 'Creator', userId: '1' },
  updateDateTime: '2023-01-02T00:00:00Z',
  updateLabel: 'Updated By',
  updateOperator: { userName: 'Updater', userId: '2' },
  displayLabel: 'Create Operator',

});

describe('Operator Component', () => {
  test('renders with create operator details', () => {
    const props = getDefaultProps();
    const { getByLabelText, getByText } = render(
      <ThemeProvider theme={theme}>
        <Operator {...props} />
      </ThemeProvider>
    );
    expect(getByLabelText('Created By')).toBeVisible();
    expect(getByLabelText('Created By')).toHaveValue('Creator');
    expect(getByText('Formatted DateTime')).toBeVisible();
  });

  test('renders with update operator details', () => {
    const props = getDefaultProps();
    props.label = 'Update Operator';
    props.displayLabel = 'Update Operator';
    const { getByLabelText, getByText } = render(
      <ThemeProvider theme={theme}>
        <Operator {...props} />
      </ThemeProvider>
    );
    expect(getByLabelText('Updated By')).toBeVisible();
    expect(getByLabelText('Updated By')).toHaveValue('Updater');
    expect(getByText('Formatted DateTime')).toBeVisible();
  });

  test('handles popover functionality correctly', async () => {
    const props = getDefaultProps();
    const { getByLabelText, getByText, queryByText } = render(
      <ThemeProvider theme={theme}>
        <Operator {...props} />
      </ThemeProvider>
    );
    await act(async () => {
      fireEvent.click(getByLabelText('Created By'));
    });
    expect(getByText('Position')).toBeVisible();
    expect(getByText('Test Position')).toBeVisible();
    expect(getByText('Organization')).toBeVisible();
    expect(getByText('Test Organization')).toBeVisible();
    expect(getByText('Reports to')).toBeVisible();
    expect(getByText('Test Manager')).toBeVisible();
    expect(getByText('Telephone')).toBeVisible();
    expect(getByText('123-456-7890')).toBeVisible();
    expect(getByText('Email address')).toBeVisible();
    expect(getByText('test@example.com')).toBeVisible();
    fireEvent.click(document.body);
  });
});
