// When this code is run from the generated npm module, the components are
//  placed in the npm module's 'lib' directory. So, we expect to import from there.
//  This file should import and expose ALL of the components that may be
//  dynamically rendered at runtime via calls to react_pconnect or the View component

import ActionButtons from '../src/components/infra/ActionButtons';
import ActionButtonsForFileUtil from './components/widgets/FileUtility/ActionButtonsForFileUtil';
import AppAnnouncement from '../src/components/widgets/AppAnnouncement';
import AppShell from '../src/components/templates/AppShell/AppShell';
import Assignment from '../src/components/infra/Assignment/Assignment';
import AssignmentCard from '../src/components/infra/AssignmentCard/AssignmentCard';
import Attachment from '../src/components/infra/Attachment/Attachment';
import AutoComplete from '../src/components/forms/AutoComplete';
import CancelAlert from '../src/components/forms/CancelAlert';
import CaseHistory from '../src/components/widgets/CaseHistory';
import CaseSummary from '../src/components/templates/CaseSummary';
import CaseSummaryFields from '../src/components/designSystemExtensions/CaseSummaryFields';
import CaseView from '../src/components/templates/CaseView';
import CaseViewActionsMenu from './components/templates/CaseViewActionsMenu';
import Checkbox from '../src/components/forms/Checkbox';
import Currency from '../src/components/forms/Currency';
import DashboardFilter from '../src/components/infra/DashboardFilter';
import DataReference from '../src/components/templates/DataReference';
import Date from '../src/components/forms/Date';
import DateTime from '../src/components/forms/DateTime';
import Decimal from '../src/components/forms/Decimal';
import DefaultForm from '../src/components/templates/DefaultForm';
import DeferLoad from '../src/components/infra/DeferLoad';
import Details from '../src/components/templates/Details/Details';
import DetailsSubTabs from '../src/components/templates/Details/DetailsSubTabs';
import DetailsThreeColumn from './components/templates/Details/DetailsThreeColumn';
import DetailsTwoColumn from '../src/components/templates/Details/DetailsTwoColumn/DetailsTwoColumn';
import Dropdown from '../src/components/forms/Dropdown';
import Email from '../src/components/forms/Email/Email';
import ErrorBoundary from '../src/components/infra/ErrorBoundary';
import FieldGroupTemplate from './components/templates/FieldGroupTemplate';
import FileUtility from '../src/components/widgets/FileUtility/FileUtility';
import FlowContainer from '../src/components/infra/Containers/FlowContainer';
import Followers from '../src/components/widgets/Followers';
import InlineDashboard from '../src/components/templates/InlineDashboard';
import InlineDashboardPage from '../src/components/templates/InlineDashboardPage/InlineDashboardPage';
import Integer from '../src/components/forms/Integer';
import LeftAlignVerticalTabs from './components/infra/VerticalTabs/LeftAlignVerticalTabs';
import ListPage from '../src/components/templates/ListPage/ListPage';
import ListView from '../src/components/templates/ListView';
import ModalViewContainer from '../src/components/infra/Containers/ModalViewContainer/ModalViewContainer';
import MultiReferenceReadOnly from './components/templates/MultiReferenceReadOnly';
import MultiStep from '../src/components/infra/MultiStep';
import NarrowWide from '../src/components/templates/NarrowWide/NarrowWide';
import NarrowWideDetails from '../src/components/templates/NarrowWide/NarrowWideDetails';
import NarrowWideForm from '../src/components/templates/NarrowWide/NarrowWideForm';
import NarrowWidePage from '../src/components/templates/NarrowWide/NarrowWidePage';
import NavBar from '../src/components/infra/NavBar';
import OneColumn from '../src/components/templates/OneColumn/OneColumn';
import OneColumnPage from '../src/components/templates/OneColumn/OneColumnPage';
import OneColumnTab from '../src/components/templates/OneColumn/OneColumnTab';
import Operator from '../src/components/designSystemExtensions/Operator';
import Percentage from '../src/components/forms/Percentage';
import Phone from '../src/components/forms/Phone/Phone';
import PromotedFilters from '../src/components/templates/PromotedFilters';
import Pulse from '../src/components/designSystemExtensions/Pulse';
import RadioButtons from '../src/components/forms/RadioButtons';
import Reference from '../src/components/infra/Reference/Reference';
import Region from '../src/components/infra/Region/Region';
import RootContainer from '../src/components/infra/RootContainer/RootContainer';
import SemanticLink from '../src/components/forms/SemanticLink';
import SimpleTable from '../src/components/templates/SimpleTable/SimpleTable';
import SimpleTableManual from '../src/components/templates/SimpleTable/SimpleTableManual';
import SimpleTableSelect from '../src/components/templates/SimpleTable/SimpleTableSelect';
import SingleReferenceReadOnly from './components/templates/SingleReferenceReadOnly';
import Stages from '../src/components/infra/Stages';
import SubTabs from '../src/components/templates/SubTabs';
import SummaryItem from '../src/components/widgets/SummaryItem';
import SummaryList from '../src/components/widgets/SummaryList';
import TextArea from '../src/components/forms/TextArea';
import TextContent from '../src/components/forms/TextContent';
import TextInput from '../src/components/forms/TextInput/TextInput';
import Time from '../src/components/forms/Time';
import ToDo from '../src/components/infra/ToDo';
import TwoColumn from '../src/components/templates/TwoColumn/TwoColumn';
import TwoColumnPage from '../src/components/templates/TwoColumn/TwoColumnPage';
import TwoColumnTab from './components/templates/TwoColumn/TwoColumnTab';
import URL from '../src/components/forms/URL';
import UserReference from '../src/components/forms/UserReference';
import VerticalTabs from '../src/components/infra/VerticalTabs/VerticalTabs';
import View from '../src/components/infra/View';
import ViewContainer from '../src/components/infra/Containers/ViewContainer';
import WideNarrow from '../src/components/templates/WideNarrow/WideNarrow';
import WideNarrowDetails from '../src/components/templates/WideNarrow/WideNarrowDetails';
import WideNarrowForm from '../src/components/templates/WideNarrow/WideNarrowForm';
import WideNarrowPage from '../src/components/templates/WideNarrow/WideNarrowPage';


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
  'AppAnnouncement': AppAnnouncement,
  'AppShell': AppShell,
  'Assignment': Assignment,
  'AssignmentCard': AssignmentCard,
  'Attachment': Attachment,
  'AutoComplete': AutoComplete,
  'CancelAlert': CancelAlert,
  'CaseHistory': CaseHistory,
  'CaseSummary': CaseSummary,
  'CaseSummaryFields': CaseSummaryFields,
  'CaseView': CaseView,
  'CaseViewActionsMenu': CaseViewActionsMenu,
  'Checkbox': Checkbox,
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
  'FieldGroupTemplate': FieldGroupTemplate,
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
  'reference': Reference,
  'RadioButtons': RadioButtons,
  'Region': Region,
  'RootContainer': RootContainer,
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
  'Todo': ToDo,
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
  'WideNarrowPage': WideNarrowPage
};

export default pegaSdkComponentMap;
