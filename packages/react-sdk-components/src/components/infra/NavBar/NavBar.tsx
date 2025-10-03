import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TabletAndroidOutlineIcon from '@mui/icons-material/TabletAndroidOutlined';
import AirportShuttleOutlinedIcon from '@mui/icons-material/AirportShuttleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { logout } from '@pega/auth/lib/sdk-auth-manager';

import { useNavBar } from '../../helpers/reactContextHelpers';
import { Utils } from '../../helpers/utils';
import type { PConnProps } from '../../../types/PConnProps';

import './NavBar.css';

interface NavBarProps extends PConnProps {
  // If any, enter additional props that only exist on this component

  appName?: string;
  pages?: any[];
  caseTypes: any[];
  pConn?: any;
}

const iconMap = {
  'pi pi-headline': <HomeOutlinedIcon fontSize='large' />,
  'pi pi-flag-solid': <FlagOutlinedIcon fontSize='large' />,
  'pi pi-home-solid': <HomeOutlinedIcon fontSize='large' />,
  'pi pi-tablet': <TabletAndroidOutlineIcon fontSize='large' />,
  'pi pi-ambulance': <AirportShuttleOutlinedIcon fontSize='large' />,
  'pi pi-ink-solid': <EditOutlinedIcon fontSize='large' />,
  'pi pi-columns': <HomeOutlinedIcon fontSize='large' />,
};

const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    height: '100vh',
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('md')]: {
      width: theme.spacing(9),
    },
    height: '100vh',
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  appListItem: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.getContrastText(theme.palette.primary.light),
  },
  appListLogo: {
    marginRight: theme.spacing(2),
    width: '3.6rem',
  },
  appListIcon: {
    color: theme.palette.getContrastText(theme.palette.primary.light),
  },
  appListDiv: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.getContrastText(theme.palette.primary.light),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicationLabel: {
    whiteSpace: 'initial',
  },
}));

export default function NavBar(props: NavBarProps) {
  const { pConn, pages = [], caseTypes = [] } = props;

  const classes = useStyles();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const { open, setOpen } = useNavBar();
  const [navPages, setNavPages] = useState(JSON.parse(JSON.stringify(pages)));
  const [bShowCaseTypes, setBShowCaseTypes] = useState(true);
  const [bShowOperatorButtons, setBShowOperatorButtons] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const localeUtils = PCore.getLocaleUtils();
  const localeReference = pConn.getValue('.pyLocaleReference');

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'AppShell';

  const portalLogoImage = Utils.getIconPath(Utils.getSDKStaticConentUrl()).concat('pzpega-logo-mark.svg');
  const portalOperator = PCore.getEnvironmentInfo().getOperatorName();
  const portalApp = PCore.getEnvironmentInfo().getApplicationLabel();

  useEffect(() => {
    setNavPages(JSON.parse(JSON.stringify(pages)));
  }, [pages]);

  function navPanelButtonClick(oPageData: any) {
    const { pyClassName, pyRuleName } = oPageData;

    pConn
      .getActionsApi()
      .showPage(pyRuleName, pyClassName)
      .then(() => {
        console.log(`${localizedVal('showPage completed', localeCategory)}`);
      });
  }

  function navPanelCreateCaseType(sCaseType: string, sFlowType: string) {
    setOpen(false);
    const actionInfo = {
      containerName: 'primary',
      flowType: sFlowType || 'pyStartCase',
    };

    pConn
      .getActionsApi()
      .createWork(sCaseType, actionInfo)
      .then(() => {
        console.log(`${localizedVal('createWork completed', localeCategory)}`);
      });
  }

  // Toggle showing the Operator buttons
  function navPanelOperatorButtonClick(evt) {
    setBShowOperatorButtons(!bShowOperatorButtons);
    if (!bShowOperatorButtons) setAnchorEl(evt.currentTarget);
    else setAnchorEl(null);
  }

  const handleDrawerOpen = () => {
    setOpen(!open);
  };

  const handleCaseItemClick = () => {
    if (!open) {
      setOpen(true);
      setBShowCaseTypes(true);
    } else setBShowCaseTypes(!bShowCaseTypes);
  };

  useEffect(() => {
    if (!isDesktop) setOpen(false);
    else setOpen(true);
  }, [isDesktop]);

  return (
    <Drawer
      variant='permanent'
      classes={{
        paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
      }}
      open={open && isDesktop}
    >
      {open ? (
        <List className={classes.appListItem}>
          <ListItem
            onClick={handleDrawerOpen}
            secondaryAction={
              <IconButton edge='end' onClick={handleDrawerOpen} size='large'>
                <ChevronLeftIcon className={classes.appListIcon} />
              </IconButton>
            }
          >
            <ListItemIcon>
              <img src={portalLogoImage} className={classes.appListLogo} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant='h6' className={classes.applicationLabel}>
                  {portalApp}
                </Typography>
              }
            />
          </ListItem>
        </List>
      ) : (
        <div className={classes.appListDiv} onClick={handleDrawerOpen}>
          <ChevronRightIcon className={classes.appListIcon} id='chevron-right-icon' fontSize='large' />
        </div>
      )}
      <List>
        <ListItemButton onClick={handleCaseItemClick}>
          <ListItemIcon>{bShowCaseTypes && open ? <ClearOutlinedIcon fontSize='large' /> : <AddIcon fontSize='large' />}</ListItemIcon>
          <ListItemText primary='Create' />
          {bShowCaseTypes ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </List>
      <Collapse in={bShowCaseTypes && open} timeout='auto' unmountOnExit className='scrollable'>
        <List component='div' disablePadding>
          {caseTypes.map((caseType) => (
            <ListItemButton
              className={classes.nested}
              onClick={() => navPanelCreateCaseType(caseType.pyClassName, caseType.pyFlowType)}
              key={caseType.pyLabel}
            >
              <ListItemIcon>
                <WorkOutlineIcon fontSize='large' />
              </ListItemIcon>
              <ListItemText primary={localeUtils.getLocaleValue(caseType.pyLabel, '', localeReference)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <List>
        {navPages.map((page) => (
          <ListItemButton onClick={() => navPanelButtonClick(page)} key={page.pyLabel}>
            <ListItemIcon>{iconMap[page.pxPageViewIcon]}</ListItemIcon>
            <ListItemText primary={localeUtils.getLocaleValue(page.pyLabel, '', localeReference)} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List className='marginTopAuto'>
        <>
          <ListItem
            onClick={navPanelOperatorButtonClick}
            secondaryAction={
              open ? (
                <IconButton edge='end' onClick={navPanelOperatorButtonClick} size='large'>
                  <ChevronRightIcon />
                </IconButton>
              ) : null
            }
          >
            <ListItemIcon id='person-icon'>
              <PersonOutlineIcon fontSize='large' />
            </ListItemIcon>
            <ListItemText primary={portalOperator} />
          </ListItem>
          <Menu
            anchorEl={anchorEl}
            keepMounted={bShowOperatorButtons}
            open={bShowOperatorButtons}
            onClick={navPanelOperatorButtonClick}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={logout}>
              <ListItemIcon>
                <ArrowBackIcon fontSize='large' />
              </ListItemIcon>
              <Typography variant='inherit'>{localizedVal('Log off', localeCategory)}</Typography>
            </MenuItem>
          </Menu>
        </>
      </List>
    </Drawer>
  );
}
