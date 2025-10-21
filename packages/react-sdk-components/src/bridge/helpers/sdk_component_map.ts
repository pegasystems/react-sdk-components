// Helper singleton class to assist with loading and
//  accessing the SDK components
// import localSdkComponentMap from '../../sdk-local-component-map';
import pegaSdkComponentMap from '../../sdk-pega-component-map';

// Statically load all "local" components

// Create a singleton for this class (with async loading of components map file) and export it
// Note: Initializing SdkComponentMap to null seems to cause lots of compile issues with references
//  within other components and the value potentially being null (so try to leave it undefined)

export let SdkComponentMap;
let SdkComponentMapCreateInProgress = false;

interface ISdkComponentMap {
  localComponentMap: object;
  pegaProvidedComponentMap: object;
}

class ComponentMap {
  sdkComponentMap: ISdkComponentMap; // Top level object
  isComponentMapLoaded: boolean;

  constructor() {
    // sdkComponentMap is top-level object
    this.sdkComponentMap = {
      localComponentMap: {},
      pegaProvidedComponentMap: {}
    };

    // isCoComponentMapLoaded will be updated to true after the async load is complete
    this.isComponentMapLoaded = false;

    // pegaSdkComponents.local is the JSON object where we'll store the components that are
    // found locally or can be found in the Pega-provided repo
    this.sdkComponentMap.localComponentMap = {};

    this.sdkComponentMap.pegaProvidedComponentMap = {};

    // The "work" to load the config file is done (asynchronously) via the initialize
    //  (Factory function) below)
  }

  /**
   * Asynchronous initialization of the config file contents.
   * @returns Promise of config file fetch
   */
  async readSdkComponentMap(inLocalSdkComponentMap = {}) {
    // debugger;
    if (Object.keys(this.sdkComponentMap.localComponentMap).length === 0 && Object.keys(this.sdkComponentMap.pegaProvidedComponentMap).length === 0) {
      const theLocalCompPromise = this.readLocalSdkComponentMap(inLocalSdkComponentMap);
      const thePegaCompPromise = this.readPegaSdkComponentMap(pegaSdkComponentMap);

      Promise.all([theLocalCompPromise, thePegaCompPromise])
        .then(() => this.sdkComponentMap)
        .catch(error => {
          console.error(`Error in readSdkComponentMap: ${error}`);
        });
    } else {
      return Promise.resolve(this.sdkComponentMap);
    }
  }

  async readLocalSdkComponentMap(inLocalSdkComponentMap = {}) {
    // debugger;
    if (Object.entries(this.getLocalComponentMap()).length === 0) {
      this.sdkComponentMap.localComponentMap = inLocalSdkComponentMap;
    }
    return Promise.resolve(this);
  }

  async readPegaSdkComponentMap(inPegaSdkComponentMap = {}) {
    // debugger;
    if (Object.entries(this.getPegaProvidedComponentMap()).length === 0) {
      this.sdkComponentMap.pegaProvidedComponentMap = inPegaSdkComponentMap;
    }
    return Promise.resolve(this);
  }

  getLocalComponentMap = () => {
    return this.sdkComponentMap.localComponentMap;
  };

  setLocalComponentMap(inLocalSdkComponentMap) {
    this.sdkComponentMap.localComponentMap = inLocalSdkComponentMap;
    return this.sdkComponentMap.localComponentMap;
  }

  getPegaProvidedComponentMap = () => {
    return this.sdkComponentMap.pegaProvidedComponentMap;
  };

  setPegaProvidedComponentMap = inPegaProvidedComponentMap => {
    this.sdkComponentMap.pegaProvidedComponentMap = inPegaProvidedComponentMap;
    return this.sdkComponentMap.pegaProvidedComponentMap;
  };
}

export function getComponentFromMap(inComponentName: string): any {
  let theComponentImplementation = null;
  const theLocalComponent = SdkComponentMap.getLocalComponentMap()[inComponentName];
  if (theLocalComponent !== undefined) {
    console.log(`Requested component found ${inComponentName}: Local`);
    theComponentImplementation = theLocalComponent;
  } else {
    const thePegaProvidedComponent = SdkComponentMap.getPegaProvidedComponentMap()[inComponentName];
    if (thePegaProvidedComponent !== undefined) {
      // console.log(`Requested component found ${inComponentName}: Pega-provided`);
      theComponentImplementation = thePegaProvidedComponent;
    } else {
      console.error(`Requested component has neither Local nor Pega-provided implementation: ${inComponentName}`);
      theComponentImplementation = getComponentFromMap('ErrorBoundary');
    }
  }
  return theComponentImplementation;
}

// Implement Factory function to allow async load
//  See https://stackoverflow.com/questions/49905178/asynchronous-operations-in-constructor/49906064#49906064 for inspiration
async function createSdkComponentMap(inLocalComponentMap = {}) {
  // Note that our initialize function returns a promise...
  const singleton = new ComponentMap();
  await singleton.readSdkComponentMap(inLocalComponentMap);
  return singleton;
}

// Initialize exported SdkComponentMap structure
export async function getSdkComponentMap(inLocalComponentMap = {}) {
  return new Promise(resolve => {
    let idNextCheck;
    if (!SdkComponentMap && !SdkComponentMapCreateInProgress) {
      SdkComponentMapCreateInProgress = true;
      createSdkComponentMap(inLocalComponentMap).then(theComponentMap => {
        // debugger;
        // Key initialization of SdkComponentMap
        SdkComponentMap = theComponentMap;
        SdkComponentMapCreateInProgress = false;

        console.log(`getSdkComponentMap: created SdkComponentMap singleton`);
        // Create and dispatch the SdkConfigAccessReady event
        //  Not used anyplace yet but putting it in place in case we need it.
        const event = new CustomEvent('SdkComponentMapReady', {});
        document.dispatchEvent(event);
        return resolve(SdkComponentMap /* .sdkComponentMap */);
      });
    } else {
      const fnCheckForConfig = () => {
        if (SdkComponentMap) {
          if (idNextCheck) {
            clearInterval(idNextCheck);
          }
          return resolve(SdkComponentMap.sdkComponentMap);
        }
        idNextCheck = setInterval(fnCheckForConfig, 500);
      };
      if (SdkComponentMap) {
        return resolve(SdkComponentMap.sdkComponentMap);
      }
      idNextCheck = setInterval(fnCheckForConfig, 500);
    }
  });
}
