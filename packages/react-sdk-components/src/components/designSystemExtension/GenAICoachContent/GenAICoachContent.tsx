import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type RefObject } from 'react';
import clsx from 'clsx';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RemoveIcon from '@mui/icons-material/Remove';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import makeStyles from '@mui/styles/makeStyles';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

import { createUID, getSelectedKeys, isCoachMessage, isInUtilities, isMenuGroupProps, isUserMessage } from './GenAICoach.utils';
import type {
  Action,
  ActionsProps,
  FileItemProps,
  FormAnswer,
  GenAICoachContentProps,
  MenuItemProps,
  MenuItems,
  Question,
  Variant
} from './GenAICoach.types';

// Width from which the history is shown beside the conversation (the Cosmos `sm` breakpoint of the component).
const sideBySideMinWidthPx = 768;
const scrollThresholdPx = 50;

const buildInitialFormAnswers = (questions: Question[] = []): Record<string, FormAnswer> =>
  Object.fromEntries(
    questions.map(question => [
      question.field,
      {
        value: getSelectedKeys(question),
        questionText: question.questionText
      }
    ])
  );

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: theme.palette.background.paper
  },
  utilities: {
    margin: theme.spacing(1),
    border: `0.0625rem solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  },
  fill: {
    height: '100%',
    minHeight: '28rem'
  },
  // Cosmos full-page height outside the portal: once there are messages, the panel is as tall as the view.
  fillInView: {
    height: 'var(--content-height-in-view, 100vh)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1, 1, 2)
  },
  headerTitle: {
    minWidth: 0
  },
  agentSwitcher: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1.125rem',
    maxWidth: '100%'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: theme.spacing(0.25)
  },
  body: {
    display: 'flex',
    flexGrow: 1,
    minHeight: 0
  },
  sideBySide: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: theme.spacing(0.5)
  },
  conversation: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0
  },
  scrollArea: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: theme.spacing(0, 2)
  },
  scrollAreaBounded: {
    maxHeight: '28rem'
  },
  historyBounded: {
    maxHeight: '28rem'
  },
  messageList: {
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  state: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(3, 0)
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(4, 0, 2),
    textAlign: 'center'
  },
  initialMessages: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
    gap: theme.spacing(1.5)
  },
  scrollButton: {
    position: 'absolute',
    insetInlineEnd: theme.spacing(2),
    bottom: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[2],
    '&:hover': {
      backgroundColor: theme.palette.background.paper
    }
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2, 1.5)
  },
  composer: {
    display: 'flex',
    flexDirection: 'column',
    border: `0.0625rem solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(1, 1, 0.5)
  },
  composerError: {
    borderColor: theme.palette.error.main
  },
  composerToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1)
  },
  composerTools: {
    display: 'flex',
    alignItems: 'center'
  },
  generating: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1)
  },
  hiddenInput: {
    display: 'none'
  },
  attachmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    border: `0.0625rem solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  },
  attachmentDetails: {
    flexGrow: 1,
    minWidth: 0
  },
  guided: {
    display: 'flex',
    justifyContent: 'center'
  },
  disclaimer: {
    textAlign: 'center'
  },
  visuallyHidden: {
    position: 'absolute',
    width: '0.0625rem',
    height: '0.0625rem',
    margin: '-0.0625rem',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0
  }
}));

/** Renders menu items, with a subheader for each group. */
const renderMenuItems = (items: MenuItems, onItemClick: (item: MenuItemProps) => void) =>
  items.flatMap(item => {
    if (isMenuGroupProps(item)) {
      return [
        ...(item.label ? [<ListSubheader key={`group-${item.id}`}>{item.label}</ListSubheader>] : []),
        ...item.items.map(groupItem => (
          <MenuItem key={groupItem.id} selected={groupItem.selected} onClick={() => onItemClick(groupItem)}>
            {groupItem.primary}
          </MenuItem>
        ))
      ];
    }
    return [
      <MenuItem key={item.id} selected={item.selected} onClick={() => onItemClick(item)}>
        {item.primary}
      </MenuItem>
    ];
  });

const countMenuItems = (items: MenuItems = []) => items.reduce((sum, item) => sum + (isMenuGroupProps(item) ? item.items.length : 1), 0);

interface HeaderActionsProps {
  actions?: ActionsProps;
  allowFullScreen: boolean;
  variant: Variant;
  isUserTriggeredRef: { current: boolean };
  isFullscreen: boolean;
  onFullscreenToggle?: () => void;
  selectedCoach?: string;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

// The header actions in one "Actions" menu, as the Cosmos `Actions` component renders them with `menuAt={1}`.
const HeaderActions = ({
  actions,
  allowFullScreen,
  variant,
  isUserTriggeredRef,
  isFullscreen,
  onFullscreenToggle,
  selectedCoach,
  buttonRef
}: HeaderActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const extraItems: Action[] = [
    ...(allowFullScreen
      ? [
          {
            id: 'fullscreen',
            text: isFullscreen ? localizedVal('Exit fullscreen', localeCategory) : localizedVal('Fullscreen', localeCategory),
            visual: isFullscreen ? <FullscreenExitIcon fontSize='small' /> : <FullscreenIcon fontSize='small' />,
            onClick: onFullscreenToggle
          }
        ]
      : []),
    ...(isInUtilities(variant) && !isFullscreen
      ? [
          {
            id: 'minimize',
            text: localizedVal('Minimize', localeCategory),
            visual: <RemoveIcon fontSize='small' />,
            onClick: () => {
              variant.onStateChange('minimized');
              isUserTriggeredRef.current = true;
            }
          }
        ]
      : [])
  ];

  const mergedItems = [...(actions?.items ?? []), ...extraItems];
  if (mergedItems.length === 0) return null;

  const actionsText = localizedVal('Actions', localeCategory);

  return (
    <>
      <Tooltip title={actionsText}>
        <IconButton
          size='small'
          ref={buttonRef}
          aria-label={selectedCoach ? localizedVal('Actions - {1}', localeCategory).replace('{1}', selectedCoach) : actionsText}
          aria-haspopup='menu'
          aria-expanded={!!anchorEl}
          onClick={(e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)}
        >
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {mergedItems.map(({ id, text, visual, onClick }) => (
          <MenuItem
            key={id}
            onClick={() => {
              setAnchorEl(null);
              onClick?.(id);
            }}
          >
            {visual && <ListItemIcon>{visual}</ListItemIcon>}
            <ListItemText>{text}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

/**
 * The agent panel: MUI port of the Cosmos `GenAICoach` component (`GenAICoachContent` and `HeaderActions`).
 * It is registered as `GenAICoachContent` because `GenAICoach` is the widget's key in the component map.
 */
// GenAICoachContent is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function GenAICoachContent(props: GenAICoachContentProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const GenAIMessage = getComponentFromMap('GenAIMessage');
  const InitialSuggestedMessage = getComponentFromMap('InitialSuggestedMessage');
  const ConversationHistory = getComponentFromMap('ConversationHistory');
  const Questionnaire = getComponentFromMap('Questionnaire');

  const {
    coachOptions: coachOptionsProps = [],
    onCoachChange: onCoachChangeProp,
    messages = [],
    onSend,
    initialSuggestedMessages,
    suggestions,
    loading,
    error,
    variant,
    onOpen,
    guidedMode = false,
    actions,
    onNewChat,
    conversationHistory,
    onLayoutChange,
    onAddAttachment,
    attachments,
    attachmentsError,
    allowFullScreen = true,
    salutation,
    showSalutation = true,
    isPortalAgent = false,
    isInLandingPageUtilities = false,
    isFullscreenView = false,
    composerState,
    pagePanel,
    draftMessage,
    onStop,
    isCreatingConversation,
    conversationError,
    questionnaireData,
    onQuestionnaireDismiss
  } = props;

  const classes = useStyles();
  const theme = useTheme();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const conversationErrorId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const askButtonRef = useRef<HTMLButtonElement>(null);
  const generatingRef = useRef<HTMLDivElement>(null);
  const wasGeneratingRef = useRef(false);
  const isUserTriggered = useRef(false);
  const atBottomRef = useRef(true);
  const focusTextArea = useRef(false);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const [rootWidth, setRootWidth] = useState(0);
  const [ownMessage, setOwnMessage] = useState('');
  const [ownFormAnswers, setOwnFormAnswers] = useState<Record<string, FormAnswer> | undefined>();
  // The fullscreen copy edits the panel's composer state, as Cosmos shows the same component in fullscreen.
  const message = composerState ? composerState.message : ownMessage;
  const setMessage = composerState ? composerState.setMessage : setOwnMessage;
  const formAnswers = composerState ? composerState.formAnswers : ownFormAnswers;
  const setFormAnswers = composerState ? composerState.setFormAnswers : setOwnFormAnswers;
  const [questionnaireDismissed, setQuestionnaireDismissed] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [coachMenuAnchor, setCoachMenuAnchor] = useState<HTMLElement | null>(null);
  const [suggestionsMenuAnchor, setSuggestionsMenuAnchor] = useState<HTMLElement | null>(null);

  const isMinimized = isInUtilities(variant) && variant.state === 'minimized';

  const questionnaireKey = questionnaireData?.questions?.map(q => q.field).join(',') ?? '';
  const initialFormAnswers = useMemo(() => buildInitialFormAnswers(questionnaireData?.questions), [questionnaireData?.questions]);

  const latestMessage = messages.at(-1);
  const isLatestAgentMessageStreaming = !!latestMessage && isCoachMessage(latestMessage) && !!latestMessage.loading;
  const hasAgentResponse = messages.some(msg => isCoachMessage(msg) && !msg.loading);
  const completedAgentMessages = messages.filter(msg => isCoachMessage(msg) && !msg.loading).length;
  const prevCompletedAgentMessages = useRef(completedAgentMessages);

  const shouldRenderSideBySideHistory =
    !!conversationHistory && (variant.placement === 'fullpage' || isFullscreenView) && rootWidth >= sideBySideMinWidthPx;
  const condition = !shouldRenderSideBySideHistory;

  const selectedCoach = useMemo(() => {
    const flatItems = coachOptionsProps.flatMap(item => (isMenuGroupProps(item) ? item.items : [item]));
    const selected = flatItems.find(item => item.selected);
    if (selected) return selected.primary;
    return flatItems[0]?.primary;
  }, [coachOptionsProps]);

  // Tracks the component width (the Cosmos component uses its own breakpoint, not the viewport's).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      setRootWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMinimized]);

  useEffect(() => {
    onLayoutChange?.(!condition);
  }, [condition, fullScreen]);

  useEffect(() => {
    onOpen?.();
  }, []);

  // After the user minimizes or maximizes the panel, focus moves to the control that is now shown. Guided mode has no
  // text box, and none is shown while the agent loads, so focus then moves to the panel's first control, as in Cosmos.
  useEffect(() => {
    if (!isUserTriggered.current) return;
    isUserTriggered.current = false;
    if (isMinimized) {
      maximizeButtonRef.current?.focus();
    } else if (textAreaRef.current) {
      textAreaRef.current.focus();
    } else {
      rootRef.current?.querySelector<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')?.focus();
    }
  }, [isMinimized]);

  // Guided mode: the Ask button gives way to the progress indicator while an answer is generated, so focus moves to the
  // indicator and, once the answer is complete, back to the Ask button (Cosmos `Progress focusOnVisible` and its menu button).
  useEffect(() => {
    if (!guidedMode) return;
    if (isLatestAgentMessageStreaming) {
      wasGeneratingRef.current = true;
      generatingRef.current?.focus();
      return;
    }
    if (!wasGeneratingRef.current) return;
    wasGeneratingRef.current = false;
    if (!document.activeElement || document.activeElement === document.body) askButtonRef.current?.focus();
  }, [isLatestAgentMessageStreaming, guidedMode]);

  useEffect(() => {
    if (questionnaireData) setQuestionnaireDismissed(false);
    // The fullscreen copy shares the panel's answers, which the panel resets.
    if (composerState) return;
    setFormAnswers(questionnaireData ? initialFormAnswers : undefined);
  }, [initialFormAnswers, questionnaireData, questionnaireKey]);

  useEffect(() => {
    if (draftMessage !== undefined) {
      // The fullscreen copy shares the panel's text, which the panel sets.
      if (!composerState) setMessage(draftMessage);
      if (draftMessage && !fullScreen) textAreaRef.current?.focus();
    }
  }, [draftMessage]);

  // Object URLs of attachment previews are released when the panel closes.
  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  // Polite announcements: the answer being generated, and each new completed agent message.
  useEffect(() => {
    if (isLatestAgentMessageStreaming) {
      setAnnouncement(localizedVal('Generating response', localeCategory));
    }
  }, [isLatestAgentMessageStreaming]);

  useEffect(() => {
    if (completedAgentMessages > prevCompletedAgentMessages.current) {
      setAnnouncement(localizedVal('New message from agent', localeCategory));
    }
    prevCompletedAgentMessages.current = completedAgentMessages;
  }, [completedAgentMessages]);

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= scrollThresholdPx;
    atBottomRef.current = atBottom;
    setShowScrollToBottom(!atBottom);
  };

  // Follows new and streamed content while the user is at the bottom; a sent message always scrolls down.
  useEffect(() => {
    if (atBottomRef.current || (latestMessage && isUserMessage(latestMessage))) {
      atBottomRef.current = true;
      scrollToBottom(false);
      setShowScrollToBottom(false);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 || loading || error) {
      setShowScrollToBottom(false);
    }
  }, [messages.length, loading, error]);

  useEffect(() => {
    if (focusTextArea.current && !conversationHistory && textAreaRef.current) {
      textAreaRef.current.focus();
      focusTextArea.current = false;
    }
  }, [conversationHistory]);

  // Local previews of pending attachments use object URLs, revoked when the attachment is removed.
  useEffect(() => {
    const ids = new Set((attachments ?? []).map(att => att.id));
    previewUrlsRef.current.forEach((url, id) => {
      if (!ids.has(id)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(id);
      }
    });
  }, [attachments]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const previewAttachment = (attachment: FileItemProps) => {
    if (!attachment.file) return;
    let url = previewUrlsRef.current.get(attachment.id);
    if (!url) {
      url = URL.createObjectURL(attachment.file);
      previewUrlsRef.current.set(attachment.id, url);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFormChange = useCallback(
    (answers: Record<string, FormAnswer>) => {
      setFormAnswers(answers);
    },
    [setFormAnswers]
  );

  const handleFormCancel = () => {
    setFormAnswers(undefined);
    setQuestionnaireDismissed(true);
    textAreaRef.current?.focus();
    onQuestionnaireDismiss?.();
  };

  const handleSendMessage = () => {
    const hasFormAnswers = !!questionnaireData && formAnswers && Object.values(formAnswers).some(v => v.value.length > 0);
    const isMessageAndAttachmentsEmpty = !message && (!attachments || attachments.length === 0);
    const hasAttachmentsError = attachments && attachments.length > 0 && (attachmentsError || attachments.some(attachment => attachment.error));
    const isCoachMessageLoading = latestMessage && isCoachMessage(latestMessage) && latestMessage.loading;
    if ((isMessageAndAttachmentsEmpty && !hasFormAnswers) || hasAttachmentsError || isCoachMessageLoading) return;

    onSend({
      id: createUID(),
      message,
      fromComposer: true,
      attachmentIds: attachments?.map(({ id }) => id),
      formAnswers: hasFormAnswers ? formAnswers : undefined
    });
    setFormAnswers(undefined);
    setMessage('');
  };

  const handleEnterKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const enterFullscreen = () => setFullScreen(true);
  const exitFullscreen = () => setFullScreen(false);

  // ── Header ────────────────────────────────────────────────────────────────

  const renderCoachOptions = () => {
    if (coachOptionsProps.length === 0 || !selectedCoach) {
      return null;
    }
    if (countMenuItems(coachOptionsProps) === 1) {
      return (
        <Typography variant={isPortalAgent && !pagePanel?.visible ? 'h5' : 'h6'} component='h2' noWrap>
          {selectedCoach}
        </Typography>
      );
    }
    return (
      <>
        <Button
          color='inherit'
          className={classes.agentSwitcher}
          endIcon={<ArrowDropDownIcon />}
          aria-label={localizedVal('{1}, agent switcher', localeCategory).replace('{1}', selectedCoach)}
          aria-haspopup='menu'
          aria-expanded={!!coachMenuAnchor}
          onClick={(e: MouseEvent<HTMLElement>) => setCoachMenuAnchor(e.currentTarget)}
        >
          <Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCoach}
          </Box>
        </Button>
        <Menu anchorEl={coachMenuAnchor} open={!!coachMenuAnchor} onClose={() => setCoachMenuAnchor(null)}>
          {renderMenuItems(coachOptionsProps, item => {
            setCoachMenuAnchor(null);
            onCoachChangeProp?.(item.id);
          })}
        </Menu>
      </>
    );
  };

  const headerContent = isMinimized ? (
    <>
      <Typography variant='h6' component='h2' noWrap className={classes.headerTitle}>
        {selectedCoach}
      </Typography>
      <Tooltip title={localizedVal('Maximize', localeCategory)}>
        <IconButton
          size='small'
          ref={maximizeButtonRef}
          aria-label={localizedVal('Maximize', localeCategory)}
          aria-expanded={false}
          onClick={() => {
            if (isInUtilities(variant)) {
              variant.onStateChange('maximized');
              isUserTriggered.current = true;
            }
          }}
        >
          <ExpandLessIcon />
        </IconButton>
      </Tooltip>
    </>
  ) : (
    <>
      <Box className={classes.headerTitle}>{renderCoachOptions()}</Box>

      <Box className={classes.headerActions}>
        {onNewChat && (
          <Tooltip title={localizedVal('New chat', localeCategory)}>
            <IconButton
              size='small'
              aria-label={localizedVal('New chat', localeCategory)}
              onClick={() => {
                onNewChat?.();
                textAreaRef.current?.focus();
              }}
            >
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}

        <HeaderActions
          actions={actions}
          allowFullScreen={allowFullScreen}
          variant={variant}
          isUserTriggeredRef={isUserTriggered}
          isFullscreen={isFullscreenView}
          onFullscreenToggle={isFullscreenView && variant.placement === 'dialog' ? variant.onClose : enterFullscreen}
          selectedCoach={selectedCoach}
          buttonRef={actionsButtonRef}
        />

        {variant.placement === 'dialog' && !isFullscreenView && (
          <Tooltip title={localizedVal('Close', localeCategory)}>
            <IconButton size='small' aria-label={localizedVal('Close - Chat with AI', localeCategory)} onClick={variant.onClose}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </>
  );

  // ── Conversation ─────────────────────────────────────────────────────────

  const emptyState = (
    <Box className={classes.emptyState}>
      {showSalutation && (
        <>
          <AutoAwesomeIcon color='primary' sx={{ fontSize: '2.5rem' }} aria-hidden />
          <Typography variant='h6' component='h3'>
            {salutation ?? localizedVal('How can I assist you today?', localeCategory)}
          </Typography>
        </>
      )}

      {initialSuggestedMessages && initialSuggestedMessages.length > 0 && (
        <Box className={classes.initialMessages}>
          {initialSuggestedMessages.map(initialSuggestedMessage => (
            <InitialSuggestedMessage
              key={initialSuggestedMessage.id}
              {...initialSuggestedMessage}
              onSend={(initialMessage: { id: string; message?: string }) => {
                if (guidedMode) {
                  onSend({
                    id: initialMessage.id,
                    message: initialMessage.message
                  });
                } else {
                  setMessage(initialMessage.message ?? '');
                }
                textAreaRef.current?.focus();
              }}
              testId={initialSuggestedMessage.id}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  let conversationContent;
  if (loading || error) {
    conversationContent = (
      <Box className={classes.state}>
        {loading ? (
          <>
            <CircularProgress size={24} aria-hidden />
            <Typography variant='body2' role='status'>
              {typeof loading === 'string' ? loading : localizedVal('Loading…', localeCategory)}
            </Typography>
          </>
        ) : (
          <Alert severity='error' sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  } else if (messages.length === 0) {
    conversationContent = emptyState;
  } else {
    conversationContent = (
      <ul className={classes.messageList} aria-label={localizedVal('Conversation', localeCategory)}>
        {messages.map((item, index) => {
          const messageProps = isCoachMessage(item)
            ? {
                ...item,
                // Follow-up suggestions are shown on the latest message only.
                suggestions: latestMessage?.id === item.id ? item.suggestions : undefined,
                onSend
              }
            : item;
          return <GenAIMessage key={item.id || `message-${index}`} {...messageProps} />;
        })}
      </ul>
    );
  }

  // ── Composer ─────────────────────────────────────────────────────────────

  const hasSuggestions = countMenuItems(suggestions) > 0;
  const showQuestionnaire = !!questionnaireData && !questionnaireDismissed && !questionnaireData.inline;

  const questionnaire = showQuestionnaire && (
    <Questionnaire key={questionnaireKey} data={questionnaireData} onChange={handleFormChange} onCancel={handleFormCancel} />
  );

  const disclaimer = hasAgentResponse && (
    <Typography variant='caption' color='text.secondary' className={classes.disclaimer}>
      {localizedVal('Verify AI-generated content for accuracy.', localeCategory)}
    </Typography>
  );

  const generatingIndicator = (
    <Box className={classes.generating} role='status'>
      <Typography variant='body2'>{localizedVal('Generating response', localeCategory)}</Typography>
      <CircularProgress size={16} aria-hidden />
    </Box>
  );

  const suggestionsMenu = (onItemClick: (item: MenuItemProps) => void) => (
    <Menu anchorEl={suggestionsMenuAnchor} open={!!suggestionsMenuAnchor} onClose={() => setSuggestionsMenuAnchor(null)}>
      {renderMenuItems(suggestions ?? [], item => {
        setSuggestionsMenuAnchor(null);
        if (item.onClick) {
          item.onClick(item.id);
        } else {
          onItemClick(item);
        }
      })}
    </Menu>
  );

  const renderSendControl = () => {
    if (onStop) {
      return (
        <Tooltip title={localizedVal('Stop', localeCategory)}>
          <IconButton
            color='primary'
            aria-label={localizedVal('Stop', localeCategory)}
            onClick={() => {
              textAreaRef.current?.focus();
              onStop();
            }}
          >
            <StopIcon />
          </IconButton>
        </Tooltip>
      );
    }

    const isLoading = latestMessage && isCoachMessage(latestMessage) && latestMessage.loading && !latestMessage.error;

    const sendButton = (
      <Tooltip title={localizedVal('Send', localeCategory)}>
        <span>
          <IconButton
            color='primary'
            aria-label={localizedVal('Send message', localeCategory)}
            aria-disabled={isCreatingConversation || undefined}
            onClick={isCreatingConversation ? undefined : handleSendMessage}
          >
            <SendIcon />
          </IconButton>
        </span>
      </Tooltip>
    );

    if (isLoading && !isCreatingConversation) {
      return generatingIndicator;
    }

    return sendButton;
  };

  const renderTextArea = (
    <>
      {questionnaire}
      <Box className={clsx(classes.composer, conversationError && classes.composerError)}>
        <TextField
          inputRef={textAreaRef}
          variant='standard'
          multiline
          maxRows={6}
          fullWidth
          placeholder={localizedVal('Write a message', localeCategory)}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleEnterKeyDown}
          slotProps={{
            input: { disableUnderline: true },
            htmlInput: {
              'aria-label': localizedVal('Write a message', localeCategory),
              'aria-invalid': !!conversationError || undefined,
              'aria-describedby': conversationError ? conversationErrorId : undefined
            }
          }}
        />

        <Box className={classes.composerToolbar}>
          <Box className={classes.composerTools}>
            {hasSuggestions && (
              <>
                <Tooltip title={localizedVal('Suggestions', localeCategory)}>
                  <IconButton
                    size='small'
                    aria-label={localizedVal('Suggestions', localeCategory)}
                    aria-haspopup='menu'
                    aria-expanded={!!suggestionsMenuAnchor}
                    onClick={(e: MouseEvent<HTMLElement>) => setSuggestionsMenuAnchor(e.currentTarget)}
                  >
                    <LightbulbOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                {suggestionsMenu(item => {
                  setMessage(item.primary);
                  textAreaRef.current?.focus();
                })}
              </>
            )}

            {onAddAttachment && (
              <>
                <Tooltip title={localizedVal('Add attachment', localeCategory)}>
                  <IconButton
                    size='small'
                    aria-label={localizedVal('Add attachment', localeCategory)}
                    onClick={() => {
                      if (fileUploadInputRef.current) {
                        fileUploadInputRef.current.value = '';
                      }
                      fileUploadInputRef.current?.click();
                    }}
                  >
                    <AttachFileIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                <input
                  type='file'
                  ref={fileUploadInputRef}
                  className={classes.hiddenInput}
                  tabIndex={-1}
                  aria-hidden
                  onChange={e => {
                    if (e.target.files) {
                      onAddAttachment(Array.from(e.target.files));
                    }
                  }}
                  multiple={false}
                />
              </>
            )}
          </Box>

          {renderSendControl()}
        </Box>
      </Box>

      {conversationError && (
        <Typography id={conversationErrorId} variant='caption' color='error' role='alert'>
          {conversationError}
        </Typography>
      )}

      {attachments && attachments.length > 0 && (
        <>
          <ul className={classes.attachmentList} aria-label={localizedVal('Attachments', localeCategory)}>
            {attachments.map(attachment => (
              <li key={attachment.id} className={classes.attachmentItem}>
                <AttachFileIcon fontSize='small' aria-hidden />
                <Box className={classes.attachmentDetails}>
                  <Typography variant='body2' noWrap>
                    {attachment.name}
                  </Typography>
                  {attachment.inProgress && !attachment.error && (
                    <LinearProgress variant='determinate' value={attachment.progress ?? 0} aria-label={attachment.name} />
                  )}
                  {attachment.error && (
                    <Typography variant='caption' color='error'>
                      {attachment.error}
                    </Typography>
                  )}
                </Box>
                {attachment.file && !attachment.error && (
                  <Tooltip title={localizedVal('Preview', localeCategory)}>
                    <IconButton
                      size='small'
                      aria-label={`${localizedVal('Preview', localeCategory)} ${attachment.name}`}
                      onClick={() => previewAttachment(attachment)}
                    >
                      <VisibilityOutlinedIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={localizedVal('Remove attachment', localeCategory)}>
                  <IconButton
                    size='small'
                    aria-label={`${localizedVal('Remove attachment', localeCategory)} ${attachment.name}`}
                    onClick={() => {
                      (attachment.inProgress ? attachment.onCancel : attachment.onDelete)?.();
                      textAreaRef.current?.focus();
                    }}
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </li>
            ))}
          </ul>

          {attachmentsError && (
            <Alert severity='error' role='alert'>
              {attachmentsError}
            </Alert>
          )}
        </>
      )}

      {disclaimer}
    </>
  );

  const guidedComposer = (
    <>
      {questionnaire}
      {/* The Dynamic suggestion cards are not ported, so without initial prompts the menu is offered from the start. */}
      {hasSuggestions && (messages.length > 0 || !initialSuggestedMessages?.length) && (
        <>
          {latestMessage && isCoachMessage(latestMessage) && latestMessage.loading ? (
            <Box className={classes.guided} ref={generatingRef} tabIndex={-1}>
              {generatingIndicator}
            </Box>
          ) : (
            <Box className={classes.guided}>
              <Button
                ref={askButtonRef}
                variant='outlined'
                startIcon={<AutoAwesomeIcon />}
                aria-haspopup='menu'
                aria-expanded={!!suggestionsMenuAnchor}
                onClick={(e: MouseEvent<HTMLElement>) => setSuggestionsMenuAnchor(e.currentTarget)}
              >
                {localizedVal('Ask {1}', localeCategory).replace('{1}', selectedCoach ?? '')}
              </Button>
              {suggestionsMenu(item => {
                onSend({
                  id: item.id,
                  message: item.primary
                });
              })}
            </Box>
          )}

          {disclaimer}
        </>
      )}
    </>
  );

  const conversationElement = (
    <Box className={classes.conversation}>
      <Box ref={scrollAreaRef} onScroll={handleScroll} className={clsx(classes.scrollArea, isInUtilities(variant) && classes.scrollAreaBounded)}>
        {conversationContent}
      </Box>

      {showScrollToBottom && (
        <IconButton
          size='small'
          className={classes.scrollButton}
          aria-label={localizedVal('Scroll to latest message', localeCategory)}
          onClick={() => {
            atBottomRef.current = true;
            scrollToBottom(true);
            setShowScrollToBottom(false);
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}

      {!loading && <Box className={classes.footer}>{guidedMode ? guidedComposer : renderTextArea}</Box>}
    </Box>
  );

  const historyView = conversationHistory && (
    <ConversationHistory
      {...conversationHistory}
      onItemClick={(conversationId: string) => {
        if (condition) {
          focusTextArea.current = true;
        } else {
          textAreaRef.current?.focus();
        }

        conversationHistory.onItemClick?.(conversationId);
      }}
      onDismiss={() => {
        focusTextArea.current = true;
        conversationHistory.onDismiss();
      }}
      inFullPage={!condition}
    />
  );

  let bodyContent;
  if (condition) {
    // In the utilities column the history scrolls within the same height limit as the conversation.
    bodyContent = (
      <Box className={clsx(classes.body, !!conversationHistory && isInUtilities(variant) && classes.historyBounded)}>
        {conversationHistory ? historyView : conversationElement}
      </Box>
    );
  } else {
    bodyContent = (
      <Box className={clsx(classes.body, classes.sideBySide)}>
        {historyView}
        {conversationElement}
      </Box>
    );
  }

  return (
    <Box
      ref={rootRef}
      className={clsx(
        classes.root,
        isInUtilities(variant) ? classes.utilities : classes.fill,
        variant.placement === 'fullpage' && !isPortalAgent && !isInLandingPageUtilities && messages.length > 0 && classes.fillInView
      )}
      component='section'
      aria-label={selectedCoach ?? localizedVal('Agent', localeCategory)}
    >
      <Box className={classes.header}>{headerContent}</Box>

      {!isMinimized && bodyContent}

      <Box className={classes.visuallyHidden} role='status' aria-live='polite'>
        {announcement}
      </Box>

      {/* Fullscreen: the same conversation in a dialog, full screen below the md breakpoint. */}
      {!isFullscreenView && (
        <Dialog
          open={fullScreen}
          onClose={exitFullscreen}
          fullScreen={!isMdUp}
          fullWidth
          maxWidth='lg'
          aria-label={selectedCoach ?? localizedVal('Agent', localeCategory)}
          disableRestoreFocus
          slotProps={{
            paper: { sx: { height: isMdUp ? '90vh' : '100%' } },
            transition: { onExited: () => actionsButtonRef.current?.focus() }
          }}
        >
          <GenAICoachContent
            {...props}
            variant={{ placement: 'dialog', onClose: exitFullscreen }}
            isFullscreenView
            composerState={{ message, setMessage, formAnswers, setFormAnswers }}
            onOpen={undefined}
          />
        </Dialog>
      )}
    </Box>
  );
}
