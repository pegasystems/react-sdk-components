import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { prepareCaseSummaryData, filterUtilities } from '../utils';

export default function SelfServiceCaseView(props) {
  const CaseViewActionsMenu = getComponentFromMap('CaseViewActionsMenu');
  const CaseView = getComponentFromMap('CaseView');
  const {
    getPConnect,
    header,
    showCaseLifecycle = true,
    showPulseRegion = true,
    showSummaryRegion = true,
    showUtilitiesRegion = true,
    showCaseActions = true,
    showPromotedActions = true,
    children,
    caseClass,
    caseInfo: { availableActions = [], availableProcesses = [], caseTypeID = '', caseTypeName = '' }
  } = props;
  const pConnect = getPConnect();
  const [bShowCaseLifecycle, bShowPulseRegion, bShowSummaryRegion, bShowUtilitiesRegion, bShowCaseActions, bShowPromotedActions] = [
    showCaseLifecycle,
    showPulseRegion,
    showSummaryRegion,
    showUtilitiesRegion,
    showCaseActions,
    showPromotedActions
  ].map((prop: boolean | string) => prop === true || prop === 'true');
  const isObjectType: boolean = (PCore.getCaseUtils() as any).isObjectCaseType(caseClass);
  const localeKey = pConnect?.getCaseLocaleReference();

  const renderedRegions: any = isObjectType
    ? {
        caseSummary: children[0],
        utilities: filterUtilities(children[2])
      }
    : {
        caseSummary: children[0],
        stages: children[1],
        todo: children[2],
        utilities: filterUtilities(children[4])
      };
  const { primarySummaryFields, secondarySummaryFields } = prepareCaseSummaryData(
    renderedRegions.caseSummary,
    (config: any) => config?.availableInChannel?.selfService === true
  );

  const isUtilitiesRegionNotEmpty: () => boolean = () => {
    const utilitiesElement = renderedRegions.utilities;
    if (utilitiesElement?.props?.getPConnect()?.getChildren()?.length > 0) {
      return utilitiesElement.props
        .getPConnect()
        .getChildren()
        .some((prop: { getPConnect: () => any }) => prop.getPConnect().getConfigProps().visibility !== false);
    }
    return false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '10px' }}>
        <div>{PCore.getLocaleUtils().getLocaleValue(header, '', localeKey)}</div>
        {bShowCaseActions && (
          <CaseViewActionsMenu
            getPConnect={getPConnect}
            availableActions={availableActions}
            availableProcesses={availableProcesses}
            caseTypeName={caseTypeName}
            caseTypeID={caseTypeID}
          />
        )}
      </div>
      <CaseView
        {...props}
        summaryData={{ primarySummaryFields, secondarySummaryFields }}
        selfServiceCaseView={true}
        bShowCaseLifecycle={bShowCaseLifecycle}
        bShowPulseRegion={bShowPulseRegion}
        bShowSummaryRegion={bShowSummaryRegion}
        bShowUtilitiesRegion={bShowUtilitiesRegion}
        bShowCaseActions={bShowCaseActions}
        bShowPromotedActions={bShowPromotedActions}
        utilitysRegionNotEmpty={isUtilitiesRegionNotEmpty()}
      />
    </div>
  );
}
