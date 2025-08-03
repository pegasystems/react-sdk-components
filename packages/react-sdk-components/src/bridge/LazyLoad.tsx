import { createElement, Component } from 'react';

interface LazyLoadProps {
  componentName?: string;
  [key: string]: any;
}

interface LazyLoadState {
  componentLoaded: boolean;
}

class LazyLoad extends Component<LazyLoadProps, LazyLoadState> {
  constructor(props) {
    super(props);
    this.state = {
      componentLoaded: false
    };
  }

  override render() {
    if (!this.props) {
      return null;
    }
    const componentName = this.props.componentName || this.props.getPConnect().getComponentName();
    if (!PCore.getComponentsRegistry().getLazyComponent(componentName) && !this.state.componentLoaded) {
      PCore.getAssetLoader()
        .getLoader('component-loader')([componentName])
        .then(() => {
          this.setState({
            componentLoaded: true
          });
        });
    }

    if (PCore.getComponentsRegistry().getLazyComponent(componentName)) {
      const component: any = PCore.getComponentsRegistry().getLazyComponent(componentName) || window[componentName];
      return createElement(component, this.props);
    }

    return null;
  }
}

export default LazyLoad;
