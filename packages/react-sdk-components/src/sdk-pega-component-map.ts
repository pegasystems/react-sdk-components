// When this code is run from the generated npm module, the components are
//  placed in the npm module's 'lib' directory. So, we expect to import from there.
//  This file should import and expose ALL of the components that may be
//  dynamically rendered at runtime via calls to react_pconnect or the View component

// pegaSdkComponentMap is the JSON object where we'll store the components that are
// the default implementations provided by the SDK. These will be used if there isn't
// an entry in the localSdkComponentMap

// NOTE: A few components have non-standard capitalization:
//  'reference' is what's in the metadata, not Reference
//  'Todo' is what's in the metadata, not ToDo
//  Also, note that "Checkbox" component is named/exported as CheckboxComponent

export const CustomComponentLazyMap = {};
export const LazyMap = {};

function getComponentLocationOverride(comp) {
  if (comp && process.env.NODE_ENV === 'development') {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    return params[comp];
  }
  return false;
}

export const loadable = (importFn, componentName, overrideQueryParam?) => {
  return async () => {
    if (!LazyMap[componentName]) {
      const compLocation = getComponentLocationOverride(overrideQueryParam);
      if (compLocation) {
        const component = await import(/* webpackIgnore: true */ compLocation);
        // Authoring dev-server exports 'IconPicker', not 'AuthoringIconPicker'
        let exportedComponentName = componentName;
        if (componentName === 'AuthoringIconPicker') {
          exportedComponentName = 'IconPicker';
        }
        LazyMap[componentName] = component[exportedComponentName];
      } else {
        const component = await importFn();
        LazyMap[componentName] = component.default;
      }
      PCore.getComponentsRegistry().registerLazyMap(componentName, LazyMap[componentName]);
    }
  };
};

const pegaSdkComponentMap = {
  RootContainer: { modules: [loadable(() => import(/* webpackChunkName: "RootContainer" */ './components/infra/RootContainer'), 'RootContainer')] },
  ViewContainer: {
    modules: [loadable(() => import(/* webpackChunkName: "ViewContainer" */ './components/infra/Containers/ViewContainer'), 'ViewContainer')]
  },
  ModalViewContainer: {
    modules: [
      loadable(() => import(/* webpackChunkName: "ModalViewContainer" */ './components/infra/Containers/ModalViewContainer'), 'ModalViewContainer')
    ]
  },
  PreviewViewContainer: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "PreviewViewContainer" */ './components/infra/Containers/PreviewViewContainer'),
        'PreviewViewContainer'
      )
    ]
  },
  reference: {
    modules: [loadable(() => import(/* webpackChunkName: "Reference" */ './components/infra/Reference'), 'reference')]
  },
  FlowContainer: {
    modules: [loadable(() => import(/* webpackChunkName: "FlowContainer" */ './components/infra/Containers/FlowContainer'), 'FlowContainer')]
  },
  DeferLoad: {
    modules: [loadable(() => import(/* webpackChunkName: "DeferLoad" */ './components/infra/DeferLoad'), 'DeferLoad')]
  },
  LoadingComponent: {
    modules: [loadable(() => import(/* webpackChunkName: "Loading" */ './components/Loading'), 'LoadingComponent')]
  },
  Todo: {
    modules: [loadable(() => import(/* webpackChunkName: "Todo" */ './components/widget/ToDo'), 'Todo')]
  },
  View: {
    modules: [loadable(() => import(/* webpackChunkName: "View" */ './components/infra/View'), 'View')]
  },
  Region: {
    modules: [loadable(() => import(/* webpackChunkName: "Region" */ './components/infra/Region'), 'Region')]
  },
  Currency: {
    modules: [loadable(() => import(/* webpackChunkName: "Currency" */ './components/field/Currency'), 'Currency')]
  },
  Dropdown: {
    modules: [loadable(() => import(/* webpackChunkName: "Dropdown" */ './components/field/Dropdown'), 'Dropdown')]
  },
  TextInput: {
    modules: [loadable(() => import(/* webpackChunkName: "TextInput" */ './components/field/TextInput'), 'TextInput')]
  },
  Phone: {
    modules: [loadable(() => import(/* webpackChunkName: "Phone" */ './components/field/Phone'), 'Phone')]
  },
  Percentage: {
    modules: [loadable(() => import(/* webpackChunkName: "Percentage" */ './components/field/Percentage'), 'Percentage')]
  },
  Email: {
    modules: [loadable(() => import(/* webpackChunkName: "Email" */ './components/field/Email'), 'Email')]
  },
  Integer: {
    modules: [loadable(() => import(/* webpackChunkName: "Integer" */ './components/field/Integer'), 'Integer')]
  },
  Decimal: {
    modules: [loadable(() => import(/* webpackChunkName: "Decimal" */ './components/field/Decimal'), 'Decimal')]
  },
  URL: {
    modules: [loadable(() => import(/* webpackChunkName: "URL" */ './components/field/URL'), 'URL')]
  },
  SemanticLink: {
    modules: [loadable(() => import(/* webpackChunkName: "SemanticLink" */ './components/field/SemanticLink'), 'SemanticLink')]
  },
  Checkbox: {
    modules: [loadable(() => import(/* webpackChunkName: "Checkbox" */ './components/field/Checkbox'), 'Checkbox')]
  },
  RadioButtons: {
    modules: [loadable(() => import(/* webpackChunkName: "RadioButtons" */ './components/field/RadioButtons'), 'RadioButtons')]
  },
  DateTime: {
    modules: [loadable(() => import(/* webpackChunkName: "DateTime" */ './components/field/DateTime'), 'DateTime')]
  },
  Date: {
    modules: [loadable(() => import(/* webpackChunkName: "Date" */ './components/field/Date'), 'Date')]
  },
  Time: {
    modules: [loadable(() => import(/* webpackChunkName: "Time" */ './components/field/Time'), 'Time')]
  },
  Text: {
    modules: [loadable(() => import(/* webpackChunkName: "Text" */ './components/field/TextContent'), 'Text')]
  },
  TextArea: {
    modules: [loadable(() => import(/* webpackChunkName: "TextArea" */ './components/field/TextArea'), 'TextArea')]
  },
  TextContent: {
    modules: [loadable(() => import(/* webpackChunkName: "TextContent" */ './components/field/TextContent'), 'TextContent')]
  },
  RichText: {
    modules: [loadable(() => import(/* webpackChunkName: "RichText" */ './components/field/RichText'), 'RichText')]
  },
  Pulse: {
    modules: [loadable(() => import(/* webpackChunkName: "Pulse" */ './components/designSystemExtension/Pulse'), 'Pulse')]
  },
  AppShell: {
    modules: [loadable(() => import(/* webpackChunkName: "AppShell" */ './components/template/AppShell'), 'AppShell')]
  },
  ListView: {
    modules: [loadable(() => import(/* webpackChunkName: "ListView" */ './components/template/ListView'), 'ListView')]
  },
  SimpleTable: {
    modules: [loadable(() => import(/* webpackChunkName: "SimpleTable" */ './components/template/SimpleTable/SimpleTable'), 'SimpleTable')]
  },
  DataReference: {
    modules: [loadable(() => import(/* webpackChunkName: "DataReference" */ './components/template/DataReference'), 'DataReference')]
  },
  ListPage: {
    modules: [loadable(() => import(/* webpackChunkName: "ListPage" */ './components/template/ListPage'), 'ListPage')]
  },
  OneColumnPage: {
    modules: [loadable(() => import(/* webpackChunkName: "OneColumnPage" */ './components/template/OneColumn/OneColumnPage'), 'OneColumnPage')]
  },
  TwoColumnPage: {
    modules: [loadable(() => import(/* webpackChunkName: "TwoColumnPage" */ './components/template/TwoColumn/TwoColumnPage'), 'TwoColumnPage')]
  },
  NarrowWidePage: {
    modules: [loadable(() => import(/* webpackChunkName: "NarrowWidePage" */ './components/template/NarrowWide/NarrowWidePage'), 'NarrowWidePage')]
  },
  WideNarrowPage: {
    modules: [loadable(() => import(/* webpackChunkName: "WideNarrowPage" */ './components/template/WideNarrow/WideNarrowPage'), 'WideNarrowPage')]
  },
  OneColumn: {
    modules: [loadable(() => import(/* webpackChunkName: "OneColumn" */ './components/template/OneColumn/OneColumn'), 'OneColumn')]
  },
  TwoColumn: {
    modules: [loadable(() => import(/* webpackChunkName: "TwoColumn" */ './components/template/TwoColumn/TwoColumn'), 'TwoColumn')]
  },
  WideNarrow: {
    modules: [loadable(() => import(/* webpackChunkName: "WideNarrow" */ './components/template/WideNarrow/WideNarrow'), 'WideNarrow')]
  },
  NarrowWideForm: {
    modules: [loadable(() => import(/* webpackChunkName: "NarrowWideForm" */ './components/template/NarrowWide/NarrowWideForm'), 'NarrowWideForm')]
  },
  WideNarrowForm: {
    modules: [loadable(() => import(/* webpackChunkName: "WideNarrowForm" */ './components/template/WideNarrow/WideNarrowForm'), 'WideNarrowForm')]
  },
  DefaultForm: {
    modules: [loadable(() => import(/* webpackChunkName: "DefaultForm" */ './components/template/DefaultForm'), 'DefaultForm')]
  },
  OneColumnTab: {
    modules: [loadable(() => import(/* webpackChunkName: "OneColumnTab" */ './components/template/OneColumn/OneColumnTab'), 'OneColumnTab')]
  },
  TwoColumnTab: {
    modules: [loadable(() => import(/* webpackChunkName: "TwoColumnTab" */ './components/template/TwoColumn/TwoColumnTab'), 'TwoColumnTab')]
  },
  SubTabs: {
    modules: [loadable(() => import(/* webpackChunkName: "SubTabs" */ './components/template/SubTabs'), 'SubTabs')]
  },
  CaseView: {
    modules: [loadable(() => import(/* webpackChunkName: "CaseView" */ './components/template/CaseView'), 'CaseView')]
  },
  Assignment: {
    modules: [loadable(() => import(/* webpackChunkName: "Assignment" */ './components/infra/Assignment'), 'Assignment')]
  },
  CaseSummary: {
    modules: [loadable(() => import(/* webpackChunkName: "CaseSummary" */ './components/template/CaseSummary'), 'CaseSummary')]
  },
  Details: {
    modules: [loadable(() => import(/* webpackChunkName: "Details" */ './components/template/Details/Details'), 'Details')]
  },
  DetailsTwoColumn: {
    modules: [loadable(() => import(/* webpackChunkName: "DetailsTwoColumn" */ './components/template/Details/DetailsTwoColumn'), 'DetailsTwoColumn')]
  },
  DetailsThreeColumn: {
    modules: [
      loadable(() => import(/* webpackChunkName: "DetailsThreeColumn" */ './components/template/Details/DetailsThreeColumn'), 'DetailsThreeColumn')
    ]
  },
  DetailsSubTabs: {
    modules: [loadable(() => import(/* webpackChunkName: "DetailsSubTabs" */ './components/template/Details/DetailsSubTabs'), 'DetailsSubTabs')]
  },
  NarrowWideDetails: {
    modules: [
      loadable(() => import(/* webpackChunkName: "NarrowWideDetails" */ './components/template/NarrowWide/NarrowWideDetails'), 'NarrowWideDetails')
    ]
  },
  WideNarrowDetails: {
    modules: [
      loadable(() => import(/* webpackChunkName: "WideNarrowDetails" */ './components/template/WideNarrow/WideNarrowDetails'), 'WideNarrowDetails')
    ]
  },
  AppAnnouncement: {
    modules: [loadable(() => import(/* webpackChunkName: "AppAnnouncement" */ './components/widget/AppAnnouncement'), 'AppAnnouncement')]
  },
  CaseHistory: {
    modules: [loadable(() => import(/* webpackChunkName: "CaseHistory" */ './components/widget/CaseHistory'), 'CaseHistory')]
  },
  ErrorBoundary: {
    modules: [loadable(() => import(/* webpackChunkName: "ErrorBoundary" */ './components/infra/ErrorBoundary'), 'ErrorBoundary')]
  },
  Stages: {
    modules: [loadable(() => import(/* webpackChunkName: "Stages" */ './components/infra/Stages'), 'Stages')]
  },
  Attachment: {
    modules: [loadable(() => import(/* webpackChunkName: "Attachment" */ './components/widget/Attachment'), 'Attachment')]
  },
  FileUtility: {
    modules: [loadable(() => import(/* webpackChunkName: "FileUtility" */ './components/widget/FileUtility/FileUtility'), 'FileUtility')]
  },
  Followers: {
    modules: [loadable(() => import(/* webpackChunkName: "Followers" */ './components/widget/Followers'), 'Followers')]
  },
  AutoComplete: {
    modules: [loadable(() => import(/* webpackChunkName: "AutoComplete" */ './components/field/AutoComplete'), 'AutoComplete')]
  },
  UserReference: {
    modules: [loadable(() => import(/* webpackChunkName: "UserReference" */ './components/field/UserReference'), 'UserReference')]
  },

  ActionButtons: {
    modules: [loadable(() => import(/* webpackChunkName: "ActionButtons" */ './components/infra/ActionButtons'), 'ActionButtons')]
  },
  ActionButtonsForFileUtil: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "ActionButtonsForFileUtil" */ './components/widget/FileUtility/ActionButtonsForFileUtil'),
        'ActionButtonsForFileUtil'
      )
    ]
  },
  AlertBanner: {
    modules: [loadable(() => import(/* webpackChunkName: "AlertBanner" */ './components/designSystemExtension/AlertBanner'), 'AlertBanner')]
  },
  AssignmentCard: {
    modules: [loadable(() => import(/* webpackChunkName: "AssignmentCard" */ './components/infra/AssignmentCard/AssignmentCard'), 'AssignmentCard')]
  },
  Banner: {
    modules: [loadable(() => import(/* webpackChunkName: "Banner" */ './components/designSystemExtension/Banner'), 'Banner')]
  },
  BannerPage: {
    modules: [loadable(() => import(/* webpackChunkName: "BannerPage" */ './components/template/BannerPage'), 'BannerPage')]
  },
  CancelAlert: {
    modules: [loadable(() => import(/* webpackChunkName: "CancelAlert" */ './components/field/CancelAlert'), 'CancelAlert')]
  },
  CaseSummaryFields: {
    modules: [
      loadable(() => import(/* webpackChunkName: "CaseSummaryFields" */ './components/designSystemExtension/CaseSummaryFields'), 'CaseSummaryFields')
    ]
  },
  CaseViewActionsMenu: {
    modules: [
      loadable(() => import(/* webpackChunkName: "CaseViewActionsMenu" */ './components/template/CaseViewActionsMenu'), 'CaseViewActionsMenu')
    ]
  },
  Confirmation: {
    modules: [loadable(() => import(/* webpackChunkName: "Confirmation" */ './components/template/Confirmation'), 'Confirmation')]
  },
  DynamicTabs: {
    modules: [loadable(() => import(/* webpackChunkName: "DynamicTabs" */ './components/template/Details/DynamicTabs'), 'DynamicTabs')]
  },
  FieldGroup: {
    modules: [loadable(() => import(/* webpackChunkName: "FieldGroup" */ './components/designSystemExtension/FieldGroup'), 'FieldGroup')]
  },
  FieldGroupList: {
    modules: [loadable(() => import(/* webpackChunkName: "FieldGroupList" */ './components/designSystemExtension/FieldGroupList'), 'FieldGroupList')]
  },
  FieldGroupTemplate: {
    modules: [loadable(() => import(/* webpackChunkName: "FieldGroupTemplate" */ './components/template/FieldGroupTemplate'), 'FieldGroupTemplate')]
  },
  FieldValueList: {
    modules: [loadable(() => import(/* webpackChunkName: "FieldValueList" */ './components/designSystemExtension/FieldValueList'), 'FieldValueList')]
  },
  Group: {
    modules: [loadable(() => import(/* webpackChunkName: "Group" */ './components/field/Group'), 'Group')]
  },
  InlineDashboard: {
    modules: [loadable(() => import(/* webpackChunkName: "InlineDashboard" */ './components/template/InlineDashboard'), 'InlineDashboard')]
  },
  InlineDashboardPage: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "InlineDashboardPage" */ './components/template/InlineDashboardPage/InlineDashboardPage'),
        'InlineDashboardPage'
      )
    ]
  },
  LeftAlignVerticalTabs: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "LeftAlignVerticalTabs" */ './components/infra/VerticalTabs/LeftAlignVerticalTabs'),
        'LeftAlignVerticalTabs'
      )
    ]
  },
  ListViewActionButtons: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "ListViewActionButtons" */ './components/infra/Containers/ModalViewContainer/ListViewActionButtons'),
        'ListViewActionButtons'
      )
    ]
  },
  MultiReferenceReadOnly: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "MultiReferenceReadOnly" */ './components/template/MultiReferenceReadOnly'),
        'MultiReferenceReadOnly'
      )
    ]
  },
  Multiselect: {
    modules: [loadable(() => import(/* webpackChunkName: "Multiselect" */ './components/field/Multiselect/Multiselect'), 'Multiselect')]
  },
  MultiStep: {
    modules: [loadable(() => import(/* webpackChunkName: "MultiStep" */ './components/infra/MultiStep'), 'MultiStep')]
  },
  NarrowWide: {
    modules: [loadable(() => import(/* webpackChunkName: "NarrowWide" */ './components/template/NarrowWide/NarrowWide'), 'NarrowWide')]
  },
  NavBar: {
    modules: [loadable(() => import(/* webpackChunkName: "NavBar" */ './components/infra/NavBar'), 'NavBar')]
  },
  Operator: {
    modules: [loadable(() => import(/* webpackChunkName: "Operator" */ './components/designSystemExtension/Operator'), 'Operator')]
  },
  PromotedFilters: {
    modules: [loadable(() => import(/* webpackChunkName: "PromotedFilters" */ './components/template/PromotedFilters'), 'PromotedFilters')]
  },
  QuickCreate: {
    modules: [loadable(() => import(/* webpackChunkName: "QuickCreate" */ './components/widget/QuickCreate'), 'QuickCreate')]
  },
  RichTextEditor: {
    modules: [loadable(() => import(/* webpackChunkName: "RichTextEditor" */ './components/designSystemExtension/RichTextEditor'), 'RichTextEditor')]
  },
  ScalarList: {
    modules: [loadable(() => import(/* webpackChunkName: "ScalarList" */ './components/field/ScalarList'), 'ScalarList')]
  },
  SimpleTableManual: {
    modules: [
      loadable(() => import(/* webpackChunkName: "SimpleTableManual" */ './components/template/SimpleTable/SimpleTableManual'), 'SimpleTableManual')
    ]
  },
  SimpleTableSelect: {
    modules: [
      loadable(() => import(/* webpackChunkName: "SimpleTableSelect" */ './components/template/SimpleTable/SimpleTableSelect'), 'SimpleTableSelect')
    ]
  },
  SingleReferenceReadOnly: {
    modules: [
      loadable(
        () => import(/* webpackChunkName: "SingleReferenceReadOnly" */ './components/template/SingleReferenceReadOnly'),
        'SingleReferenceReadOnly'
      )
    ]
  },
  SummaryItem: {
    modules: [loadable(() => import(/* webpackChunkName: "SummaryItem" */ './components/widget/SummaryItem'), 'SummaryItem')]
  },
  SummaryList: {
    modules: [loadable(() => import(/* webpackChunkName: "SummaryList" */ './components/widget/SummaryList'), 'SummaryList')]
  },
  VerticalTabs: {
    modules: [loadable(() => import(/* webpackChunkName: "VerticalTabs" */ './components/infra/VerticalTabs/VerticalTabs'), 'VerticalTabs')]
  },
  WssNavBar: {
    modules: [loadable(() => import(/* webpackChunkName: "WssNavBar" */ './components/template/WssNavBar/WssNavBar'), 'WssNavBar')]
  },
  WssQuickCreate: {
    modules: [loadable(() => import(/* webpackChunkName: "WssQuickCreate" */ './components/designSystemExtension/WssQuickCreate'), 'WssQuickCreate')]
  }
};

export default pegaSdkComponentMap;
