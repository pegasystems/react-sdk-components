import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { useLocation, useHistory } from 'react-router-dom';
import { SdkConfigAccess, loginIfNecessary, getAvailablePortals } from '@pega/auth/lib/sdk-auth-manager';

import StoreContext from '../../bridge/Context/StoreContext';
import createPConnectComponent from '../../bridge/react_pconnect';
import { compareSdkPCoreVersions } from '../../components/helpers/versionHelpers';
import { getSdkComponentMap } from '../../bridge/helpers/sdk_component_map';
import localSdkComponentMap from '../../../sdk-local-component-map';

import InvalidPortal from './InvalidPortal';

declare const myLoadPortal: any;
declare const myLoadDefaultPortal: any;

function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function FullPortal() {
  const [portalSelectionScreen, setPortalSelectionScreen] = useState(false);
  const [defaultPortalName, setDefaultPortalName] = useState('');
  const [availablePortals, setAvailablePortals] = useState<string[]>([]);

  const history = useHistory();
  const query = useQuery();
  if (query.get('portal')) {
    const portalValue: any = query.get('portal');
    sessionStorage.setItem('rsdk_portalName', portalValue);
  }

  const theme = createTheme({
    // palette: {
    //   primary: {
    //     main: '#2196f3',
    //   },
    //   secondary: {
    //     main: '#ff9800',
    //   },
    // },
  });

  //  const outlet = document.getElementById("outlet");

  // from react_root.js with some modifications
  // eslint-disable-next-line react/no-unstable-nested-components
  function RootComponent(props) {
    // const { portalTarget, styleSheetTarget } = props;
    const PegaConnectObj = createPConnectComponent();

    // remove from Provider to work around compiler error for now: context={StoreContext}
    // return (
    //   <Provider store={PCore.getStore()} context={StoreContext} >
    //     <PegaConnectObj {...props} />
    //   </Provider>
    // );

    // const thePConnObj = <div>the RootComponent</div>;
    const thePConnObj = <PegaConnectObj {...props} />;

    return (
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      <StoreContext.Provider value={{ store: PCore.getStore() }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {thePConnObj}
        </ThemeProvider>
      </StoreContext.Provider>
    );
  }

  /**
   * Callback from onPCoreReady that's called once the top-level render object
   * is ready to be rendered
   * @param inRenderObj the initial, top-level PConnect object to render
   */
  function initialRender(inRenderObj) {
    // modified from react_root.js render
    const { props, domContainerID = null, componentName, portalTarget, styleSheetTarget } = inRenderObj;
    let target: any = null;
    if (domContainerID !== null) {
      target = document.getElementById(domContainerID);
    } else if (portalTarget !== null) {
      target = portalTarget;
    }
    const Component: any = RootComponent;
    if (componentName) {
      Component.displayName = componentName;
    }

    // 1st arg was:
    // <Component
    //   {...props}
    //   portalTarget={portalTarget}
    //   styleSheetTarget={styleSheetTarget}
    // />,

    // var theComponent = <div>the Component</div>;
    const theComponent = (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...props} portalTarget={portalTarget} styleSheetTarget={styleSheetTarget} />;
      </ThemeProvider>
    );

    ReactDOM.render(
      // was <Component
      theComponent,
      target || document.getElementById('pega-root') || document.getElementsByTagName(domContainerID)[0]
    );
  }

  /**
   * kick off the application's portal that we're trying to serve up
   */
  function startPortal() {
    // NOTE: When loadMashup is complete, this will be called.
    PCore.onPCoreReady(renderObj => {
      // Check that we're seeing the PCore version we expect
      compareSdkPCoreVersions();

      // Initialize the SdkComponentMap (local and pega-provided)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getSdkComponentMap(localSdkComponentMap).then((theComponentMap: any) => {
        // eslint-disable-next-line no-console
        console.log(`SdkComponentMap initialized`);

        // Don't call initialRender until SdkComponentMap is fully initialized
        initialRender(renderObj);
      });
    });

    // load the Portal and handle the onPCoreEntry response that establishes the
    //  top level Pega root element (likely a RootContainer)

    const { appPortal: thePortal, excludePortals } = SdkConfigAccess.getSdkConfigServer();
    const defaultPortal = PCore?.getEnvironmentInfo?.().getDefaultPortal?.();
    const queryPortal = sessionStorage.getItem('rsdk_portalName');

    // Note: myLoadPortal and myLoadDefaultPortal are set when bootstrapWithAuthHeader is invoked
    if (queryPortal) {
      myLoadPortal('pega-root', queryPortal, []);
    } else if (thePortal) {
      // eslint-disable-next-line no-console
      console.log(`Loading specified appPortal: ${thePortal}`);
      myLoadPortal('pega-root', thePortal, []);
    } else if (myLoadDefaultPortal && defaultPortal && !excludePortals.includes(defaultPortal)) {
      // eslint-disable-next-line no-console
      console.log(`Loading default portal`);
      myLoadDefaultPortal('pega-root', []);
    } else {
      // eslint-disable-next-line no-console
      console.log('Loading portal selection screen');
      setPortalSelectionScreen(true);
      setDefaultPortalName(defaultPortal);
      // Getting current user's access group's available portals list other than excluded portals (relies on Traditional DX APIs)
      getAvailablePortals().then(portals => {
        setAvailablePortals(portals as string[]);
      });
    }
  }

  function loadSelectedPortal(portal) {
    setPortalSelectionScreen(false);
    myLoadPortal('app-root', portal, []); // this is defined in bootstrap shell that's been loaded already
  }

  function doRedirectDone() {
    history.replace(window.location.pathname);
    // appName and mainRedirect params have to be same as earlier invocation
    loginIfNecessary({ appName: 'portal', mainRedirect: true });
  }

  // One time (initialization)
  useEffect(() => {
    document.addEventListener('SdkConstellationReady', () => {
      // start the portal
      startPortal();
    });
    // Login if needed, doing an initial main window redirect
    loginIfNecessary({
      appName: 'portal',
      mainRedirect: true,
      redirectDoneCB: doRedirectDone
    });
  }, []);

  return portalSelectionScreen ? (
    <InvalidPortal defaultPortal={defaultPortalName} portals={availablePortals} onSelect={loadSelectedPortal} />
  ) : (
    <div>
      <div id='pega-root' />
    </div>
  );
}
