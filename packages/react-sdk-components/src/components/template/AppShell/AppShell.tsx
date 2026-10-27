import { createElement, type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Avatar from '@mui/material/Avatar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { Utils } from '../../helpers/utils';
import { NavContext } from '../../helpers/reactContextHelpers';
import PortalAgentContext from '../../helpers/PortalAgentContext';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import createPConnectComponent from '../../../bridge/react_pconnect';
import type { PConnProps } from '../../../types/PConnProps';

import './AppShell.css';

// An agent selected for the portal's AI assistant (portal navigation settings).
interface PortalAgentConfig {
  pyComponentName: string;
  classID: string;
  pxInsName: string;
  pyDisplayLabel?: string;
  pyLabel?: string;
}

interface AppShellProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  showAppName: boolean;
  pages: {
    pxPageViewIcon: string;
    pyClassName: string;
    pyLabel: string;
    pyRuleName: string;
    pyURLContent: string;
  }[];
  caseTypes?: object[];
  portalTemplate: string;
  portalName: string;
  portalLogo: string;
  navDisplayOptions: {
    alignment: string;
    position: string;
    enableAIAgent?: boolean;
    selectedAgents?: PortalAgentConfig[];
    aiAssistantWidth?: string;
  };
  httpMessages: string[];
  pageMessages: string[];
}

const DEFAULT_AI_ASSISTANT_MODE = 'Hidden';

const getAIAssistantMode = (value?: string) => {
  if (value === 'Hidden' || value === 'Split-width' || value === 'Full-width') {
    return value;
  }

  return DEFAULT_AI_ASSISTANT_MODE;
};

const getPortalAgentInitialState = (mode: string) => {
  switch (mode) {
    case 'Hidden':
      return {
        showAgentPanel: false,
        showPageContent: true,
        agentExpanded: false
      };
    case 'Split-width':
      return {
        showAgentPanel: true,
        showPageContent: true,
        agentExpanded: false
      };
    case 'Full-width':
    default:
      return {
        showAgentPanel: true,
        showPageContent: false,
        agentExpanded: true
      };
  }
};

const getInitialPageName = (pgs: any[]) => {
  if (!pgs || !Array.isArray(pgs) || pgs.length === 0) return null;

  return pgs[0].NavigationPages && pgs[0].NavigationPages.length > 0 ? pgs[0].NavigationPages[0].pyRuleName : pgs[0].pyRuleName;
};

const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2)
  },
  wsscontent: {
    flexGrow: 1,
    height: '100vh',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  agentLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  agentArea: {
    flexGrow: 1,
    minHeight: 0
  }
}));

export default function AppShell(props: PropsWithChildren<AppShellProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const NavBar = getComponentFromMap('NavBar');
  const WssNavBar = getComponentFromMap('WssNavBar');
  const AlertBanner = getComponentFromMap('AlertBanner');

  const {
    pages = [],
    caseTypes = [],
    showAppName,
    children = [],
    getPConnect,
    httpMessages = [],
    pageMessages = [],
    portalTemplate,
    portalName,
    portalLogo,
    navDisplayOptions
  } = props;

  const [open, setOpen] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState(!pages ? null : pages[0]?.pyRuleName);
  const pConn = getPConnect();
  const envInfo = PCore.getEnvironmentInfo();
  const imageKey = envInfo.getOperatorImageInsKey();
  const userName = envInfo.getOperatorName() || '';
  const currentUserInitials = Utils.getInitials(userName);
  const appNameToDisplay = showAppName ? envInfo.getApplicationLabel() : '';
  const portalClass = pConn.getValue('.classID', ''); // 2nd arg empty string until typedef marked correctly
  const envPortalName = envInfo.getPortalName();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;

  const classes = useStyles();
  const actionsAPI = pConn.getActionsApi();
  const localeReference = pConn.getValue('.pyLocaleReference', ''); // 2nd arg empty string until typedef marked correctly
  const [imageBlobUrl, setImageBlobUrl] = useState<string | Blob | null>(null);
  // useState for appName and mapChildren - note these are ONLY updated once (on component mount!)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [appName, setAppName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapChildren, setMapChildren] = useState([]);

  const messages = [...httpMessages, ...pageMessages];

  const hasBanner = messages && messages.length ? messages.length > 0 : false;
  let banners: any = null;
  banners = hasBanner && (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1em 0' }}>
      <AlertBanner id='AppShell' variant='urgent' messages={messages} />
    </div>
  );

  // ── Portal AI assistant (port of the Constellation AppShell portal agent; default shell only) ──
  const theme = useTheme();
  const isNarrow = !useMediaQuery(theme.breakpoints.up('md'));
  const isNarrowRef = useRef(isNarrow);
  isNarrowRef.current = isNarrow;

  const portalAgentElement = useMemo(() => {
    const { enableAIAgent, selectedAgents } = navDisplayOptions ?? {};
    // Infinity runtime only; isInfinityRuntime() is not in the 4.1 typings. The WSS shell is unchanged.
    const isInfinityRuntime = !!(PCore.getEnvironmentInfo() as any).isInfinityRuntime?.();
    if (portalTemplate !== 'wss' && isInfinityRuntime && enableAIAgent && selectedAgents && selectedAgents.length > 0) {
      const coaches = selectedAgents.map(agent => {
        const componentName = agent.pyComponentName;
        return {
          type: componentName,
          config: {
            coach: {
              classID: agent.classID,
              insName: agent.pxInsName,
              label: agent.pyDisplayLabel || agent.pyLabel,
              type: agent.pyComponentName === 'AIAgentObject' ? 'agent' : 'coach'
            }
          }
        };
      });

      const genAICoachMeta = {
        type: 'GenAICoach',
        config: { coaches, isPortalAgent: true }
      };
      const agentPConnectConfig = {
        meta: genAICoachMeta,
        options: {
          context: pConn.getContextName(),
          pageReference: 'pyPortal'
        }
      };
      const agentVisualConfig = PCore.createPConnect(agentPConnectConfig as any);
      return createElement(createPConnectComponent(), agentVisualConfig);
    }
    return null;
  }, [navDisplayOptions?.enableAIAgent, navDisplayOptions?.selectedAgents]);

  const aiAssistantMode = getAIAssistantMode(navDisplayOptions?.aiAssistantWidth);
  const initialPortalAgentState = getPortalAgentInitialState(aiAssistantMode);

  const [showAgentPanel, setShowAgentPanel] = useState(initialPortalAgentState.showAgentPanel);
  const [showPageContent, setShowPageContent] = useState(initialPortalAgentState.showPageContent);
  const [agentExpanded, setAgentExpanded] = useState(initialPortalAgentState.agentExpanded);

  const isAgentInStartupMode = useRef(true);
  const homePageRuleName = useRef(getInitialPageName(pages));
  // The page shown in the primary container (the source tracks it as the active nav tab).
  const currentPageName = useRef<string | null | undefined>(homePageRuleName.current);

  useEffect(() => {
    if (!portalAgentElement) return;

    // A page shown, a case opened or created leaves full width and shows the page;
    // on narrow screens the assistant is hidden instead, as it is never shown beside the page.
    const showPage = () => {
      if (isNarrowRef.current) {
        setShowAgentPanel(false);
      }
      setAgentExpanded(false);
      setShowPageContent(true);
    };

    const { SHOW_PAGE_DONE } = PCore.getConstants().PUB_SUB_EVENTS.UI_EVENTS;
    PCore.getPubSubUtils().subscribe(
      SHOW_PAGE_DONE,
      (data: { target?: string; pageName?: string }) => {
        const { target, pageName } = data ?? {};
        if (target === 'app/primary') {
          currentPageName.current = pageName;

          const isAgentStartupNavigation = isAgentInStartupMode.current && pageName === homePageRuleName.current;
          isAgentInStartupMode.current = false;

          if (!isAgentStartupNavigation) {
            showPage();
          }
        }
      },
      'AppShell_PortalAgent_Page'
    );

    const { CREATE_STAGE_DONE, CASE_OPENED } = PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS;
    PCore.getPubSubUtils().subscribe(
      CREATE_STAGE_DONE,
      () => {
        currentPageName.current = undefined;
        showPage();
      },
      'AppShell_PortalAgent_CreateCase'
    );
    PCore.getPubSubUtils().subscribe(
      CASE_OPENED,
      () => {
        currentPageName.current = undefined;
        showPage();
      },
      'AppShell_PortalAgent_OpenCase'
    );

    return () => {
      PCore.getPubSubUtils().unsubscribe(SHOW_PAGE_DONE, 'AppShell_PortalAgent_Page');
      PCore.getPubSubUtils().unsubscribe(CREATE_STAGE_DONE, 'AppShell_PortalAgent_CreateCase');
      PCore.getPubSubUtils().unsubscribe(CASE_OPENED, 'AppShell_PortalAgent_OpenCase');
    };
  }, [portalAgentElement]);

  const onAgentClick = useCallback(() => {
    const isOnHomePage = currentPageName.current === homePageRuleName.current;

    if (showAgentPanel) {
      if (!showPageContent || isAgentInStartupMode.current || isOnHomePage) {
        setAgentExpanded(false);
        setShowAgentPanel(false);
        setShowPageContent(true);

        return;
      }

      setAgentExpanded(false);
      setShowAgentPanel(prev => !prev);
      return;
    }

    setShowAgentPanel(true);
    setAgentExpanded(false);
    setShowPageContent(true);
  }, [showPageContent, showAgentPanel]);

  const pageContent = (
    <>
      {banners}
      {children}
    </>
  );

  const portalAgentContextValue = useMemo(
    () => ({
      showAgentPanel,
      agentExpanded,
      pagePanel: { content: children, visible: showPageContent && !agentExpanded },
      onAgentToggle: () => {
        setAgentExpanded(prev => !prev);
        setShowPageContent(prev => !prev);
      },
      onAgentClick
    }),
    [showAgentPanel, showPageContent, agentExpanded, children, onAgentClick]
  );
  // Initial setting of appName and mapChildren
  useEffect(() => {
    setAppName(PCore.getEnvironmentInfo().getApplicationName() || '');

    const tempMap: any = (pConn.getChildren() as any)?.map((child: any, index) => {
      const theChildComp = child.getPConnect().getComponentName();
      const theKey = `.${index}`;
      return (
        <div id={theChildComp} key={theKey} style={{ border: 'solid 1px silver', margin: '1px' }}>
          {theChildComp} will be here
        </div>
      );
    });

    setMapChildren(tempMap);

    /* TODO: We're setting the `pyPortalTemplate` for now, this would be handled by the CoreJS in the future releases */
    if (portalTemplate === 'wss') {
      PCore.getEnvironmentInfo().setEnvironmentInfo({ ...PCore.getEnvironmentInfo().environmentInfoObject, pyPortalTemplate: 'wss' } as any);
    }
  }, []);

  useEffect(() => {
    // @ts-expect-error
    const caseTypesAvailableToCreateDP = PCore.getEnvironmentInfo().environmentInfoObject?.pxApplication?.pyCaseTypesAvailableToCreateDP;
    if (caseTypesAvailableToCreateDP) {
      const portalID = pConn.getValue('.pyOwner');
      PCore.getDataPageUtils()
        .getPageDataAsync(caseTypesAvailableToCreateDP, pConn.getContextName(), {
          PortalName: portalID
        })
        .then((response: { pyCaseTypesAvailableToCreate?: any }) => {
          if (response?.pyCaseTypesAvailableToCreate) {
            pConn.replaceState('.pyCaseTypesAvailableToCreate', response.pyCaseTypesAvailableToCreate, {
              skipDirtyValidation: true
            });
          }
        })
        .catch(e => {
          console.error(e);
        });
    }
  }, []);

  const [iconURL, setIconURL] = useState<string | Blob>('');
  const [fullIconURL, setFullIconURL] = useState<string | Blob>('');
  useEffect(() => {
    // using the default icon then fetch it from the static folder (not auth involved)
    if (
      !portalLogo ||
      portalLogo.toLowerCase().includes('pzpega-logo-mark') ||
      portalLogo.toLowerCase().includes('py-logo') ||
      portalLogo.toLowerCase().includes('py-full-logo')
    ) {
      const portalLogoImage = Utils.getIconPath(Utils.getSDKStaticConentUrl()).concat('pzpega-logo-mark.svg');
      setIconURL(portalLogoImage);
      setFullIconURL(`${Utils.getSDKStaticConentUrl()}static/py-full-logo.svg`);
    }
    // not using default icon to fetch it using the way which uses authentication
    else {
      PCore.getAssetLoader()
        .getSvcImageUrl(portalLogo)
        .then(data => {
          setIconURL(data);
          setFullIconURL(data);
        })
        .catch(() => {
          console.error(`${localizedVal('Unable to load the image for the portal logo/icon with the insName', 'AppShell')}:${portalLogo}`);
        });
    }
  }, [portalLogo]);

  useEffect(() => {
    if (imageKey && portalTemplate === 'wss') {
      PCore.getAssetLoader()
        .getSvcImageUrl(imageKey)
        .then(imagePath => setImageBlobUrl(imagePath))
        .catch(e => {
          console.error(e);
        });
    }
  }, []);

  const getOperator = () => {
    return {
      avatar: portalTemplate !== 'wss' ? <Avatar /> : { name: userName, imageSrc: imageBlobUrl },
      name: userName,
      currentUserInitials
    };
  };

  function showPage(viewName, className) {
    actionsAPI.showPage(viewName, className);
  }

  function openURL(URL) {
    window.open(URL, '_blank');
  }

  const links = !pages
    ? []
    : pages.map(page => {
        const name = localizedVal(page.pyLabel, '', localeReference);
        return {
          text: name,
          name,
          icon: page.pxPageViewIcon.replace('pi pi-', ''),
          active: page.pyRuleName === activeTab,
          onClick: () => (!page.pyURLContent || page.pyURLContent === '' ? showPage(page.pyRuleName, page.pyClassName) : openURL(page.pyURLContent))
        };
      });

  if (pConn.hasChildren()) {
    // const theChildren = pConn.getChildren();
    // const mapChildCompNames = theChildren.map((child) => { return child.getPConnect().getComponentName()});
    // debugging/investigation help
    // console.log(`AppShell has children: ${theChildren.length}`);
    // console.log(`--> ${mapChildCompNames.map((name) => {return name;})}`);
  }

  if (portalTemplate === 'wss') {
    return (
      <div id='AppShell' className={classes.root}>
        <WssNavBar
          portalName={portalName}
          imageSrc={iconURL}
          fullImageSrc={fullIconURL}
          appName={localizedVal(appNameToDisplay || '', '', `${portalClass}!PORTAL!${envPortalName}`.toUpperCase())}
          appInfo={{
            imageSrc: iconURL,
            appName: localizedVal(appNameToDisplay || '', '', `${portalClass}!PORTAL!${envPortalName}`.toUpperCase()),
            onClick: links[0] && /* links[0].onClick ? */ links[0].onClick /* : undefined */
          }}
          navLinks={links.filter((link, index) => {
            return index !== 0;
          })}
          operator={getOperator()}
          navDisplayOptions={navDisplayOptions}
        />
        <div className={classes.wsscontent}>
          {banners}
          {children}
        </div>
      </div>
    );
  }

  return (
    <NavContext.Provider value={{ open, setOpen }}>
      <div id='AppShell' className={classes.root} style={{ display: 'flex' }}>
        <NavBar
          getPConnect={getPConnect}
          pConn={getPConnect()}
          appName={localizedVal(appNameToDisplay || '', '', `${portalClass}!PORTAL!${envPortalName}`.toUpperCase())}
          pages={pages}
          caseTypes={caseTypes}
          agent={
            portalAgentElement
              ? {
                  id: 'agent',
                  name: localizedVal('AI Assistant', 'AppShell'),
                  icon: <AutoAwesomeIcon fontSize='large' />,
                  active: showAgentPanel,
                  onClick: onAgentClick
                }
              : undefined
          }
        />

        <div className={classes.content}>
          {portalAgentElement ? (
            // The banners stay visible above the assistant, also when the page is hidden, as the Cosmos AppShell renders them
            // before its main content.
            <div className={classes.agentLayout}>
              {banners}
              <div className={classes.agentArea}>
                <PortalAgentContext.Provider value={portalAgentContextValue}>{portalAgentElement}</PortalAgentContext.Provider>
              </div>
            </div>
          ) : (
            pageContent
          )}
        </div>
      </div>
    </NavContext.Provider>
  );
}
