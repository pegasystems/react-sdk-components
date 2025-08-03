// import loadable from "@loadable/component";

import pegaSdkComponentMap from './sdk-pega-component-map';

const ComponentMap: any = { ...pegaSdkComponentMap };

export function registerComponentMap() {
  PCore.setBehaviorOverride('dynamicLoadComponents', true);

  PCore.getAssetLoader().register('component-loader', async (componentNames = []) => {
    const promises: any = [];
    componentNames.forEach(comp => {
      if (!PCore.getComponentsRegistry().getLazyComponent(comp)) {
        if (!PCore.getComponentsRegistry().getComponent(comp)) {
          if (PCore.getComponentsRegistry().getCustomComponent(comp)) {
            return;
          }
          if (comp !== undefined) {
            PCore.getComponentsRegistry().registerCustomComponentLazyMap(comp, comp);
            promises.push(PCore.getAssetLoader().loadSvcComponent(`${comp}.js`));
          }
        } else {
          if (PCore.getComponentsRegistry().getComponent(comp).modules && PCore.getComponentsRegistry().getComponent(comp).modules.length) {
            PCore.getComponentsRegistry()
              .getComponent(comp)
              .modules.forEach(module => {
                promises.push(module());
              });
          }
          if (PCore.getComponentsRegistry().getComponent(comp).scripts && PCore.getComponentsRegistry().getComponent(comp).scripts.length) {
            PCore.getComponentsRegistry()
              .getComponent(comp)
              .scripts.forEach(script => {
                promises.push(PCore.getAssetLoader().getLoader()(script, 'script'));
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

  PCore.getComponentsRegistry().mergeComponentsMap(ComponentMap);

  PCore.getPubSubUtils().publish('component-map-loaded');
}

export default ComponentMap;
