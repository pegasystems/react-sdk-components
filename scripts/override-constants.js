// Constants used in the build-overrides.js script

// array of directory names that contain components or helper code in the React SDK
const sdkCompSubDirs = ['designSystemExtensions', 'forms', 'helpers', 'infra', 'templates', 'widgets' ];

// array of bridge dir (just an array for symmetry with sdkCompSubDirs)
const sdkBridgeDir = [ 'bridge'];

// array of top level content (@pega/react-sdk-components/lib) that we needs to be exposed
const sdkTopLevelContent = [ 'components_map' ];

// associative array where <key> is component name and <value> is its top-level component directory
//  ex: 'TextInput': 'forms' indicates that there's TextInput is in the components/forms directory
const sdkComponentLocationMap = {
  'ActionButtons': 'infra',
  'AppAnnouncement': 'widgets',
  'AppShell': 'templates',
  'Assignment': 'infra',
  'AssignmentCard': 'infra',
  'Attachment': 'infra',
  'AutoComplete': 'forms',
  'CancelAlert': 'forms',
  'CaseHistory': 'widgets',
  'CaseSummary': 'templates',
  'CaseSummaryFields': 'designSystemExtensions',
  'CaseView': 'templates',
  'Checkbox': 'forms',
  'Currency': 'forms',
  'DashboardFilter': 'infra',
  'DataReference': 'templates',
  'Date': 'forms',
  'DateTime': 'forms',
  'Decimal': 'forms',
  'DefaultForm': 'templates',
  'DeferLoad': 'infra',
  'Details': 'templates',
  'DetailsSubTabs': 'templates',
  'DetailsThreeColumn': 'templates',
  'DetailsTwoColumn': 'templates',
  'Dropdown': 'forms',
  'Email': 'forms',
  'ErrorBoundary': 'infra',
  'FieldGroupTemplate': 'templates',
  'FileUtility': 'widgets',
  'FlowContainer': 'infra',
  'Followers': 'widgets',
  'InlineDashboard': 'templates',
  'InlineDashboardPage': 'templates',
  'Integer': 'forms',
  'ListPage': 'templates',
  'ListView': 'templates',
  'ModalViewContainer': 'infra',
  'MultiReferenceReadOnly': 'templates',
  'MultiStep': 'infra',
  'NarrowWide': 'templates',
  'NarrowWideDetails': 'templates',
  'NarrowWideForm': 'templates',
  'NarrowWidePage': 'templates',
  'NavBar': 'infra',
  'OneColumn': 'templates',
  'OneColumnPage': 'templates',
  'OneColumnTab': 'templates',
  'Operator': 'designSystemExtensions',
  'Percentage': 'forms',
  'Phone': 'forms',
  'PromotedFilters': 'templates',
  'Pulse': 'designSystemExtensions',
  'reference': 'infra',
  'RadioButtons': 'forms',
  'Region': 'infra',
  'RootContainer': 'infra',
  'SemanticLink': 'forms',
  'SimpleTable': 'templates',
  'SimpleTableManual': 'templates',
  'SimpleTableSelect': 'templates',
  'SingleReferenceReadOnly': 'templates',
  'Stages': 'infra',
  'SubTabs': 'templates',
  'SummaryItem': 'widgets',
  'SummaryList': 'widgets',
  'TextArea': 'forms',
  'TextContent': 'forms',
  'TextInput': 'forms',
  'Time': 'forms',
  'ToDo': 'infra',
  'TwoColumn': 'templates',
  'TwoColumnPage': 'templates',
  'TwoColumnTab': 'templates',
  'URL': 'forms',
  'UserReference': 'forms',
  'VerticalTabs': 'infra',
  'View': 'infra',
  'ViewContainer': 'infra',
  'WideNarrow': 'templates',
  'WideNarrowDetails': 'templates',
  'WideNarrowForm': 'templates',
  'WideNarrowPage': 'templates'
};

// Now package them up so they can be 'require'd from build-overrides.js
module.exports = {
  SDK_COMP_SUBDIRS: sdkCompSubDirs,
  SDK_BRIDGE_DIR: sdkBridgeDir,
  SDK_TOP_LEVEL_CONTENT: sdkTopLevelContent,
  SDK_COMP_LOCATION_MAP: sdkComponentLocationMap
}
