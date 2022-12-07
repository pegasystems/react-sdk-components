// Helper singleton class to assist with loading and
//  accessing the SDK components
// import localSdkComponentMap from '../../sdk-local-component-map';
import pegaSdkComponentMap from '../../sdk-pega-component-map';

// Statically load all "local" components
// import AppAnnouncement from '../components/widgets/AppAnnouncement';
// import AppShell from '../components/templates/AppShell';
// import Attachment from '../components/Attachment';
// import AutoComplete from '../components/forms/AutoComplete';
// import CaseHistory from '../components/widgets/CaseHistory';
// import CaseSummary from '../components/templates/CaseSummary';
// import CaseView from '../components/templates/CaseView';
// import CheckboxComponent from '../components/forms/Checkbox';
// import Currency from '../components/forms/Currency';
// import Date from '../components/forms/Date';
// import DateTime from '../components/forms/DateTime';
// import Decimal from '../components/forms/Decimal';
// import DeferLoad from '../components/DeferLoad';
// import Dropdown from '../components/forms/Dropdown';
// import Email from '../components/forms/Email';
// import ErrorBoundary from '../components/ErrorBoundary';
// import FileUtility from '../components/widgets/FileUtility';
// import FlowContainer from '../components/FlowContainer';
// import Followers from '../components/widgets/Followers';
// import Integer from '../components/forms/Integer';
// import Percentage from '../components/forms/Percentage';
// import Phone from '../components/forms/Phone';
// import Pulse from '../components/Pulse';
// import RadioButtons from '../components/forms/RadioButtons';
// import Reference from '../components/Reference';
// import Region from '../components/Region';
// import RootContainer from '../components/RootContainer';
// import SimpleTable from '../components/templates/SimpleTable';
// import Stages from '../components/Stages';
// import TextArea from '../components/forms/TextArea';
// import TextContent from '../components/forms/TextContent';
// import TextInput from '../components/forms/TextInput';
// import Time from '../components/forms/Time';
// import ToDo from '../components/ToDo';
// import URLComponent from '../components/forms/URL';
// import View from '../components/View';
// import ViewContainer from '../components/ViewContainer';
// import ModalViewContainer from '../components/ModalViewContainer';
// import SimpleTableSelect from '../components/templates/SimpleTableSelect';
// import PromotedFilters from '../components/templates/PromotedFilters';
// import DataReference from '../components/templates/DataReference';
// import SemanticLink from '../components/forms/SemanticLink';
// import UserReference from '../components/forms/UserReference';

// Create a singleton for this class (with async loading of components map file) and export it
// Note: Initializing SdkComponentMap to null seems to cause lots of compile issues with references
//  within other components and the value potentially being null (so try to leave it undefined)
// eslint-disable-next-line import/no-mutable-exports
export let SdkComponentMap;
let SdkComponentMapCreateInProgress = false;

interface ISdkComponentMap {
  localComponentMap: Object,
  pegaProvidedComponentMap: Object
}

class ComponentMap {
  sdkComponentMap: ISdkComponentMap;            // Top level object
  isComponentMapLoaded: boolean;
  // localComponentMap: {};          // Map of component names/locations in this SDK instance
  // pegaProvidedComponentMap: {}    // Map of component names/locations for components obtained from npm module

  constructor() {
    // sdkComponentMap is top-level object
    this.sdkComponentMap = { localComponentMap: {}, pegaProvidedComponentMap: {} };

    // isCoComponentMapLoaded will be updated to true after the async load is complete
    this.isComponentMapLoaded = false;

    // pegaSdkComponents.local is the JSON object where we'll store the components that are
    // found locally or can be found in the Pega-provided repo
    this.sdkComponentMap.localComponentMap = { };

    // Changing to read/load these from sdk-local-component-map.json
    // {
    //   'AppAnnouncement': AppAnnouncement,
    //   'AppShell': AppShell,
    //   'Attachment': Attachment,
    //   'AutoComplete': AutoComplete,
    //   'CaseHistory': CaseHistory,
    //   'CaseSummary': CaseSummary,
    //   'CaseView': CaseView,
    //   'CheckboxComponent': CheckboxComponent,
    //   'Currency': Currency,
    //   'Date': Date,
    //   'DateTime': DateTime,
    //   'Decimal': Decimal,
    //   'DeferLoad': DeferLoad,
    //   'Dropdown': Dropdown,
    //   'Email': Email,
    //   'ErrorBoundary': ErrorBoundary,
    //   'FileUtility': FileUtility,
    //   'FlowContainer': FlowContainer,
    //   'Followers': Followers,
    //   'Integer': Integer,
    //   'Percentage': Percentage,
    //   'Phone': Phone,
    //   'Pulse': Pulse,
    //   'RadioButtons': RadioButtons,
    //   'Reference': Reference,
    //   'Region': Region,
    //   'RootContainer': RootContainer,
    //   'SimpleTable': SimpleTable,
    //   'Stages': Stages,
    //   'TextArea': TextArea,
    //   'TextContent': TextContent,
    //   'TextInput': TextInput,
    //   'Time': Time,
    //   'ToDo': ToDo,
    //   'URLComponent': URLComponent,
    //   'View': View,
    //   'ViewContainer': ViewContainer,
    //   'ModalViewContainer': ModalViewContainer,
    //   'SimpleTableSelect': SimpleTableSelect,
    //   'PromotedFilters': PromotedFilters,
    //   'DataReference': DataReference,
    //   'SemanticLink': SemanticLink,
    //   'UserReference': UserReference
    // };

    this.sdkComponentMap.pegaProvidedComponentMap = { };

    // The "work" to load the config file is done (asynchronously) via the initialize
    //  (Factory function) below)

  }

  /**
   * Asynchronous initialization of the config file contents.
   * @returns Promise of config file fetch
   */
   async readSdkComponentMap(inLocalSdkComponentMap = {}) {
    // debugger;
    if( Object.keys(this.sdkComponentMap.localComponentMap).length === 0 && Object.keys(this.sdkComponentMap.pegaProvidedComponentMap).length === 0) {

      const theLocalCompPromise = this.readLocalSdkComponentMap(inLocalSdkComponentMap);
      const thePegaCompPromise = this.readPegaSdkComponentMap(pegaSdkComponentMap);

      Promise.all([theLocalCompPromise, thePegaCompPromise]).then((results) => {
        return this.sdkComponentMap;
      }).catch((error) => {
        console.error(`Error in readSdkComponentMap`);
      })

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
  }

  setLocalComponentMap(inLocalSdkComponentMap) {
    return this.sdkComponentMap.localComponentMap = inLocalSdkComponentMap;
  }

  getPegaProvidedComponentMap = () => {
    return this.sdkComponentMap.pegaProvidedComponentMap;
  }

  setPegaProvidedComponentMap = (inPegaProvidedComponentMap) => {
    return this.sdkComponentMap.pegaProvidedComponentMap = inPegaProvidedComponentMap
  }

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
  return new Promise( (resolve) => {
    let idNextCheck;
    if( !SdkComponentMap && !SdkComponentMapCreateInProgress ) {
      SdkComponentMapCreateInProgress = true;
      createSdkComponentMap(inLocalComponentMap).then( theComponentMap => {
        // debugger;
        // Key initialization of SdkComponentMap
        SdkComponentMap = theComponentMap;
        SdkComponentMapCreateInProgress = false;
        // eslint-disable-next-line no-console
        console.log(`getSdkComponentMap: created SdkComponentMap singleton`);
        // Create and dispatch the SdkConfigAccessReady event
        //  Not used anyplace yet but putting it in place in case we need it.
        const event = new CustomEvent("SdkComponentMapReady", { });
        document.dispatchEvent(event);
        return resolve( SdkComponentMap /* .sdkComponentMap */ );
      });
    } else {
      const fnCheckForConfig = () => {
        if( SdkComponentMap ) {
          if( idNextCheck ) {
            clearInterval(idNextCheck);
          }
          return resolve( SdkComponentMap.sdkComponentMap );
        }
        idNextCheck = setInterval(fnCheckForConfig, 500);
      };
      if( SdkComponentMap ) {
        return resolve( SdkComponentMap.sdkComponentMap );
      } else {
        idNextCheck = setInterval(fnCheckForConfig, 500);
      }
    }
  });
}
