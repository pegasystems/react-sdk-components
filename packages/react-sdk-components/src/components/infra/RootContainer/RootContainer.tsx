import { useMemo, useRef, useState, useEffect, useContext, createElement } from "react";
// import { Banner, ModalManager } from "@pega/cosmos-react-core";
import isEqual from 'lodash.isequal';
// import ReAuthMessageModal from "../ReAuthenticationModal";
import { Box, CircularProgress } from "@material-ui/core";

import createPConnectComponent from "../../../bridge/react_pconnect";
import { LazyMap as LazyComponentMap } from "../../../components_map";
import StoreContext from "../../../bridge/Context/StoreContext";
import { isEmptyObject } from '../../helpers/common-utils';

// import type { PConnProps } from '../../../types/PConnProps';

// Can't use RootContainerProps until getChildren() typedef is fixes to not return an array of 'never'
// interface RootContainerProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   renderingMode?: string,
//   routingInfo: { type: string, accessedOrder: Array<any>, items: any },
//   children: Array<any>,
//   skeleton: any,
//   httpMessages: Array<any>
// }

// Remove this and use "real" PCore type once .d.ts is fixed (currently shows 1 error)
declare const PCore: any;


//
// WARNING:  It is not expected that this file should be modified.  It is part of infrastructure code that works with
// Redux and creation/update of Redux containers and PConnect.  Modifying this code could have undesireable results and
// is totally at your own risk.
//


const renderingModes = ["portal", "view"];

function usePrevious(value) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function getItemView(routingInfo, renderingMode) {
  const viewConfigs: any = [];
  if (routingInfo && renderingModes.includes(renderingMode)) {
    const { accessedOrder, items }: {accessedOrder: any, items:any } = routingInfo;
    if (accessedOrder && items) {
      const key = accessedOrder[accessedOrder.length - 1];
      if (
        items[key] &&
        items[key].view &&
        !isEmptyObject(items[key].view)
      ) {
        viewConfigs.push(items[key]);
      }
    }
  }
  return viewConfigs;
}

export default function RootContainer(props /* : RootContainerProps */) {
  const {
    getPConnect,
    renderingMode = '',
    children = [],
    skeleton,
    httpMessages = [],
    routingInfo
  } = props;

  const { displayOnlyFA } = useContext<any>(StoreContext);


  const pConn = getPConnect();

  const options = { "context": "app" };

  const [componentName, setComponentName] = useState("");

  useEffect( () => {
    // debugging/investigation help
    // console.log(`componentName change: ${componentName} triggering a re-render`);
  }, [componentName] );

  // debugging/investigation help
  // console.log(`RootContainer props.routingInfo: ${JSON.stringify(routingInfo)}`);

  let hasBanner = false;
  let banners: any = null;
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Messages';

  const messages = httpMessages
    ? httpMessages.map((msg) => localizedVal(msg.message, localeCategory))
    : httpMessages;

  hasBanner = messages && messages.length > 0;
  banners = hasBanner && (<div>{localizedVal(`RootContainer: trying to emit Banner with ${messages}`, localeCategory)}</div>);

  const MemoizedModalViewContainer = useMemo(() => {
    return createElement(
      createPConnectComponent(),
      PCore.createPConnect({
        meta: {
          type: "ModalViewContainer",
          config: {
            name: "modal"
          }
        },
        options
      })
    );
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MemoizedPreviewViewContainer = useMemo(() => {
    return createElement(
      createPConnectComponent(),
      PCore.createPConnect({
        meta: {
          type: "PreviewViewContainer",
          config: {
            name: "preview"
          }
        },
        options
      })
    );
  }, []);


  //
  function getNoPortalContent() {
    let noPortalContent: any;

    switch (componentName) {
      case "View":
        noPortalContent = <div>{localizedVal('getNoPortalContent: RootContainer wants to render View in noPortal mode', localeCategory)}</div>
        break;

      case "ViewContainer": {
        const configProps = pConn.getConfigProps();
        const viewContConfig = {
          "meta": {
            "type": "ViewContainer",
            "config": configProps
          },
        options
        };
        const theViewCont = PCore.createPConnect(viewContConfig);
        // Add in displayOnlyFA if prop is on RootContainer
        if (displayOnlyFA) {
          theViewCont.displayOnlyFA = true;
        }

        const theViewContainerAsReact = createElement(createPConnectComponent(), theViewCont);

        noPortalContent = theViewContainerAsReact;
        break;
      }

      default:
        noPortalContent = <div>{localizedVal('getNoPortalContent: RootContainer wants to render NO componentName in noPortal mode', localeCategory)}</div>
        break;

    }

    return noPortalContent;
  }


  let rootView : any;
  let rootViewConfig: any = null;

  useEffect(() => {
    const { containers } = PCore.getStore().getState();
    const items = Object.keys(containers).filter((item) =>
      item.includes("root")
    );
    PCore.getContainerUtils().getContainerAPI().addContainerItems(items);
  }, [routingInfo]);

  const items: any = getItemView(routingInfo, renderingMode);

  if (items.length > 0) {
    rootViewConfig = {
      meta: items[0].view,
      options: {
        context: items[0].context
      }
    };
  }
  const prevRootConfig = usePrevious(rootViewConfig);

  if (
    renderingModes.includes(renderingMode) &&
    messages &&
    routingInfo &&
    routingInfo?.accessedOrder.length === 0
  ) {
    return <div id="root-container">{banners}</div>;
  }

  if (items.length > 0) {
    const itemView = items[0].view;
    const currentRootConfig = {
      meta: itemView,
      options: {
        context: items[0].context
      }
    };

    if (!isEqual(currentRootConfig, prevRootConfig)) {
      rootView = createElement(
          createPConnectComponent(),
          PCore.createPConnect(currentRootConfig)
        );
    }

    // debugging/investigation help
    // console.log(`rootView.props.getPConnect().getComponentName(): ${rootView.props.getPConnect().getComponentName()}`);

    return (
      <div id="ModalManager">
          {rootView}
          {MemoizedModalViewContainer}
          <div id="MemoizedPreviewViewContainer" />
          <div id="ReAuthMessageModal" />
      </div>
    );

  }
  if (renderingMode === "noPortal") {
    // eslint-disable-next-line no-console
    console.log(`${localizedVal('RootContainer rendering in noPortal mode', localeCategory)}`);

    const theChildren = pConn.getChildren();
    if (theChildren && (theChildren.length === 1)) {
      const localPConn = theChildren[0].getPConnect();
      const localCompName = localPConn.getComponentName()
      if (componentName !== localCompName) {
        setComponentName(localCompName);
      }
    }

    return getNoPortalContent();
  }
  if (children && children.length > 0) {
    return (
      <>
        <div>{localizedVal('RootContainer: Has children. Trying to show ModalManager with children, etc.', localeCategory)}</div>
        {children}
        {MemoizedModalViewContainer}
      </>

    );
  }
  if (skeleton) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const LoadingComponent = LazyComponentMap[skeleton];

    return (
      <div id="root-container">
        {/* <div>RootContainer: Trying to show skeleton</div> */}
        <Box textAlign="center"><CircularProgress /></Box>
      </div>
    );
  }
    return (
      <div id="root-container">
        <div>{localizedVal('RootContainer: Should be ModalManager, etc.', localeCategory)}</div>
      </div>
    );

};
