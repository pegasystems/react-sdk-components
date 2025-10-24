import { Avatar, Card, CardHeader, Divider, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Grid2 from '@mui/material/Grid2';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { prepareCaseSummaryData, filterUtilities } from '../utils';
import { Utils } from '../../helpers/utils';

const useStyles = makeStyles(theme => ({
  root: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  caseViewHeader: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.getContrastText(theme.palette.info.light),
    borderRadius: 'inherit'
  },
  caseViewIconBox: {
    backgroundColor: theme.palette.info.dark,
    width: theme.spacing(8),
    height: theme.spacing(8),
    padding: theme.spacing(1)
  },
  caseViewIconImage: {
    filter: 'var(--svg-color)'
  }
}));

export default function SelfServiceCaseView(props) {
  const classes = useStyles();
  const CaseViewActionsMenu = getComponentFromMap('CaseViewActionsMenu');
  const CaseSummary = getComponentFromMap('CaseSummary');
  const {
    icon = '',
    getPConnect,
    header,
    subheader,
    showCaseLifecycle = true,
    showSummaryRegion = true,
    showUtilitiesRegion = true,
    showCaseActions = true,
    children,
    caseClass,
    caseInfo: { availableActions = [], availableProcesses = [], caseTypeID = '', caseTypeName = '' }
  } = props;
  const pConnect = getPConnect();
  const [bShowCaseLifecycle, bShowSummaryRegion, bShowUtilitiesRegion, bShowCaseActions] = [
    showCaseLifecycle,
    showSummaryRegion,
    showUtilitiesRegion,
    showCaseActions
  ].map((prop: boolean | string) => prop === true || prop === 'true');
  const isObjectType: boolean = (PCore.getCaseUtils() as any).isObjectCaseType(caseClass);
  const localeKey = pConnect?.getCaseLocaleReference();
  const svgCase = Utils.getImageSrc(icon, Utils.getSDKStaticConentUrl());
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
      {bShowCaseActions && (
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '10px' }}>
          <div>{PCore.getLocaleUtils().getLocaleValue(header, '', localeKey)}</div>
          <CaseViewActionsMenu
            getPConnect={getPConnect}
            availableActions={availableActions}
            availableProcesses={availableProcesses}
            caseTypeName={caseTypeName}
            caseTypeID={caseTypeID}
          />
        </div>
      )}
      <div>
        <Grid2 container>
          <Grid2 size={{ xs: 3 }}>
            {bShowSummaryRegion && (primarySummaryFields.length > 0 || secondarySummaryFields.length > 0) && (
              <div>
                <Card className={classes.root}>
                  <CardHeader
                    className={classes.caseViewHeader}
                    title={
                      <Typography variant='h6' component='div' id='case-name'>
                        {PCore.getLocaleUtils().getLocaleValue(header, '', localeKey)}
                      </Typography>
                    }
                    subheader={
                      <Typography variant='body1' component='div' id='caseId'>
                        {subheader}
                      </Typography>
                    }
                    avatar={
                      <Avatar className={classes.caseViewIconBox} variant='square'>
                        <img src={svgCase} className={classes.caseViewIconImage} />
                      </Avatar>
                    }
                  />
                  <Divider />
                  <CaseSummary arPrimaryFields={primarySummaryFields} arSecondaryFields={secondarySummaryFields}></CaseSummary>
                  <Divider />
                </Card>
              </div>
            )}
          </Grid2>

          <Grid2 size={{ xs: 6 }}>
            {bShowCaseLifecycle && renderedRegions.stages}
            {renderedRegions.todo}
          </Grid2>

          {bShowUtilitiesRegion && isUtilitiesRegionNotEmpty() && <Grid2 size={{ xs: 3 }}>{renderedRegions.utilities}</Grid2>}
        </Grid2>
      </div>
    </div>
  );
}
