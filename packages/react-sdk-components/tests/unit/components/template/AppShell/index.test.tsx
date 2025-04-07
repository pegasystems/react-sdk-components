import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AppShell from '../../../../../src/components/template/AppShell';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// import { NavContext } from '../../helpers/reactContextHelpers';
// import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import Utils from '../../../../../src/components/helpers/utils';

const theme = createTheme();

declare global {
  interface Window {
    PCore: any;
    URL: any;
  }
}

window.PCore = {
  ...window.PCore,
  getEnvironmentInfo: () => ({
    getOperatorImageInsKey: jest.fn(() => 'mocked-image-key'),
    getOperatorName: jest.fn(() => 'Test User'),
    getApplicationLabel: jest.fn(() => 'Test App'),
    getApplicationName: jest.fn(() => 'Test Application'),
    getPortalName: jest.fn(() => 'Test Portal')
  }),
  getLocaleUtils: () => ({
    getLocaleValue: jest.fn((value) => value)
  }),
  getAssetLoader: () => ({
    getSvcImage: jest.fn(() => Promise.resolve(new Blob()))
  }),
  getDataPageUtils: () => ({
    getPageDataAsync: jest.fn(() => Promise.resolve({ pyCaseTypesAvailableToCreate: [] }))
  })
};

window.URL = {
  createObjectURL: jest.fn(() => 'mocked-url')
};

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn((component) => {
    switch (component) {
      case 'NavBar':
        return (props) => <div data-test-id="NavBar">NavBar</div>;
      case 'WssNavBar':
        return () => <div data-test-id="WssNavBar">WssNavBar</div>;
      case 'AlertBanner':
        return () => <div data-test-id="AlertBanner">AlertBanner</div>;
      default:
        return null;
    }
  })
}));

jest.mock('../../../../../src/components/helpers/utils', () => ({
  Utils: {
    getInitials: jest.fn(() => 'TU'),
    getIconPath: jest.fn(() => '/icons/'),
    getSDKStaticConentUrl: jest.fn(() => '/static/'),
    getAssetLoader: jest.fn(() => ({
      getSvcImage: jest.fn(() => Promise.resolve(new Blob()))
    }))
  }
}));

// jest.mock('../../../../../src/components/helpers/utils', () => ({
//   getInitials: jest.fn(() => 'TU'),
//   getIconPath: jest.fn(() => 'mocked-icon-path/'),
//   getSDKStaticConentUrl: jest.fn(() => 'mocked-sdk-static-content-url/')
// }));

interface AppShellProps {
  showAppName: boolean;
  pages: {
    pxPageViewIcon: string;
    pyClassName: string;
    pyLabel: string;
    pyRuleName: string;
    pyURLContent: string;
  }[];
  caseTypes?: object[];
  portalTemplate: string;
  portalName: string;
  portalLogo: string;
  navDisplayOptions: { alignment: string; position: string };
  httpMessages: string[];
  pageMessages: string[];
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
        },
        getValue() {
          return;
        },
        getActionsApi: () => ({
          showPage: jest.fn()
        }),
        hasChildren: () => false,
        getChildren: () => []
      }) as any
  ),
  showAppName: true,
  pages: [
    { pxPageViewIcon: 'pi pi-home', pyClassName: 'Home', pyLabel: 'Home', pyRuleName: 'Home', pyURLContent: '' }
  ],
  caseTypes: [],
  portalTemplate: 'default',
  portalName: 'Test Portal',
  portalLogo: 'test-logo.png',
  navDisplayOptions: { alignment: 'left', position: 'top' },
  httpMessages: [],
  pageMessages: []
});

describe('AppShell Component', () => {
  test('renders with default props', () => {
    const props = getDefaultProps();
    const { getByTestId, getByText } = render(
      <ThemeProvider theme={theme}>
        <AppShell {...props} />
      </ThemeProvider>
    );
    expect(getByTestId('NavBar')).toBeVisible();
    // expect(getByText('Test App')).toBeVisible();
  });

  // test('renders with WssNavBar when portalTemplate is "wss"', () => {
  //   const props = getDefaultProps();
  //   props.portalTemplate = 'wss';
  //   const { getByTestId } = render(
  //     <ThemeProvider theme={theme}>
  //       <AppShell {...props} />
  //     </ThemeProvider>
  //   );
  //   expect(getByTestId('WssNavBar')).toBeVisible();
  // });

  // test('renders with AlertBanner when there are messages', () => {
  //   const props: any = getDefaultProps();
  //   props.httpMessages = ['HTTP Error'];
  //   props.pageMessages = ['Page Error'];
  //   const { getByTestId } = render(
  //     <ThemeProvider theme={theme}>
  //       <AppShell {...props} />
  //     </ThemeProvider>
  //   );
  //   expect(getByTestId('AlertBanner')).toBeVisible();
  // });

  test('handles page links correctly', async () => {
    const props = getDefaultProps();
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <AppShell {...props} />
      </ThemeProvider>
    );
    await act(async () => {
      fireEvent.click(getByText('Home'));
    });
    expect(props.getPConnect().getActionsApi().showPage).toHaveBeenCalledWith('Home');
    expect(window.open).not.toHaveBeenCalled();
  });

  test('handles external URL links correctly', async() => {
    const props = getDefaultProps();
    props.pages[0].pyURLContent = 'http://example.com';
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <AppShell {...props} />
      </ThemeProvider>
    );
    await act(async () => {
      fireEvent.click(getByText('Home'));
    });
    expect(window.open).toHaveBeenCalledWith('http://example.com', '_blank');
  });

  test('renders children correctly', () => {
    const props = getDefaultProps();
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <AppShell {...props}>
          <div>Child Component</div>
        </AppShell>
      </ThemeProvider>
    );
    expect(getByText('Child Component')).toBeVisible();
  });
});
