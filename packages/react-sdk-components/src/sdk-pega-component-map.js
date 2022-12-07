// When this code is run from the generated npm module, the components are
//  placed in the npm module's 'lib' directory. So, we expect to import from there.
//  This file should import and expose ALL of the components that may be 
//  dynamically rendered at runtime via calls to react_pconnect or the View component

import ActionButtons from '../lib/components/infra/ActionButtons';
import AppAnnouncement from './components/widgets/AppAnnouncement';
import AppShell from '../lib/components/templates/AppShell/AppShell';
import Assignment from '../lib/components/infra/Assignment/Assignment';
import AssignmentCard from '../lib/components/infra/AssignmentCard/AssignmentCard';
import Attachment from '../lib/components/infra/Attachment/Attachment';
import AutoComplete from '../lib/components/forms/AutoComplete';
import CancelAlert from '../lib/components/forms/CancelAlert';
import CaseHistory from '../lib/components/widgets/CaseHistory';
import CaseSummary from '../lib/components/templates/CaseSummary';
import CaseView from '../lib/components/templates/CaseView/CaseView';
import Checkbox from '../lib/components/forms/Checkbox';
import Currency from '../lib/components/helpers/formatters/Currency';
import DashboardFilter from '../lib/components/infra/DashboardFilter';
import DataReference from '../lib/components/templates/DataReference';
import Date from '../lib/components/forms/Date';
import DateTime from '../lib/components/forms/DateTime';
import Decimal from '../lib/components/forms/Decimal';
import DefaultForm from './components/templates/DefaultForm';
import DeferLoad from '../lib/components/infra/DeferLoad';
import Details from '../lib/components/templates/Details/Details';
import DetailsSubTabs from '../lib/components/templates/Details/DetailsSubTabs';
import DetailsTwoColumn from './components/templates/Details/DetailsTwoColumn/DetailsTwoColumn';
import Dropdown from '../lib/components/forms/Dropdown';
import ErrorBoundary from '../lib/components/infra/ErrorBoundary';
import Email from '../lib/components/forms/Email/Email';
import FileUtility from './components/widgets/FileUtility/FileUtility';
import FlowContainer from '../lib/components/infra/Containers/FlowContainer';
import Followers from '../lib/components/widgets/Followers';
import InlineDashboard from './components/templates/InlineDashboard';
import InlineDashboardPage from './components/templates/InlineDashboardPage/InlineDashboardPage';
import Integer from '../lib/components/forms/Integer';
import ListPage from './components/templates/ListPage/ListPage';
import ListView from '../lib/components/templates/ListView';
import ModalViewContainer from '../lib/components/infra/Containers/ModalViewContainer/ModalViewContainer';
import MultiStep from '../lib/components/infra/MultiStep';
import NarrowWide from '../lib/components/templates/NarrowWide/NarrowWide';
import NarrowWideDetails from '../lib/components/templates/NarrowWide/NarrowWideDetails';
import NarrowWideForm from '../lib/components/templates/NarrowWide/NarrowWideForm';
import NarrowWidePage from '../lib/components/templates/NarrowWide/NarrowWidePage';
import NavBar from '../lib/components/infra/NavBar';
import OneColumn from './components/templates/OneColumn/OneColumn';
import OneColumnPage from './components/templates/OneColumn/OneColumnPage';
import OneColumnTab from './components/templates/OneColumn/OneColumnTab';
import Percentage from '../lib/components/forms/Percentage';
import Phone from '../lib/components/forms/Phone/Phone';
import PromotedFilters from './components/templates/PromotedFilters';
import Pulse from '../lib/components/designSystemExtensions/Pulse';
import RadioButtons from '../lib/components/forms/RadioButtons';
import Reference from '../lib/components/infra/Reference/Reference';
import Region from '../lib/components/infra/Region/Region';
import RootContainer from '../lib/components/infra/RootContainer/RootContainer';
import SemanticLink from '../lib/components/forms/SemanticLink';
import Stages from '../lib/components/infra/Stages';
import SubTabs from './components/templates/SubTabs';
import TextArea from '../lib/components/forms/TextArea';
import TextContent from '../lib/components/forms/TextContent';
import TextInput from '../lib/components/forms/TextInput/TextInput';
import SimpleTable from './components/templates/SimpleTable/SimpleTable';
import SimpleTableManual from './components/templates/SimpleTable/SimpleTableManual';
import SimpleTableSelect from './components/templates/SimpleTable/SimpleTableSelect';
import SummaryItem from '../lib/components/widgets/SummaryItem';
import SummaryList from '../lib/components/widgets/SummaryList';
import Time from '../lib/components/forms/Time';
import ToDo from '../lib/components/infra/ToDo';
import TwoColumn from './components/templates/TwoColumn/TwoColumn';
import TwoColumnPage from './components/templates/TwoColumn/TwoColumnPage';
import URL from '../lib/components/forms/URL';
import UserReference from '../lib/components/forms/UserReference';
import VerticalTabs from '../lib/components/infra/VerticalTabs';
import View from '../lib/components/infra/View';
import ViewContainer from '../lib/components/infra/Containers/ViewContainer';
import WideNarrow from '../lib/components/templates/WideNarrow/WideNarrow';
import WideNarrowDetails from '../lib/components/templates/WideNarrow/WideNarrowDetails';
import WideNarrowForm from '../lib/components/templates/WideNarrow/WideNarrowForm';
import WideNarrowPage from '../lib/components/templates/WideNarrow/WideNarrowPage';


// pegaSdkComponentMap is the JSON object where we'll store the components that are
// the default implementations provided by the SDK. These will be used if there isn't
// an entry in the localSdkComponentMap

// NOTE: A few components have non-standard capitalization:
//  'reference' is what's in the metadata, not Reference
//  'Todo' is what's in the metadata, not ToDo
//  Also, note that "Checkbox" component is named/exported as CheckboxComponent

const pegaSdkComponentMap = {
  'ActionButtons': ActionButtons,
  'AppAnnouncement': AppAnnouncement,
  'AppShell': AppShell,
  'Assignment': Assignment,
  'AssignmentCard': AssignmentCard,
  'Attachment': Attachment,
  'AutoComplete': AutoComplete,
  'CancelAlert': CancelAlert,
  'CaseHistory': CaseHistory,
  'CaseSummary': CaseSummary,
  'CaseView': CaseView,
  'Checkbox': Checkbox,
  'Currency': Currency,
  'DashboardFilter': DashboardFilter,
  'DataReference': DataReference,
  'Date': Date,
  'DateTime': DateTime,
  'Decimal': Decimal,
  'DefaultForm': DefaultForm,
  'Details': Details,
  'DetailsSubTabs': DetailsSubTabs,
  'DetailsTwoColumn': DetailsTwoColumn,
  'DeferLoad': DeferLoad,
  'Dropdown': Dropdown,
  'Email': Email,
  'ErrorBoundary': ErrorBoundary,
  'FileUtility': FileUtility,
  'FlowContainer': FlowContainer,
  'Followers': Followers,
  'InlineDashboard': InlineDashboard,
  'InlineDashboardPage': InlineDashboardPage,
  'Integer': Integer,
  'ListPage': ListPage,
  'ListView': ListView,
  'ModalViewContainer': ModalViewContainer,
  'MultiStep': MultiStep,
  'NarrowWide': NarrowWide,
  'NarrowWideDetails': NarrowWideDetails,
  'NarrowWideForm': NarrowWideForm,
  'NarrowWidePage': NarrowWidePage,
  'NavBar': NavBar,
  'OneColumn': OneColumn,
  'OneColumnPage': OneColumnPage,
  'OneColumnTab': OneColumnTab,
  'Percentage': Percentage,
  'Phone': Phone,
  'PromotedFilters': PromotedFilters,
  'Pulse': Pulse,
  'reference': Reference,
  'RadioButtons': RadioButtons,
  'Region': Region,
  'RootContainer': RootContainer,
  'SemanticLink': SemanticLink,
  'SimpleTable': SimpleTable,
  'SimpleTableManual': SimpleTableManual,
  'SimpleTableSelect': SimpleTableSelect,
  'Stages': Stages,
  'SubTabs': SubTabs,
  'SummaryItem': SummaryItem,
  'SummaryList': SummaryList,
  'TextArea': TextArea,
  'TextContent': TextContent,
  'TextInput': TextInput,
  'Time': Time,
  'Todo': ToDo,
  'TwoColumn': TwoColumn,
  'TwoColumnPage': TwoColumnPage,
  'URL': URL,
  'UserReference': UserReference,
  'VerticalTabs': VerticalTabs,
  'View': View,
  'ViewContainer': ViewContainer,
  'WideNarrow': WideNarrow,
  'WideNarrowDetails': WideNarrowDetails,
  'WideNarrowForm': WideNarrowForm,
  'WideNarrowPage': WideNarrowPage
};

export default pegaSdkComponentMap;