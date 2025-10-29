import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import StoreContext from '../../../bridge/Context/StoreContext';
import createPConnectComponent from '../../../bridge/react_pconnect';
import { getSdkComponentMap } from '../../../bridge/helpers/sdk_component_map';

import localSdkComponentMap from '../../../../sdk-local-component-map';

import { usePegaAuth } from './PegaAuthProvider';

function RootComponent(props) {
  const PegaConnectObj = createPConnectComponent();
  const thePConnObj = <PegaConnectObj {...props} />;

  /**
   * NOTE: For Embedded mode, we add in displayOnlyFA to our React context
   * so it is available to any component that may need it.
   * VRS: Attempted to remove displayOnlyFA but it presently handles various components which
   * SDK does not yet support, so all those need to be fixed up before it can be removed.
   * To be done in a future sprint.
   */
  const contextValue = useMemo(() => {
    return { store: PCore.getStore(), displayOnlyFA: true };
  }, [PCore.getStore()]);

  return <StoreContext.Provider value={contextValue}>{thePConnObj}</StoreContext.Provider>;
}

interface PegaContextProps {
  isPegaReady: boolean;
  rootPConnect?: typeof PConnect; // Function to get Pega Connect object, if available
  PegaContainer: React.FC;
}

declare const myLoadMashup: any;

const PegaContext = createContext<PegaContextProps | undefined>(undefined);

export const PegaReadyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated } = usePegaAuth();
  const [isPegaReady, setIsPegaReady] = useState<boolean>(false);
  const [rootProps, setRootProps] = useState<{
    getPConnect?: () => typeof PConnect;
    [key: string]: any;
  }>({});

  const startMashup = async () => {
    try {
      PCore.onPCoreReady(async renderObj => {
        console.log(`PCore ready!`);

        const theComponentMap = await getSdkComponentMap(localSdkComponentMap);
        console.log(`SdkComponentMap initialized`, theComponentMap);

        const { props } = renderObj;
        setRootProps(props);
        setIsPegaReady(true);
      });

      // load the Mashup and handle the onPCoreEntry response that establishes the
      // top level Pega root element (likely a RootContainer)
      myLoadMashup('pega-root', false); // this is defined in bootstrap shell that's been loaded already
    } catch (error) {
      console.error('Error loading pega:', error);
    }
  };

  /**
   * Start the mashup once authenticated
   * This ensures that the Pega environment is ready for use
   */
  useEffect(() => {
    if (isAuthenticated) {
      startMashup();
    }
  }, [isAuthenticated]);

  // Memoize the root PConnect function to avoid unnecessary re-renders
  const rootPConnect = useMemo(() => {
    if (rootProps && rootProps?.getPConnect) {
      return rootProps.getPConnect();
    }

    return undefined;
  }, [rootProps]);

  const PegaContainer = () => (isPegaReady ? <RootComponent {...rootProps} /> : null);

  return <PegaContext.Provider value={{ isPegaReady, rootPConnect, PegaContainer }}>{children}</PegaContext.Provider>;
};

export const usePega = () => {
  const context = useContext(PegaContext);
  if (!context) {
    throw new Error('usePega must be used within a PegaProvider');
  }
  return context;
};
