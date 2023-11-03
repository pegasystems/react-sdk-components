// Constants used in the build-overrides.js script

// array of directory names that contain components or helper code in the React SDK
const sdkCompSubDirs = ['designSystemExtension', 'field', 'helpers', 'infra', 'template', 'widget' ];

// array of bridge dir (just an array for symmetry with sdkCompSubDirs)
const sdkBridgeDir = [ 'bridge' ];

// array of types dir (just an array for symmetry with sdkCompSubDirs)
const sdkTypesDir = [ 'types' ];

// array of hooks dir (just an array for symmetry with sdkCompSubDirs)
const sdkHooksDir = [ 'hooks' ];

// array of top level content (@pega/react-sdk-components/lib) that we needs to be exposed
const sdkTopLevelContent = [ 'components_map' ];

// associative array where <key> is component name (or other file) and <value> is its top-level component directory
//  where that file is found
//  ex: 'TextInput': 'field' indicates that there's TextInput is in the components/field directory
//    'SimpleTable' is in 'template/SimpleTable/SimpleTable' subdirectory
const sdkComponentLocationMap = {
  'ActionButtons': 'infra',
  'ActionButtonsForFileUtil': 'widget/FileUtility',
  'AlertBanner': 'designSystemExtension',
  'AppAnnouncement': 'widget',
  'AppShell': 'template',
  'Assignment': 'infra',
  'AssignmentCard': 'infra',
  'Attachment': 'widget',
  'AutoComplete': 'field',
  'Banner': 'designSystemExtension',
  'BannerPage': 'template',
  'CancelAlert': 'field',
  'CaseHistory': 'widget',
  'CaseSummary': 'template',
  'CaseSummaryFields': 'designSystemExtension',
  'CaseView': 'template',
  'CaseViewActionsMenu': 'template',
  'Checkbox': 'field',
  'Confirmation': 'template',
  'Currency': 'field',
  'DashboardFilter': 'infra',
  'DataReference': 'template',
  'Date': 'field',
  'DateTime': 'field',
  'Decimal': 'field',
  'DefaultForm': 'template',
  'DeferLoad': 'infra',
  'Details': 'template',
  'DetailsSubTabs': 'template',
  'DetailsThreeColumn': 'template',
  'DetailsTwoColumn': 'template',
  'Dropdown': 'field',
  'Email': 'field',
  'ErrorBoundary': 'infra',
  'FieldGroup': 'designSystemExtension',
  'FieldGroupList': 'designSystemExtension',
  'FieldGroupTemplate': 'template',
  'FieldValueList': 'designSystemExtension',
  'FileUtility': 'widget/FileUtility',
  'FlowContainer': 'infra',
  'Followers': 'widget',
  'InlineDashboard': 'template',
  'InlineDashboardPage': 'template',
  'Integer': 'field',
  'LeftAlignVerticalTabs': 'infra/VerticalTabs',
  'ListPage': 'template',
  'ListView': 'template',
  'ModalViewContainer': 'infra',
  'MultiReferenceReadOnly': 'template',
  'MultiStep': 'infra',
  'NarrowWide': 'template',
  'NarrowWideDetails': 'template',
  'NarrowWideForm': 'template',
  'NarrowWidePage': 'template',
  'NavBar': 'infra',
  'OneColumn': 'template',
  'OneColumnPage': 'template',
  'OneColumnTab': 'template',
  'Operator': 'designSystemExtension',
  'Percentage': 'field',
  'Phone': 'field',
  'PromotedFilters': 'template',
  'Pulse': 'designSystemExtension',
  'QuickCreate': 'widget',
  'RadioButtons': 'field',
  'reference': 'infra',
  'Region': 'infra',
  'RootContainer': 'infra',
  'ScalarList': 'field',
  'SemanticLink': 'field',
  'SimpleTable': 'template/SimpleTable',
  'SimpleTableManual': 'template/SimpleTable',
  'SimpleTableSelect': 'template/SimpleTable',
  'SingleReferenceReadOnly': 'template',
  'Stages': 'infra',
  'SubTabs': 'template',
  'SummaryItem': 'widget',
  'SummaryList': 'widget',
  'TextArea': 'field',
  'TextContent': 'field',
  'TextInput': 'field',
  'Time': 'field',
  'ToDo': 'widget',
  'TwoColumn': 'template',
  'TwoColumnPage': 'template',
  'TwoColumnTab': 'template',
  'URL': 'field',
  'UserReference': 'field',
  'VerticalTabs': 'infra/VerticalTabs',
  'View': 'infra',
  'ViewContainer': 'infra',
  'WideNarrow': 'template',
  'WideNarrowDetails': 'template',
  'WideNarrowForm': 'template',
  'WideNarrowPage': 'template',
  'WssNavBar': 'template',
  'WssQuickCreate': 'designSystemExtension'
};

// Now package them up so they can be 'require'd from build-overrides.js
module.exports = {
  SDK_COMP_SUBDIRS: sdkCompSubDirs,
  SDK_BRIDGE_DIR: sdkBridgeDir,
  SDK_TYPES_DIR: sdkTypesDir,
  SDK_HOOKS_DIR: sdkHooksDir,
  SDK_TOP_LEVEL_CONTENT: sdkTopLevelContent,
  SDK_COMP_LOCATION_MAP: sdkComponentLocationMap
}
