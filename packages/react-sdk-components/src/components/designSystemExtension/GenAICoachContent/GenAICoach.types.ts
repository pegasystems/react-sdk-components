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

/** Markdown overrides: a function per token type returning the component to render that token with. */
export type MarkdownMap = Record<string, (token: any) => ComponentType<{ token: any }> | undefined>;

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
  selected?: boolean;
}

export interface CoachMessageProps extends MessageProps {
  from: 'coach';
  coachName?: string;
  isCustom?: boolean;
  suggestions?: SuggestionProps[];
  loading?: boolean;
  progressSteps?: string[];
  progressStepsCompleted?: number;
  enableStreaming?: boolean;
  allChunksReceived?: boolean;
  onStreamingUpdate?: (isStreamingDone: boolean) => void;
  error?: string;
  markdownMap?: MarkdownMap;
  feedback?: MessageFeedback;
  onSend?: (item: SendMessageProps) => void;
}

export interface CaseDetails {
  id: string;
  type: string;
  label: string;
}

export interface SystemMessageProps extends MessageProps {
  from: 'system';
  caseInfo?: CaseDetails;
  stopped?: boolean;
}

export type GenAIMessageProps = UserMessageProps | CoachMessageProps | SystemMessageProps;

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

export interface OptionItem {
  key: string;
  label: string;
  displayLabel?: string;
  selected?: boolean;
}

export interface FormAnswer {
  value: string[];
  questionText: string;
}

export interface Question {
  field: string;
  type: 'single' | 'multi';
  questionText: string;
  defaultInput?: string[] | string;
  optionItems: OptionItem[];
}

export interface QuestionnaireConfig {
  questions: Question[];
  inline?: boolean;
}

export interface QuestionnaireProps {
  data: QuestionnaireConfig;
  onChange: (answers: Record<string, FormAnswer>) => void;
  onCancel: () => void;
}

export interface QuestionItemProps {
  question: Question;
  answer: FormAnswer;
  onChange: (field: string, key: string, selected: boolean) => void;
}

export interface SendMessageProps {
  id: string;
  message?: string;
  fromComposer?: boolean;
  attachmentIds?: string[];
  formAnswers?: Record<string, FormAnswer>;
}

export interface InitialSuggestedMessageProps extends MessageProps {
  testId?: string;
  onSend: (item: SendMessageProps) => void;
}

export interface PagePanel {
  content: ReactNode;
  visible: boolean;
}

/** Composer text and question answers of an agent panel. */
export interface ComposerState {
  message: string;
  setMessage: (message: string) => void;
  formAnswers?: Record<string, FormAnswer>;
  setFormAnswers: (formAnswers?: Record<string, FormAnswer>) => void;
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
  onNewChat?: () => void;
  conversationHistory?: ConversationHistoryProps;
  onLayoutChange?: (inFullPage: boolean) => void;
  onAddAttachment?: (files: File[]) => void;
  attachments?: FileItemProps[];
  attachmentsError?: string;
  allowFullScreen?: boolean;
  salutation?: string;
  showSalutation?: boolean;
  isPortalAgent?: boolean;
  /** The agent is shown in the expanded utilities column of a landing page, where it fills the column. */
  isInLandingPageUtilities?: boolean;
  /** Set on the panel's own fullscreen copy (the Cosmos component reads this state from its fullscreen context). */
  isFullscreenView?: boolean;
  /** The panel's composer state, shared with its fullscreen copy so that text and answers carry over both ways. */
  composerState?: ComposerState;
  pagePanel?: PagePanel;
  draftMessage?: string;
  onStop?: () => void;
  isCreatingConversation?: boolean;
  conversationError?: string;
  questionnaireData?: QuestionnaireConfig;
  onQuestionnaireDismiss?: () => void;
}

export interface PortalAgentSplitViewProps {
  children: ReactNode;
  pagePanel: PagePanel;
  showAgentPanel: boolean;
  agentExpanded?: boolean;
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
