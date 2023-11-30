/* eslint-disable max-classes-per-file */
import React, { Component, createElement } from 'react';
import PropTypes from 'prop-types';
import { connect, shallowEqual } from 'react-redux';

import ComponentMap, { LazyMap as LazyComponentMap } from '../components_map'; // was '../../../../../src/components_map';
import StoreContext from './Context/StoreContext';

// const pathToComponents = "../../../../../src/components";  /* When bridge was local, it was "../components" */

// For now, NOT doing lazy loading - needs some work on the loader to work with TypeScript
// As we add components, we'll need to import them here and add to the switch statement
//    below in getComponent!

import ErrorBoundary from '../components/infra/ErrorBoundary';

import { SdkComponentMap } from './helpers/sdk_component_map';

const isClassIDCompare = (key, prev) => {
  return !(key === 'classID' && !prev[key]);
};

const routingInfoCompare = (next, prev) => {
  return (
    'routingInfo' in next &&
    (!shallowEqual(next.routingInfo, prev.routingInfo) ||
      !PCore.isDeepEqual(next.routingInfo, prev.routingInfo))
  );
};

/** Generate unique id for elements */
const createUID = () => {
  return `_${Math.random().toString(36).slice(2, 11)}`;
};

export const setVisibilityForList = (c11nEnv, visibility) => {
  const { selectionMode, selectionList, renderMode, referenceList } = c11nEnv.getComponentConfig();
  // usecase:multiselect, fieldgroup, editable table
  if (
    (selectionMode === PCore.getConstants().LIST_SELECTION_MODE.MULTI && selectionList) ||
    (renderMode === 'Editable' && referenceList)
  ) {
    c11nEnv.getListActions().setVisibility(visibility);
  }
};

function withVisibility(WrappedComponent) {
  // eslint-disable-next-line react/prefer-stateless-function
  return class extends Component {
    render() {
      const { visibility } = this.props;

      if (visibility === false) {
        return null;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
}

const connectRedux = (component, c11nEnv) => {
  return connect(
    (state, ownProps) => {
      let addProps = {};
      const obj = {};
      // Need to use ownProps pconnect since c11nEnv is stale and prior to re-render
      if (!ownProps.getPConnect) {
        // eslint-disable-next-line no-console
        console.error('connectRedux ownProps are not defined');
      } else {
        c11nEnv = ownProps.getPConnect();
      }

      if (typeof component.additionalProps === 'object') {
        addProps = c11nEnv.resolveConfigProps(component.additionalProps);
      } else if (typeof component.additionalProps === 'function') {
        addProps = c11nEnv.resolveConfigProps(
          component.additionalProps(state, ownProps.getPConnect)
        );
      }

      c11nEnv.getConfigProps(obj);

      // populate additional props which are component specific and not present in configurations
      // This block can be removed once all these props will be added as part of configs
      c11nEnv.populateAdditionalProps(obj);

      return {
        ...obj,
        ...addProps
      };
    },
    null,
    null,
    {
      context: StoreContext,
      areStatePropsEqual: (next, prev) => {
        const allStateProps = c11nEnv.getStateProps();
        for (const key in allStateProps) {
          if (
            (isClassIDCompare(key, prev) && !shallowEqual(next[key], prev[key])) ||
            (next.routingInfo && !PCore.isDeepEqual(next.routingInfo, prev.routingInfo))
          ) {
            return false;
          }
        }

        // For CaseSummary (when status === ".pyStatusWork"), we need to compare changes in
        //  primaryFields and secondary Fields
        if (allStateProps.status === '.pyStatusWork') {
          for (const key in prev) {
            if (!PCore.isDeepEqual(next[key], prev[key])) {
              return false;
            }
          }
        }
        /* TODO For some rawConfig we are not getting routingInfo under allStateProps */
        return !routingInfoCompare(next, prev);
      }
    }
  )(component);
};

const getComponent = c11nEnv => {
  // PCore is defined in pxBootstrapShell - eventually will be exported in place of constellationCore
  const ComponentsRegistry = PCore.getComponentsRegistry();
  const type = c11nEnv.getComponentName();

  const componentObj = ComponentsRegistry.getComponent(type);
  const componentType = (componentObj && componentObj.component) || type;

  // JEA - modifying logic before bailing to RootContainer logic to work around async loading problem
  let component = LazyComponentMap[componentType]; /* || window[componentType] */

  // NOTE: Until we get lazy loading working, maintain this for each component we add
  if (component === undefined) {
    if (SdkComponentMap) {
      // This is the node_modules version of react_pconnect!
      const theLocalComponent = SdkComponentMap.getLocalComponentMap()[componentType];
      if (theLocalComponent !== undefined) {
        // eslint-disable-next-line no-console
        console.log(`react_pconnect getComponent found ${componentType}: Local`);
        component = theLocalComponent;
      } else {
        const thePegaProvidedComponent =
          SdkComponentMap.getPegaProvidedComponentMap()[componentType];
        if (thePegaProvidedComponent !== undefined) {
          // console.log(`react_pconnect getComponent found ${componentType}: Pega-provided`);
          component = thePegaProvidedComponent;
        } else {
          // eslint-disable-next-line no-console
          console.error(`react_pconnect: getComponent doesn't have an entry for type ${type}`);
          component = ErrorBoundary;
        }
      }
    } else {
      // We no longer handle the "old" switch statement that was here in the original packaging.
      //  All components seen here need to be in the SdkComponentMap
      // eslint-disable-next-line no-console
      console.error(`SdkComponentMap not defined! Unable to process component: ${componentType}`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`getComponent doesn't have an entry for component ${component}`);
    component = ErrorBoundary;
  }

  if (c11nEnv.isConditionExist()) {
    return connectRedux(withVisibility(component), c11nEnv);
  }

  return connectRedux(component, c11nEnv);
};

/**
 *
 * @param {*} declarative
 * @returns {React.Components<Props, State>}

 */
const createPConnectComponent = () => {
  /**
   * JEA - add Type info via JSdoc syntax...
   * @extends {React.Components<Props, State>}
   * createPConnectComponent - Class to create/initialize a PConnect (c11nEnv) object
   * to pre-process meta data of each componnet.
   * - Wraps each child in a component with PConnect
   * - Process all actions and make them avaiable in props
   * - Filters all properties in metadata and keeps them
   * __internal for re-render process through connect
   */
  class PConnect extends Component {
    constructor(props) {
      super(props);
      const { getPConnect } = this.props;
      this.state = {
        hasError: false
      };

      this.eventHandler = this.eventHandler.bind(this);
      this.changeHandler = this.changeHandler.bind(this);

      this.c11nEnv = getPConnect();
      this.Control = getComponent(this.c11nEnv);
      this.actionsAPI = this.c11nEnv.getActionsApi();

      this.processActions(this.c11nEnv);
    }

    static getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI.
      return {
        hasError: true,
        error
      };
    }

    componentDidMount() {
      this.c11nEnv.addFormField();
      setVisibilityForList(this.c11nEnv, true);
    }

    componentDidCatch(error, info) {
      // eslint-disable-next-line no-console
      console.error(
        `Error while Rendering the component ${this.componentName} : `,
        error,
        info.componentStack
      );
    }

    componentWillUnmount() {
      if (this.c11nEnv.removeFormField) {
        this.c11nEnv.removeFormField();
        setVisibilityForList(this.c11nEnv, false);
      }
    }

    /*
     *  processActions to see all actions in meta and adds event in props.
     *  Attaches common handler (eventHandler) for all actions.
     */
    processActions() {
      if (this.c11nEnv.isEditable()) {
        this.c11nEnv.setAction('onChange', this.changeHandler);
        this.c11nEnv.setAction('onBlur', this.eventHandler);
      }
    }

    // Using separate handle for change as in case of dropdown, native click is mapped to react change
    changeHandler(event) {
      this.actionsAPI.changeHandler(this.c11nEnv, event);
      //      getActionProcessor().changeHandler(this.c11nEnv, event);
    }

    eventHandler(event) {
      this.actionsAPI.eventHandler(this.c11nEnv, event);
      //      getActionProcessor().eventHandler(this.c11nEnv, event);
    }

    createChildren() {
      const { getPConnect } = this.props;
      if (getPConnect().hasChildren() && getPConnect().getChildren()) {
        return getPConnect()
          .getChildren()
          .map((childProps, index) => <PConnect {...childProps} key={this.getKey() + index} />);
      }
      return null;
    }

    getKey() {
      const { getPConnect } = this.props;
      const viewName = getPConnect().getConfigProps().name || getPConnect().getCurrentView();
      let key = !viewName
        ? createUID()
        : `${viewName}!${getPConnect().getCurrentClassID() || createUID()}`;

      // In the case of pyDetails the key must be unigue for each instance
      if (viewName && viewName.toUpperCase() === 'PYDETAILS') {
        key += `!${getPConnect().getCaseInfo().getID()}`;
      }

      return key.toUpperCase();
    }

    render() {
      const { hasError } = this.state;
      const { getPConnect, additionalProps, ...otherProps } = this.props;

      if (hasError) {
        // You can render any custom fallback UI
        // console.log(`react_pconnect error: used to return: <ErrorBoundary getPConnect={() => this.c11nEnv} isInternalError />`);
        return <ErrorBoundary getPConnect={() => this.c11nEnv} isInternalError />;
      }

      const props = this.c11nEnv.getConfigProps();
      const actions = this.c11nEnv.getActions();
      const finalProps = {
        ...props,
        getPConnect,
        ...actions,
        additionalProps,
        ...otherProps
      };

      // If the new component is a reference node then mark with a unique key
      if (['reference', 'View'].includes(getPConnect().getComponentName()) && !finalProps.key) {
        finalProps.key = this.getKey();
      }

      // console.log(`react_pconnect: used to return: <this.Control {...finalProps} />`);

      return <this.Control {...finalProps}>{this.createChildren()}</this.Control>;
    }
  }

  // eslint-disable-next-line react/static-property-placement
  PConnect.propTypes = {
    // __internal: PropTypes.object.isRequired,
    // meta: PropTypes.object.isRequired,
    // configObject: PropTypes.object.isRequired,
    getPConnect: PropTypes.func.isRequired,
    additionalProps: PropTypes.shape({
      noLabel: PropTypes.bool,
      readOnly: PropTypes.bool
    }),
    validatemessage: PropTypes.string
  };

  // eslint-disable-next-line react/static-property-placement
  PConnect.defaultProps = {
    additionalProps: {},
    validatemessage: ''
  };

  return PConnect;
};

// Move these into SdkConstellationReady so PCore is available
document.addEventListener('SdkConstellationReady', () => {
  PCore.registerComponentCreator((c11nEnv, additionalProps = {}) => {
    const PConnectComp = createPConnectComponent();
    return createElement(PConnectComp, {
      ...c11nEnv,
      ...c11nEnv.getPConnect().getConfigProps(),
      ...c11nEnv.getPConnect().getActions(),
      ...{ additionalProps }
    });
  });

  PCore.getAssetLoader().register('component-loader', async (componentNames = []) => {
    const promises = [];
    componentNames.forEach(comp => {
      if (/^[A-Z]/.test(comp) && !LazyComponentMap[comp]) {
        if (!ComponentMap[comp]) {
          const srcUrl = `${PCore.getAssetLoader().getConstellationServiceUrl()}/v860/${PCore.getAssetLoader().getAppAlias()}/component/${comp}.js`;
          promises.push(PCore.getAssetLoader().getLoader()(srcUrl, 'script'));
        } else {
          if (ComponentMap[comp].modules && ComponentMap[comp].modules.length) {
            ComponentMap[comp].modules.forEach(module => {
              LazyComponentMap[comp] = module;
            });
          }
          if (ComponentMap[comp].scripts && ComponentMap[comp].scripts.length) {
            ComponentMap[comp].scripts.forEach(script => {
              promises.push(
                PCore.getAssetLoader().getLoader()(script, 'script')
              );
            });
          }
        }
      }
    });
    /* Promise.all rejects or accepts all or none. This causes entire component loader to fail
      in case there is a single failure.
      Using allSettled to allow Promise to be resolved even if there are failed components
      Note : This is a liberty taken at component loader and unwise to be used at
      asset loader which will still use Promise.all
      */
    await Promise.allSettled(promises);
  });
});

export default createPConnectComponent;

/* These APIs need to be exposed for authoring bridge
Will be removed when pxbootstrap and constellation_bridge is cleaned up
to use single bootstrap file from constellation  */
// window.authoringUtils = {
//   createElement,
//   render,
//   unmountComponentAtNode,
//   LazyComponentMap
// };
