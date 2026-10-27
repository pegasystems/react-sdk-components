import type { ConversationHistoryProps, FileDisplayProps, GenAIMessageProps } from '../../designSystemExtension/GenAICoachContent/GenAICoach.types';
import type { MenuGroupProps, MenuItemProps, QuestionnaireConfig } from '../../designSystemExtension/GenAICoachContent/GenAICoach.types';

// ─── Engine types (declared locally; not in @pega/pcore-pconnect-typedefs 4.1) ─

export type Prompt = {
  pxObjClass: string;
  pyInstructions: string;
  pyPrompt: string;
  [key: string]: unknown;
};

export interface ActionInput {
  pxObjClass: string;
  pyInputRequired: boolean;
  pyInputReadOnly: boolean;
  pyInputValue: string;
  pyInputKey: string;
  pyInputLabel: string;
  pyInputType: 'INTEGER' | 'STRING' | 'BOOLEAN';
}

export interface ToolResponse {
  pxObjClass: string;
  pyConfirmationMessage: string;
  pyActionClass: string;
  pyAction: string;
  pyActionInputs: ActionInput[];
  pyCall_ID: string;
  pyActionType: string;
  pyToolApprovalStatus: 'Modified' | 'Accepted' | 'Rejected';
  pyModifiedActionInputs?: ActionInput[];
}

export interface QuestionnaireSelectedItem {
  key: string;
  label: string;
}

export interface QuestionnaireAnswerPayload {
  field: string;
  type: 'single' | 'multi';
  questionText: string;
  selectedItems: QuestionnaireSelectedItem[];
}

export interface QuestionnaireEvent {
  questions: QuestionnaireAnswerPayload[];
}

// ─── Agent SSE stream event types ────────────────────────────────────────────

interface ToolEntityMetadata {
  ID: string | null;
  label: string;
}

interface ToolAssignmentMetadata {
  ID: string;
  label: string;
  taskID: string;
  processID?: string;
  stageID?: string;
  stageLabel?: string;
  isTaskCompleted?: boolean;
}

export interface ToolCallDisplayMetadata {
  casetype?: ToolEntityMetadata;
  case?: ToolEntityMetadata;
  assignment?: ToolAssignmentMetadata;
  output?: string; // For UI_INSIGHT tool
}

export type StreamEventType = 'CREATE_CASE' | 'OPEN_CASE' | 'PERFORM_ASSIGNMENT' | 'UI_INSIGHT';

export type StreamEvent =
  | { type: 'message'; content: string }
  | { type: 'toolCallStart'; toolType: StreamEventType; toolName: string; displayMetadata: ToolCallDisplayMetadata }
  | {
      type: 'toolCallEnd';
      toolType: StreamEventType;
      toolName: string;
      displayMetadata: ToolCallDisplayMetadata;
      output: { status: string };
    };

/** Per-stream state for the agent stream handler — consolidated into a single ref. */
export interface AgentStreamState {
  /** ID of the active text message outside of the PA flow. */
  activeMessageId: string;
  /** ID of the persistent PA progress indicator message. */
  assignmentProgressId: string;
  /** ID of the persistent PA text message. */
  assignmentTextId: string;
  /** Accumulated assignment step labels for the progress indicator. */
  assignmentStepLabels: string[];
  /** Number of assignment steps completed (drives checkmark vs spinner). */
  assignmentStepsCompleted: number;
  /** taskID of the last started assignment step (used for retry detection). */
  lastTaskId: string;
  /** Label stashed for the system error message if a PA step fails. */
  assignmentFailedLabel: string;
  /** ID of the persistent case-creation progress message (kept alive across retries). */
  caseCreationProgressId: string;
}

/** Callback signature for the messages state updater. */
export type SetMessagesUpdater = (updater: (prev: GenAIMessageProps[]) => GenAIMessageProps[]) => void;

/** Callback to retrieve the currently selected coach menu item. */
export type GetActiveCoach = () => MenuItemProps | MenuGroupProps;

type MessageResponseForCoach = {
  data: string;
  status?: number;
};

type MessageResponseForAgent = {
  data: {
    messageID: string;
    response: string;
    aiGuidedQuestions?: Prompt[];
    toolsNeedConfirmation?: ToolResponse[];
    supportedCapabilities?: {
      tools?: {
        toolsReviewMessage: string;
      };
    };
  };
  status?: number;
};

export type MessageResponse = MessageResponseForAgent | MessageResponseForCoach;

/** The parts of an HTTP response the stream handling reads (the engine returns an Axios response). */
export interface StreamResponse {
  data: any;
  headers?: Record<string, unknown>;
  status?: number;
}

type CoachMetaData = {
  ID: string;
  response: string;
  suggestedPrompts: Prompt[];
  welcomeMessage?: string;
  initialInstruction: string;
  initialAdditionalInstruction?: string;
  assistantMode?: string;
  messageID?: string;
  aiGuidedQuestions?: Prompt[];
  turnOffFeedback?: boolean;
  supportedCapabilities?: {
    stream?: {
      isEnabled: boolean;
    };
  };
  suggestionsMode?: 'Dynamic' | 'Static';
};

export type ConversationResponse = {
  data: CoachMetaData;
};

export type ConversationMessage = {
  content: string;
  createdOn: string;
  isLiked: boolean | null;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  type?: string;
  messageID: string;
  aiGuidedQuestions: Prompt[];
  attachments?: FileDisplayProps[];
  toolsNeedConfirmation?: ToolResponse[];
  supportedCapabilities?: {
    tools?: {
      toolsReviewMessage: string;
    };
  };
  /** Present on SYSTEM messages when the history API includes the full event payload as a string. */
  event?: string;
  /** Tool type identifier returned by the API */
  toolType?: string;
  /** Present on ASSISTANT messages when the history API includes a questionnaire component payload as a string. */
  questionnaire?: string;
};

export type GetMessagesResponse = {
  data: {
    createdOn: string;
    updatedOn: string;
    id: string;
    name: string;
    messages: ConversationMessage[];
  };
};

export type HistoryResponse = {
  createdOn: string;
  updatedOn: string;
  id: string;
  name: string;
  title: string;
};

export type CoachData = {
  id: string;
  data: CoachMetaData;
  type: string;
  conversations: {
    [key: string]: { messages: GenAIMessageProps[]; pendingQuestionnaire?: QuestionnaireConfig };
  };
  latestConversationId: string;
  history: ConversationHistoryProps['data'];
};

export type ErrorResponse = {
  name?: string;
  message?: string;
  response: {
    data: {
      errorDetails: {
        message: string;
        erroneousInputOutputFieldInPage: string;
        erroneousInputOutputIdentifier: string;
        errorClassification: string;
        localizedValue: string;
        messageParameters: string[];
      }[];
    };
  };
};

export type GenAICoach = {
  type: 'GenAICoachObject' | 'AIAgentObject';
  config: {
    coach: {
      classID: string;
      insName: string;
      label: string;
      type: string;
    } | null;
    visibility?: boolean;
  };
};

export type AttachmentMeta = {
  fileName: string;
  ID: string;
  id: string;
  mimeType: string;
  extension: string;
};

export interface ConfigurationResponse {
  data: Partial<
    Pick<
      CoachMetaData,
      | 'suggestedPrompts'
      | 'assistantMode'
      | 'turnOffFeedback'
      | 'initialInstruction'
      | 'initialAdditionalInstruction'
      | 'supportedCapabilities'
      | 'suggestionsMode'
      | 'welcomeMessage'
    >
  >;
}

/** Category metadata attached to each suggested prompt in Dynamic mode. */
export interface SuggestedPromptCategory {
  foregroundColor: string;
  backgroundColor: string;
  icon: string;
  name: string;
}

/** Shape of a single item in `suggestedPrompts` when `suggestionsMode` is `"Dynamic"`. */
export interface DynamicSuggestedPrompt {
  pxObjClass: string;
  pyPrompt: string;
  pyInstructions: string;
  title: string;
  category: SuggestedPromptCategory;
  auxiliaryValue?: string;
  isAISuggestion?: string;
}
