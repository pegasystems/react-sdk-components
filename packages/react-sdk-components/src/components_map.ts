// import loadable from "@loadable/component";

const ComponentMap:any[] = [ {
  // Currency: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Currency" */ "./components/field/Currency")
  //     )
  //   ],
  //   scripts: []
  // },
  // DeferLoad: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "DeferLoad" */ "./components/DeferLoad")
  //     )
  //   ]
  // },
  // ViewContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ViewContainer" */
  //         "./components/ViewContainer"
  //       )
  //     )
  //   ]
  // },
  // PreviewViewContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "PreviewViewContainer" */
  //         "./components/PreviewViewContainer"
  //       )
  //     )
  //   ]
  // },
  // RootContainer: {
  //   modules: [
  //     loadable(() =>
  //     {
  //       import(
  //         /* webpackChunkName: "RootContainer" */
  //         "./components/RootContainer/index.tsx"
  //       )
  //     }
  //     )
  //   ]
  // },
  // HybridViewContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "HybridViewContainer" */
  //         "./components/HybridViewContainer"
  //       )
  //     )
  //   ]
  // },
  // ModalViewContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ModalViewContainer" */
  //         "./components/ModalViewContainer"
  //       )
  //     )
  //   ]
  // },
  // LoadingComponent: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Loading" */
  //         "./components/Loading"
  //       )
  //     )
  //   ]
  // },
  // FlowContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "FlowContainer" */
  //         "./components/FlowContainer"
  //       )
  //     )
  //   ]
  // },
  // CaseCreateStage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CaseCreateStage" */
  //         "./components/CaseCreateStage"
  //       )
  //     )
  //   ]
  // },
  // Todo: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Todo" */ "./components/widget/Todo")
  //     )
  //   ]
  // },
  // Assignment: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Assignment" */
  //         "./components/Assignment"
  //       )
  //     )
  //   ]
  // },
  // Panel: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Panel" */ "./components/Panel")
  //     )
  //   ]
  // },
  // TextInput: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TextInput" */ "./components/field/TextInput"
  //       )
  //     )
  //   ]
  // },
  // Phone: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Phone" */ "./components/field/Phone")
  //     )
  //   ]
  // },
  // Percentage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Percentage" */ "./components/field/Percentage"
  //       )
  //     )
  //   ]
  // },
  // Email: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Email" */ "./components/field/Email")
  //     )
  //   ]
  // },
  // Integer: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Integer" */ "./components/field/Integer")
  //     )
  //   ]
  // },
  // Decimal: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Decimal" */ "./components/field/Decimal")
  //     )
  //   ]
  // },
  // URL: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "URL" */ "./components/field/URL")
  //     )
  //   ]
  // },
  // SemanticLink: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "SemanticLink" */ "./components/field/SemanticLink"
  //       )
  //     )
  //   ]
  // },
  // View: {
  //   modules: [
  //     loadable(() => import(/* webpackChunkName: "View" */ "./components/View"))
  //   ]
  // },
  // Region: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Region" */ "./components/Region")
  //     )
  //   ]
  // },
  // Checkbox: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Checkbox" */ "./components/field/Checkbox")
  //     )
  //   ]
  // },
  // RadioButtons: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "RadioButtons" */
  //         "./components/field/RadioButtons"
  //       )
  //     )
  //   ]
  // },
  // DateTime: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "DateTime" */ "./components/field/DateTime")
  //     )
  //   ]
  // },
  // Date: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Date" */ "./components/field/Date")
  //     )
  //   ]
  // },
  // Time: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Time" */ "./components/field/Time")
  //     )
  //   ]
  // },
  // Text: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Text" */ "./components/field/Text")
  //     )
  //   ]
  // },
  // TextArea: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "TextArea" */ "./components/field/TextArea")
  //     )
  //   ]
  // },
  // TextContent: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TextContent" */ "./components/field/TextContent"
  //       )
  //     )
  //   ]
  // },
  // RichText: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "RichText" */ "./components/field/RichText")
  //     )
  //   ]
  // },
  // Pulse: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Pulse" */ "./components/FeedContainer")
  //     )
  //   ]
  // },
  // Activity: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Activity" */
  //         "./components/Activity/Activity"
  //       )
  //     )
  //   ]
  // },
  // ListView: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ListView" */
  //         "./components/template/ListView"
  //       )
  //     )
  //   ]
  // },
  // SimpleTable: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "SimpleTable" */
  //         "./components/template/SimpleTable"
  //       )
  //     )
  //   ]
  // },
  // DataReference: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DataReference" */
  //         "./components/template/DataReference"
  //       )
  //     )
  //   ]
  // },
  // ListPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ListPage" */
  //         "./components/template/ListPage"
  //       )
  //     )
  //   ]
  // },
  // OneColumnPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "OneColumnPage" */
  //         "./components/template/PageLayout/OneColumnPage"
  //       )
  //     )
  //   ]
  // },
  // TwoColumnPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TwoColumnPage" */
  //         "./components/template/PageLayout/TwoColumnPage"
  //       )
  //     )
  //   ]
  // },
  // ThreeColumnPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ThreeColumnPage" */
  //         "./components/template/PageLayout/ThreeColumnPage"
  //       )
  //     )
  //   ]
  // },
  // NarrowWidePage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "NarrowWidePage" */
  //         "./components/template/PageLayout/NarrowWidePage"
  //       )
  //     )
  //   ]
  // },
  // WideNarrowPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "WideNarrowPage" */
  //         "./components/template/PageLayout/WideNarrowPage"
  //       )
  //     )
  //   ]
  // },
  // Page: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Page" */ "./components/template/Page")
  //     )
  //   ]
  // },
  // TabbedPage: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TabbedPage" */ "./components/template/TabbedPage"
  //       )
  //     )
  //   ]
  // },
  // OneColumn: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "OneColumn" */
  //         "./components/template/field/OneColumn"
  //       )
  //     )
  //   ]
  // },
  // TwoColumn: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TwoColumn" */
  //         "./components/template/field/TwoColumn"
  //       )
  //     )
  //   ]
  // },
  // NarrowWideForm: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "NarrowWideForm" */
  //         "./components/template/field/NarrowWide"
  //       )
  //     )
  //   ]
  // },
  // WideNarrowForm: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "WideNarrowForm" */
  //         "./components/template/field/WideNarrow"
  //       )
  //     )
  //   ]
  // },
  // DefaultForm: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DefaultForm" */
  //         "./components/template/field/DefaultForm"
  //       )
  //     )
  //   ]
  // },
  // OneColumnTab: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "OneColumnTab" */
  //         "./components/template/Tab"
  //       )
  //     )
  //   ]
  // },
  // TwoColumnTab: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "TwoColumnTab" */
  //         "./components/template/Tab"
  //       )
  //     )
  //   ]
  // },
  // ThreeColumnTab: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ThreeColumnTab" */
  //         "./components/template/Tab"
  //       )
  //     )
  //   ]
  // },
  // WideNarrowTab: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "WideNarrowTab" */
  //         "./components/template/Tab"
  //       )
  //     )
  //   ]
  // },
  // NarrowWideTab: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "NarrowWideTab" */
  //         "./components/template/Tab"
  //       )
  //     )
  //   ]
  // },
  // RepeatingTemplate: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "RepeatingTemplate" */
  //         "./components/template/RepeatingTemplate"
  //       )
  //     )
  //   ]
  // },
  // AppShell: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "AppShell" */
  //         "./components/template/AppShell"
  //       )
  //     )
  //   ]
  // },
  // SubTabs: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "SubTabs" */
  //         "./components/template/Tab/SubTabs"
  //       )
  //     )
  //   ]
  // },
  // CaseView: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CaseView" */
  //         "./components/template/CaseView"
  //       )
  //     )
  //   ]
  // },
  // CasePreview: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CasePreview" */
  //         "./components/template/CasePreview"
  //       )
  //     )
  //   ]
  // },
  // CaseSummary: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CaseSummary" */
  //         "./components/template/CaseSummary"
  //       )
  //     )
  //   ]
  // },
  // Details: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Details" */
  //         "./components/template/Details"
  //       )
  //     )
  //   ]
  // },
  // DetailsTwoColumn: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DetailsTwoColumn" */
  //         "./components/template/Details"
  //       )
  //     )
  //   ]
  // },
  // DetailsThreeColumn: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DetailsThreeColumn" */
  //         "./components/template/Details"
  //       )
  //     )
  //   ]
  // },
  // DetailsSubTabs: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DetailsSubTabs" */
  //         "./components/template/Details/SubTabs"
  //       )
  //     )
  //   ]
  // },
  // NarrowWideDetails: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "NarrowWideDetails" */
  //         "./components/template/Details"
  //       )
  //     )
  //   ]
  // },
  // WideNarrowDetails: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "WideNarrowDetails" */
  //         "./components/template/Details"
  //       )
  //     )
  //   ]
  // },
  // Dropdown: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Dropdown" */ "./components/field/Dropdown")
  //     )
  //   ]
  // },
  // DataExplorer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DataExplorer" */ "./components/Analytics/DataExplorer"
  //       )
  //     )
  //   ]
  // },
  // Insight: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Insight" */ "./components/Analytics/Insight"
  //       )
  //     )
  //   ]
  // },
  // Search: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Search" */ "./components/Search")
  //     )
  //   ]
  // },
  // AppAnnouncement: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "AppAnnouncement" */ "./components/widget/AppAnnouncement"
  //       )
  //     )
  //   ]
  // },
  // CaseHistory: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CaseHistory" */ "./components/widget/CaseHistory"
  //       )
  //     )
  //   ]
  // },
  // PropertyPanel: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "PropertyPanel" */
  //         "./components/Authoring/PropertyPanel"
  //       )
  //     )
  //   ]
  // },
  // EditView: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "EditView" */
  //         "./components/Authoring/EditView"
  //       )
  //     )
  //   ]
  // },
  // AddViewButton: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "AddViewButton" */
  //         "./components/Authoring/AddViewButton"
  //       )
  //     )
  //   ]
  // },
  // UIViews: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "UIViews" */
  //         "./components/Authoring/UIViews"
  //       )
  //     )
  //   ]
  // },
  // ErrorBoundary: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ErrorBoundary" */
  //         "./components/Authoring/ErrorBoundary"
  //       )
  //     )
  //   ]
  // },
  // ThemePalette: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "ThemePalette" */
  //         "./components/Authoring/ThemePalette"
  //       )
  //     )
  //   ]
  // },
  // Stages: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Stages" */ "./components/Stages")
  //     )
  //   ]
  // },
  // Location: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Location" */ "./components/field/Location")
  //     )
  //   ]
  // },
  // Attachment: {
  //   modules: [
  //     loadable(() =>
  //       import(/* webpackChunkName: "Attachment" */ "./components/Attachment")
  //     )
  //   ]
  // },
  // FileUtility: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "FileUtility" */ "./components/widget/FileUtility"
  //       )
  //     )
  //   ]
  // },
  // Followers: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "Followers" */ "./components/widget/Followers"
  //       )
  //     )
  //   ]
  // },
  // AutoComplete: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "AutoComplete" */
  //         "./components/field/AutoComplete"
  //       )
  //     )
  //   ]
  // },
  // FeedMessageContent: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "FeedMessageContent" */
  //         "./components/Activity/FeedMessageContent"
  //       )
  //     )
  //   ]
  // },
  // PersonaAccessContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "PersonaAccessContainer" */
  //         "./components/Authoring/PersonaAccessContainer"
  //       )
  //     )
  //   ]
  // },
  // DecisionTableContainer: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "DecisionTableContainer" */
  //         "./components/Authoring/DecisionTable"
  //       )
  //     )
  //   ]
  // },
  // UserReference: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "UserReference" */
  //         "./components/field/UserReference"
  //       )
  //     )
  //   ]
  // },
  // CaseOperator: {
  //   modules: [
  //     loadable(() =>
  //       import(
  //         /* webpackChunkName: "CaseOperator" */
  //         "./components/widget/CaseOperator"
  //       )
  //     )
  //   ]
  // }
} ];

export const LazyMap:any[] = [{}];

export default ComponentMap;
