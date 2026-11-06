import type { ComponentType, ReactNode } from 'react';

// ─── Local stand-ins for the Cosmos core prop types used by the port ─────────

export interface MenuItemProps {
  id: string;
  primary: string;
  selected?: boolean;
  onClick?: (id: string) => void;
}

export interface MenuGroupProps {
  id: string;
  label: string;
  items: MenuItemProps[];
}

export type MenuItems = (MenuItemProps | MenuGroupProps)[];

export interface Action {
  id: string;
  text: string;
  visual?: ReactNode;
  /** Name of the Cosmos icon of the action; `copy` is rendered for message actions. */
  icon?: string;
  onClick?: (id: string) => void;
}

export interface ActionsProps {
  items: Action[];
}

export interface FileItemProps {
  id: string;
  name: string;
  ID?: string;
  type?: string;
  format?: string;
  createTime?: number;
  progress?: number;
  inProgress?: boolean;
  error?: string;
  onDelete?: () => void;
  onCancel?: () => void;
  file?: File;
}

export interface FileDisplayProps {
  id: string;
  name?: string;
  displayText?: string;
  value?: string;
  format?: string;
  onPreview?: () => void;
}

// ─── GenAICoach types ────────────────────────────────────────────────────────

export type State = 'minimized' | 'maximized';

export type Variant =
  | { placement: 'utilities'; state: State; onStateChange: (state: State) => void }
  | { placement: 'fullpage' }
  | { placement: 'dialog'; onClose: () => void };

export type Reaction = 'liked' | 'disliked';

/**
 * Markdown overrides: a function per token type returning the component to render that token with. The component gets
 * the token and its rendered inline content (`children`), such as the formatted text of a link.
 */
export type MarkdownMap = Record<string, (token: any) => ComponentType<{ token: any; children?: ReactNode }> | undefined>;

export interface MessageProps {
  id: string;
  message?: string;
}

export interface UserMessageProps extends MessageProps {
  from: 'user';
  attachments?: FileDisplayProps[];
}

export interface MessageFeedback {
  reaction?: Reaction;
  feedbackText?: string;
  onReaction?: (id: MessageProps['id'], reaction: Reaction | undefined) => void;
  onFeedbackComplete?: (id: MessageProps['id'], comment?: string) => void;
  promptFeedbackOn?: Reaction | 'both';
  allowFeedbackResubmission?: boolean;
}

export interface MessageFeedbackProps {
  messageId: MessageProps['id'];
  feedback?: MessageFeedback;
}

export interface SuggestionProps {
  id: string;
  message: string;
}

export interface CoachMessageProps extends MessageProps {
  from: 'coach';
  coachName?: string;
  suggestions?: SuggestionProps[];
  loading?: boolean;
  enableStreaming?: boolean;
  allChunksReceived?: boolean;
  onStreamingUpdate?: (isStreamingDone: boolean) => void;
  error?: string;
  markdownMap?: MarkdownMap;
  feedback?: MessageFeedback;
  messageActions?: ActionsProps;
  onSend?: (item: SendMessageProps) => void;
}

export type GenAIMessageProps = UserMessageProps | CoachMessageProps;

export interface ConversationHistoryProps {
  data: {
    id: string;
    section: string;
    conversations: { id: string; title: string }[];
  }[];
  onItemClick?: (conversationId: string) => void;
  loading?: boolean;
  loadMore?: () => void;
  inFullPage?: boolean;
  onDismiss: () => void;
  selectedItemId?: string;
  error?: string;
}

export interface SendMessageProps {
  id: string;
  message: string;
  fromComposer?: boolean;
  attachmentIds?: string[];
}

export interface InitialSuggestedMessageProps extends MessageProps {
  testId?: string;
  onSend: (item: SendMessageProps) => void;
}

/** Composer text of an agent panel. */
export interface ComposerState {
  message: string;
  setMessage: (message: string) => void;
}

/** Props of the Cosmos `GenAICoach` component, registered here as `GenAICoachContent`. */
export interface GenAICoachContentProps {
  coachOptions: MenuItems;
  onCoachChange?: (id: string) => void;
  messages?: GenAIMessageProps[];
  onSend: (item: SendMessageProps) => void;
  initialSuggestedMessages?: MessageProps[];
  suggestions?: MenuItems;
  loading?: boolean | string;
  error?: string;
  variant: Variant;
  onOpen?: () => void;
  guidedMode?: boolean;
  actions?: ActionsProps;
  conversationHistory?: ConversationHistoryProps;
  onLayoutChange?: (inFullPage: boolean) => void;
  onAddAttachment?: (files: File[]) => void;
  attachments?: FileItemProps[];
  attachmentsError?: string;
  allowFullScreen?: boolean;
  salutation?: string;
  showSalutation?: boolean;
  /** Configurable disclaimer message shown at the top of the messages. */
  disclaimerMessage?: ReactNode;
  /** The agent is shown in the expanded utilities column of a landing page, where it fills the column. */
  isInLandingPageUtilities?: boolean;
  /** Set on the panel's own fullscreen copy (the Cosmos component reads this state from its fullscreen context). */
  isFullscreenView?: boolean;
  /** The panel's composer state, shared with its fullscreen copy so that the text carries over both ways. */
  composerState?: ComposerState;
  /** When set, pre-populates the message box with the given text without sending. */
  draftMessage?: string;
  /** Message shown briefly by the panel; stands in for the Cosmos toaster (for example after copying a response). */
  toastMessage?: string;
  /** Called when the toast message is dismissed. */
  onToastClose?: () => void;
}

/** Props of the Cosmos `UtilitiesLayout` component: the utilities column of a landing page. */
export interface UtilitiesLayoutProps {
  /** Agent props from `useGenAICoachObj`; the panel's `variant` is set by the layout. */
  genAICoachProps?: Omit<GenAICoachContentProps, 'variant'>;
  /** Callback triggered when utilities are expanded or collapsed */
  onToggleUtilities?: (utilitiesExpanded: boolean) => void;
  /** show utilities in expanded mode */
  defaultExpandUtilities?: boolean;
  /** Determines if the actions will be disabled. */
  disabled?: boolean;
}
