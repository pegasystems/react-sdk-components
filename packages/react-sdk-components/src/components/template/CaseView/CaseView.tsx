import { type PropsWithChildren, type ReactElement, useContext, useEffect, useState } from 'react';
import { Avatar, Card, CardHeader, Divider, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';

import { Utils } from '../../helpers/utils';
import StoreContext from '../../../bridge/Context/StoreContext';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';
import { prepareCaseSummaryData } from '../utils';

interface CaseViewProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  icon: string;
  subheader: string;
  header: string;
  showIconInHeader: boolean;
  caseInfo: any;
  lastUpdateCaseTime: any;
}

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

export default function CaseView(props: PropsWithChildren<CaseViewProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const CaseViewActionsMenu = getComponentFromMap('CaseViewActionsMenu');
  const VerticalTabs = getComponentFromMap('VerticalTabs');
  const DeferLoad = getComponentFromMap('DeferLoad');
  const CaseSummary = getComponentFromMap('CaseSummary');

  const {
    getPConnect,
    icon = '',
    header,
    subheader,
    children = [],
    caseInfo: { availableActions = [], availableProcesses = [], hasNewAttachments, caseTypeID = '', caseTypeName = '' }
  } = props;
  const { lastUpdateCaseTime = getPConnect().getValue('caseInfo.lastUpdateTime') } = props;
  const currentCaseID = props.caseInfo.ID;
  let isComponentMounted = true;
  const { displayOnlyFA } = useContext<any>(StoreContext);

  const thePConn = getPConnect();

  const classes = useStyles();

  const editAction = availableActions.find(action => action.ID === 'pyUpdateCaseDetails');

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'CaseView';
  const localeKey = `${caseTypeID}!CASE!${caseTypeName}`.toUpperCase();
  /**
   *
   * @param inName the metadata <em>name</em> that will cause a region to be returned
   */
  function getChildRegionByName(inName: string): any {
    for (const child of children as ReactElement[]) {
      const theMetadataType: string = (child as ReactElement).props.getPConnect().getRawMetadata().type?.toLowerCase();
      const theMetadataName: string = (child as ReactElement).props.getPConnect().getRawMetadata().name?.toLowerCase();
      if (theMetadataType === 'region' && theMetadataName === inName) {
        return child;
      }
    }

    return null;
  }

  const theSummaryRegion = children && children[0];

  const data = prepareCaseSummaryData(theSummaryRegion);
  const primarySummaryFields = data.primarySummaryFields;
  const secondarySummaryFields = data.secondarySummaryFields;

  const theStagesRegion = getChildRegionByName('stages');
  const theTodoRegion = getChildRegionByName('todo');
  const theUtilitiesRegion = getChildRegionByName('utilities');
  const theTabsRegion = getChildRegionByName('tabs');

  const svgCase = Utils.getImageSrc(icon, Utils.getSDKStaticConentUrl());

  const [activeVertTab, setActiveVertTab] = useState(0);

  // const tmpLoadData1 = { config: { label: "Details", name: "pyDetailsTabContent" }, type: "DeferLoad" };
  // const tmpLoadData2 = { config: { label: "Case History", name: "CaseHistory" }, type: "DeferLoad" };

  // Extract the tabs we need to display from theTabsRegion (one tab per entry in theTabsRegionChildren)
  const theTabsRegionChildren = theTabsRegion?.props.getPConnect().getChildren();

  // vertTabInfo is sent to VerticalTabs component
  const vertTabInfo: object[] = [];

  // deferLoadInfo is sent to DeferLoad component (currently selected entry)
  const deferLoadInfo: any[] = [];

  if (theTabsRegionChildren) {
    // populate vertTabInfo and deferLoadInfo
    theTabsRegionChildren.forEach((tabComp, index) => {
      const theTabCompConfig = tabComp.getPConnect().getConfigProps();
      // eslint-disable-next-line prefer-const
      let { label, inheritedProps } = theTabCompConfig;
      // For some tabs, "label" property is not avaialable in theTabCompConfig, so will get them from inheritedProps
      if (!label) {
        inheritedProps.forEach(inheritedProp => {
          if (inheritedProp.prop === 'label') {
            label = inheritedProp.value;
          }
        });
      }
      // We'll display the tabs when either visibility property doesn't exist or is true(if exists)
      if (theTabCompConfig.visibility === undefined || theTabCompConfig.visibility === true) {
        vertTabInfo.push({ name: label, id: index });
        deferLoadInfo.push({ type: 'DeferLoad', config: theTabCompConfig });
      }
    });
  }

  function handleVerticalTabClick(eventDetail: any) {
    const theItem = parseInt(eventDetail.additionalData.itemClicked, 10);

    // only call useEffectSetter if the component is mounted
    if (isComponentMounted) {
      setActiveVertTab(theItem);
    }
  }

  // Add and Remove event listener for VerticalTabClick only at startup and teardown
  useEffect(() => {
    document.addEventListener('VerticalTabClick', (event: any) => {
      handleVerticalTabClick(event.detail);
    });

    return (): void => {
      // inform that the component is unmounted so other code can
      //  know not to try to call useState setters (to avoid console warnings)
      isComponentMounted = false;

      document.removeEventListener('VerticalTabClick', (event: any) => {
        handleVerticalTabClick(event.detail);
      });
    };
  }, []);

  useEffect(() => {
    if (hasNewAttachments) {
      PCore.getPubSubUtils().publish((PCore.getEvents().getCaseEvent() as any).CASE_ATTACHMENTS_UPDATED_FROM_CASEVIEW, true);
    }
  }, [hasNewAttachments]);

  function _editClick() {
    const actionsAPI = thePConn.getActionsApi();
    const openLocalAction = actionsAPI.openLocalAction.bind(actionsAPI);

    openLocalAction(editAction.ID, { ...editAction, containerName: 'modal', type: 'express' });
  }

  function getActionButtonsHtml(): any {
    return (
      <Box>
        {editAction && (
          <Button
            id='edit'
            onClick={() => {
              _editClick();
            }}
          >
            {localizedVal('Edit', localeCategory)}
          </Button>
        )}
        <CaseViewActionsMenu
          getPConnect={getPConnect}
          availableActions={availableActions}
          availableProcesses={availableProcesses}
          caseTypeName={caseTypeName}
          caseTypeID={caseTypeID}
        />
      </Box>
    );
  }

  function getContainerContents() {
    if (!displayOnlyFA) {
      // show full portal
      return (
        <Grid2 container>
          <Grid2 size={{ xs: 3 }}>
            <div>
              <div hidden={true} id='current-caseID'>
                {currentCaseID}
              </div>
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
                {getActionButtonsHtml()}
                <Divider />
                <CaseSummary arPrimaryFields={primarySummaryFields} arSecondaryFields={secondarySummaryFields}></CaseSummary>
                <Divider />
                {vertTabInfo.length > 1 && <VerticalTabs tabconfig={vertTabInfo} />}
              </Card>
            </div>
          </Grid2>

          <Grid2 size={{ xs: 6 }}>
            {theStagesRegion}
            {theTodoRegion}
            {deferLoadInfo.length > 0 && (
              <DeferLoad getPConnect={getPConnect} name={deferLoadInfo[activeVertTab].config.name} isTab lastUpdateCaseTime={lastUpdateCaseTime} />
            )}
          </Grid2>

          <Grid2 size={{ xs: 3 }}>{theUtilitiesRegion}</Grid2>
        </Grid2>
      );
    }
    // displayOnlyFA - only show the "todo" region
    return (
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>{theTodoRegion}</Grid2>
      </Grid2>
    );
  }

  return getContainerContents();
}
