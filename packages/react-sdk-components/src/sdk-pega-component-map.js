// When this code is run from the generated npm module, the components are
//  placed in the npm module's 'lib' directory. So, we expect to import from there.
//  This file should import and expose ALL of the components that may be
//  dynamically rendered at runtime via calls to react_pconnect or the View component

import ActionButtons from '../src/components/infra/ActionButtons';
import ActionButtonsForFileUtil from './components/widget/FileUtility/ActionButtonsForFileUtil';
import AlertBanner from './components/designSystemExtension/AlertBanner';
import AppAnnouncement from './components/widget/AppAnnouncement';
import AppShell from './components/template/AppShell/AppShell';
import Assignment from './components/infra/Assignment/Assignment';
import AssignmentCard from './components/infra/AssignmentCard/AssignmentCard';
import Attachment from './components/widget/Attachment';
import AutoComplete from './components/field/AutoComplete';
import Banner from './components/designSystemExtension/Banner';
import BannerPage from './components/template/BannerPage';
import CancelAlert from './components/field/CancelAlert';
import CaseHistory from './components/widget/CaseHistory';
import CaseSummary from './components/template/CaseSummary';
import CaseSummaryFields from './components/designSystemExtension/CaseSummaryFields';
import CaseView from './components/template/CaseView';
import CaseViewActionsMenu from './components/template/CaseViewActionsMenu';
import Checkbox from './components/field/Checkbox';
import Confirmation from './components/template/Confirmation';
import Currency from './components/field/Currency';
import DashboardFilter from './components/infra/DashboardFilter';
import DataReference from './components/template/DataReference';
import Date from './components/field/Date';
import DateTime from './components/field/DateTime';
import Decimal from './components/field/Decimal';
import DefaultForm from './components/template/DefaultForm';
import DeferLoad from './components/infra/DeferLoad';
import Details from './components/template/Details/Details';
import DetailsSubTabs from './components/template/Details/DetailsSubTabs';
import DetailsThreeColumn from './components/template/Details/DetailsThreeColumn';
import DetailsTwoColumn from './components/template/Details/DetailsTwoColumn/DetailsTwoColumn';
import Dropdown from './components/field/Dropdown';
import Email from './components/field/Email/Email';
import ErrorBoundary from './components/infra/ErrorBoundary';
import FieldGroup from './components/designSystemExtension/FieldGroup';
import FieldGroupList from './components/designSystemExtension/FieldGroupList';
import FieldGroupTemplate from './components/template/FieldGroupTemplate';
import FieldValueList from './components/designSystemExtension/FieldValueList';
import FileUtility from './components/widget/FileUtility/FileUtility';
import FlowContainer from './components/infra/Containers/FlowContainer';
import Followers from './components/widget/Followers';
import InlineDashboard from './components/template/InlineDashboard';
import InlineDashboardPage from './components/template/InlineDashboardPage/InlineDashboardPage';
import Integer from './components/field/Integer';
import LeftAlignVerticalTabs from './components/infra/VerticalTabs/LeftAlignVerticalTabs';
import ListPage from './components/template/ListPage/ListPage';
import ListView from './components/template/ListView';
import ModalViewContainer from './components/infra/Containers/ModalViewContainer/ModalViewContainer';
import MultiReferenceReadOnly from './components/template/MultiReferenceReadOnly';
import MultiStep from './components/infra/MultiStep';
import NarrowWide from './components/template/NarrowWide/NarrowWide';
import NarrowWideDetails from './components/template/NarrowWide/NarrowWideDetails';
import NarrowWideForm from './components/template/NarrowWide/NarrowWideForm';
import NarrowWidePage from './components/template/NarrowWide/NarrowWidePage';
import NavBar from './components/infra/NavBar';
import OneColumn from './components/template/OneColumn/OneColumn';
import OneColumnPage from './components/template/OneColumn/OneColumnPage';
import OneColumnTab from './components/template/OneColumn/OneColumnTab';
import Operator from './components/designSystemExtension/Operator';
import Percentage from './components/field/Percentage';
import Phone from './components/field/Phone/Phone';
import PromotedFilters from './components/template/PromotedFilters';
import Pulse from './components/designSystemExtension/Pulse';
import QuickCreate from './components/widget/QuickCreate';
import RadioButtons from './components/field/RadioButtons';
import Reference from './components/infra/Reference/Reference';
import Region from './components/infra/Region/Region';
import RootContainer from './components/infra/RootContainer/RootContainer';
import ScalarList from './components/field/ScalarList';
import SemanticLink from './components/field/SemanticLink';
import SimpleTable from './components/template/SimpleTable/SimpleTable';
import SimpleTableManual from './components/template/SimpleTable/SimpleTableManual';
import SimpleTableSelect from './components/template/SimpleTable/SimpleTableSelect';
import SingleReferenceReadOnly from './components/template/SingleReferenceReadOnly';
import Stages from './components/infra/Stages';
import SubTabs from './components/template/SubTabs';
import SummaryItem from './components/widget/SummaryItem';
import SummaryList from './components/widget/SummaryList';
import TextArea from './components/field/TextArea';
import TextContent from './components/field/TextContent';
import TextInput from './components/field/TextInput/TextInput';
import Time from './components/field/Time';
import ToDo from './components/widget/ToDo';
import TwoColumn from './components/template/TwoColumn/TwoColumn';
import TwoColumnPage from './components/template/TwoColumn/TwoColumnPage';
import TwoColumnTab from './components/template/TwoColumn/TwoColumnTab';
import URL from './components/field/URL';
import UserReference from './components/field/UserReference';
import VerticalTabs from './components/infra/VerticalTabs/VerticalTabs';
import View from './components/infra/View';
import ViewContainer from './components/infra/Containers/ViewContainer';
import WideNarrow from './components/template/WideNarrow/WideNarrow';
import WideNarrowDetails from './components/template/WideNarrow/WideNarrowDetails';
import WideNarrowForm from './components/template/WideNarrow/WideNarrowForm';
import WideNarrowPage from './components/template/WideNarrow/WideNarrowPage';
import WssNavBar from './components/template/WssNavBar/WssNavBar';
import WssQuickCreate from './components/designSystemExtension/WssQuickCreate';

// pegaSdkComponentMap is the JSON object where we'll store the components that are
// the default implementations provided by the SDK. These will be used if there isn't
// an entry in the localSdkComponentMap

// NOTE: A few components have non-standard capitalization:
//  'reference' is what's in the metadata, not Reference
//  'Todo' is what's in the metadata, not ToDo
//  Also, note that "Checkbox" component is named/exported as CheckboxComponent

const pegaSdkComponentMap = {
  'ActionButtons': ActionButtons,
  'ActionButtonsForFileUtil': ActionButtonsForFileUtil,
  'AlertBanner': AlertBanner,
  'AppAnnouncement': AppAnnouncement,
  'AppShell': AppShell,
  'Assignment': Assignment,
  'AssignmentCard': AssignmentCard,
  'Attachment': Attachment,
  'AutoComplete': AutoComplete,
  'Banner': Banner,
  'BannerPage': BannerPage,
  'CancelAlert': CancelAlert,
  'CaseHistory': CaseHistory,
  'CaseSummary': CaseSummary,
  'CaseSummaryFields': CaseSummaryFields,
  'CaseView': CaseView,
  'CaseViewActionsMenu': CaseViewActionsMenu,
  'Checkbox': Checkbox,
  'Confirmation': Confirmation,
  'Currency': Currency,
  'DashboardFilter': DashboardFilter,
  'DataReference': DataReference,
  'Date': Date,
  'DateTime': DateTime,
  'Decimal': Decimal,
  'DefaultForm': DefaultForm,
  'DeferLoad': DeferLoad,
  'Details': Details,
  'DetailsSubTabs': DetailsSubTabs,
  'DetailsThreeColumn': DetailsThreeColumn,
  'DetailsTwoColumn': DetailsTwoColumn,
  'Dropdown': Dropdown,
  'Email': Email,
  'ErrorBoundary': ErrorBoundary,
  'FieldGroup': FieldGroup,
  'FieldGroupList': FieldGroupList,
  'FieldGroupTemplate': FieldGroupTemplate,
  'FieldValueList': FieldValueList,
  'FileUtility': FileUtility,
  'FlowContainer': FlowContainer,
  'Followers': Followers,
  'InlineDashboard': InlineDashboard,
  'InlineDashboardPage': InlineDashboardPage,
  'Integer': Integer,
  'LeftAlignVerticalTabs': LeftAlignVerticalTabs,
  'ListPage': ListPage,
  'ListView': ListView,
  'ModalViewContainer': ModalViewContainer,
  'MultiReferenceReadOnly': MultiReferenceReadOnly,
  'MultiStep': MultiStep,
  'NarrowWide': NarrowWide,
  'NarrowWideDetails': NarrowWideDetails,
  'NarrowWideForm': NarrowWideForm,
  'NarrowWidePage': NarrowWidePage,
  'NavBar': NavBar,
  'OneColumn': OneColumn,
  'OneColumnPage': OneColumnPage,
  'OneColumnTab': OneColumnTab,
  'Operator': Operator,
  'Percentage': Percentage,
  'Phone': Phone,
  'PromotedFilters': PromotedFilters,
  'Pulse': Pulse,
  'QuickCreate': QuickCreate,
  'reference': Reference,   // See note about about non-standard capitalization
  'RadioButtons': RadioButtons,
  'Region': Region,
  'RootContainer': RootContainer,
  'ScalarList': ScalarList,
  'SemanticLink': SemanticLink,
  'SimpleTable': SimpleTable,
  'SimpleTableManual': SimpleTableManual,
  'SimpleTableSelect': SimpleTableSelect,
  'SingleReferenceReadOnly': SingleReferenceReadOnly,
  'Stages': Stages,
  'SubTabs': SubTabs,
  'SummaryItem': SummaryItem,
  'SummaryList': SummaryList,
  'TextArea': TextArea,
  'TextContent': TextContent,
  'TextInput': TextInput,
  'Time': Time,
  'Todo': ToDo,   // See note about about non-standard capitalization
  'TwoColumn': TwoColumn,
  'TwoColumnPage': TwoColumnPage,
  'TwoColumnTab': TwoColumnTab,
  'URL': URL,
  'UserReference': UserReference,
  'VerticalTabs': VerticalTabs,
  'View': View,
  'ViewContainer': ViewContainer,
  'WideNarrow': WideNarrow,
  'WideNarrowDetails': WideNarrowDetails,
  'WideNarrowForm': WideNarrowForm,
  'WideNarrowPage': WideNarrowPage,
  'WssNavBar': WssNavBar,
  'WssQuickCreate': WssQuickCreate
};

export default pegaSdkComponentMap;
