import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Box, ClickAwayListener, Drawer, Fab, IconButton, Paper, Popper, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import makeStyles from '@mui/styles/makeStyles';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

import type { UtilitiesLayoutProps } from '../GenAICoachContent/GenAICoach.types';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    flexShrink: 0,
    width: '3rem',
    paddingBlock: theme.spacing(2)
  },
  rootExpanded: {
    width: '25rem',
    marginInlineEnd: theme.spacing(2),
    position: 'sticky',
    top: 0,
    height: '100vh'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing(1)
  },
  coachContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0
  },
  coachButton: {
    position: 'fixed',
    width: '2.75rem',
    height: '2.75rem',
    minHeight: 'auto',
    insetBlockEnd: theme.spacing(2),
    insetInlineEnd: theme.spacing(2)
  },
  coachPopper: {
    // Above the navigation and drawers, below dialogs and menus (including the ones the agent opens).
    zIndex: theme.zIndex.modal - 1
  },
  dialogPaper: {
    display: 'flex',
    flexDirection: 'column',
    width: '25rem',
    maxWidth: 'calc(100vw - 2rem)',
    height: 'calc(0.85 * 95vh)'
  },
  drawerPaper: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '25rem',
    maxWidth: '100vw',
    padding: theme.spacing(2)
  }
}));

const focusableSelector = 'button, [href], input, select, textarea, [tabindex]';

const getFocusables = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0
  );

/**
 * The utilities column of a landing page: MUI port of the Cosmos `UtilitiesLayout` component. Collapsed, it offers a
 * "Chat with AI" button that opens the agent next to it; expanded, it shows the agent in the column (in a drawer
 * below the lg breakpoint). Below the md breakpoint the agent is shown in the page.
 */
// UtilitiesLayout is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function UtilitiesLayout(props: UtilitiesLayoutProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const GenAICoachContent = getComponentFromMap('GenAICoachContent');

  const { genAICoachProps, defaultExpandUtilities = false, disabled = false, onToggleUtilities } = props;
  const classes = useStyles();
  const theme = useTheme();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const [utilitiesExpanded, setUtilitiesExpanded] = useState(defaultExpandUtilities);
  const [showCoach, setShowCoach] = useState(false);

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const genAICoachButtonRef = useRef<HTMLButtonElement>(null);
  const coachPanelRef = useRef<HTMLDivElement>(null);
  const utilitiesToggled = useRef(false);
  const mdOrAbove = useMediaQuery(theme.breakpoints.up('md'));
  const lgOrAbove = useMediaQuery(theme.breakpoints.up('lg'));
  const isRtl = theme.direction === 'rtl';

  // Focus stays on the toggle; between md and lg the expanded utilities are a drawer with its own toggle.
  useEffect(() => {
    onToggleUtilities?.(utilitiesExpanded);
    if (utilitiesToggled.current) {
      toggleButtonRef.current?.focus();
    }
  }, [utilitiesExpanded]);

  // As in Cosmos, the opened agent takes the focus.
  useEffect(() => {
    const panel = coachPanelRef.current;
    if (!showCoach || !panel) return;
    (getFocusables(panel)[0] ?? panel).focus({ preventScroll: true });
  }, [showCoach]);

  // Expanded, the arrow points to the end (collapse); collapsed, to the start (expand).
  const ToggleIcon = utilitiesExpanded !== isRtl ? KeyboardArrowRightIcon : KeyboardArrowLeftIcon;
  const utilitiesToggleButton = (
    <Tooltip title={localizedVal(utilitiesExpanded ? 'Collapse' : 'Expand', localeCategory)}>
      <span>
        <IconButton
          size='small'
          ref={toggleButtonRef}
          aria-label={localizedVal(utilitiesExpanded ? 'Collapse utilities' : 'Expand utilities', localeCategory)}
          aria-expanded={utilitiesExpanded}
          onClick={() => {
            utilitiesToggled.current = true;
            setShowCoach(false);
            setUtilitiesExpanded(prevState => !prevState);
          }}
          disabled={disabled}
        >
          <ToggleIcon fontSize='small' />
        </IconButton>
      </span>
    </Tooltip>
  );

  const utilitiesHeader = (
    <Box className={classes.header}>
      {utilitiesExpanded && (
        <Typography variant='h6' component='h2'>
          {localizedVal('Utilities', localeCategory)}
        </Typography>
      )}
      {utilitiesToggleButton}
    </Box>
  );

  const genAICoachInUtilities = genAICoachProps && (
    <Box className={classes.coachContainer}>
      <GenAICoachContent {...genAICoachProps} variant={{ placement: 'fullpage' }} isInLandingPageUtilities />
    </Box>
  );

  if (!mdOrAbove && genAICoachProps) {
    return <GenAICoachContent {...genAICoachProps} variant={{ placement: 'fullpage' }} />;
  }

  if (utilitiesExpanded && !lgOrAbove) {
    return (
      <Drawer
        anchor={isRtl ? 'left' : 'right'}
        variant='persistent'
        open={utilitiesExpanded}
        slotProps={{ paper: { className: classes.drawerPaper, elevation: 8 } }}
      >
        {utilitiesHeader}
        {genAICoachInUtilities}
      </Drawer>
    );
  }

  const chatWithAI = localizedVal('Chat with AI', localeCategory);
  const closeCoach = () => {
    setShowCoach(false);
    genAICoachButtonRef.current?.focus();
  };

  // Escape closes the agent and Tab cycles within it, as in the Cosmos dialog. Keys from the menus and dialogs the agent
  // opens reach this handler through the React tree, so only keys pressed in the panel itself are handled.
  const handleCoachKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const panel = coachPanelRef.current;
    if (!panel || !panel.contains(event.target as Node)) return;

    if (event.key === 'Escape') {
      event.stopPropagation();
      closeCoach();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = getFocusables(panel);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const atStart = document.activeElement === first || document.activeElement === panel;
    if (!first || (event.shiftKey && atStart) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  };

  return (
    <Box className={clsx(classes.root, utilitiesExpanded && lgOrAbove && classes.rootExpanded)}>
      {utilitiesHeader}
      {utilitiesExpanded && genAICoachInUtilities}
      {!utilitiesExpanded && (
        <Tooltip title={chatWithAI}>
          <Fab
            color='primary'
            className={classes.coachButton}
            ref={genAICoachButtonRef}
            aria-label={chatWithAI}
            aria-haspopup='dialog'
            aria-expanded={showCoach}
            onClick={() => setShowCoach(cur => !cur)}
            disabled={disabled}
          >
            <AutoAwesomeIcon fontSize='small' />
          </Fab>
        </Tooltip>
      )}
      {/* Non-modal, as the Cosmos dialog: the page stays scrollable and usable while the agent is open. */}
      {genAICoachProps && showCoach && (
        <Popper
          open
          anchorEl={genAICoachButtonRef.current}
          placement={isRtl ? 'right-end' : 'left-end'}
          className={classes.coachPopper}
          popperOptions={{ strategy: 'fixed' }}
          modifiers={[
            { name: 'offset', options: { offset: [0, 8] } },
            { name: 'preventOverflow', options: { padding: 8 } }
          ]}
        >
          <ClickAwayListener
            mouseEvent='onMouseDown'
            touchEvent='onTouchStart'
            onClickAway={event => {
              // The button toggles the agent itself; a click elsewhere closes it and still reaches the page.
              if (genAICoachButtonRef.current?.contains(event.target as Node)) return;
              setShowCoach(false);
            }}
          >
            <Paper
              ref={coachPanelRef}
              elevation={8}
              className={classes.dialogPaper}
              role='dialog'
              aria-label={chatWithAI}
              tabIndex={-1}
              onKeyDown={handleCoachKeyDown}
            >
              <GenAICoachContent {...genAICoachProps} variant={{ placement: 'dialog', onClose: closeCoach }} />
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
    </Box>
  );
}
