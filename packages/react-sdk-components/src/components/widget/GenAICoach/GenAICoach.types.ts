import type { ConversationHistoryProps, FileDisplayProps, GenAIMessageProps } from '../../designSystemExtension/GenAICoachContent/GenAICoach.types';

// ─── Engine types (declared locally; not in @pega/pcore-pconnect-typedefs 4.1) ─

export type Prompt =
  | {
      pxObjClass: string;
      pyInstructions: string;
      pyPrompt: string;
    }
  | {
      '@class': string;
      instructions: string;
      prompt: string;
    };

type MessageResponseForCoach = {
  data: string;
};

type MessageResponseForAgent = {
  data: {
    messageID: string;
    response: string;
    aiGuidedQuestions?: Prompt[];
  };
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
  disclaimerMessage?: string;
  initialInstruction: string;
  initialAdditionalInstruction?: string;
  assistantMode?: string;
  messageID?: string;
  aiGuidedQuestions?: Prompt[];
  enableTracer?: boolean;
  supportedCapabilities?: {
    stream?: {
      isEnabled: boolean;
    };
  };
  recommendationMessages?: RecommendationMessage[];
};
export type RecommendationMessage = {
  pyRole: 'ASSISTANT' | 'USER';
  pyContent: string;
  pyMessageID: string;
};
export type ConversationMessage = {
  content: string;
  createdOn: string;
  isLiked: boolean | null;
  role: 'USER' | 'ASSISTANT';
  messageID: string;
  aiGuidedQuestions: Prompt[];
  attachments?: FileDisplayProps[];
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

export type ConversationResponse = {
  data: CoachMetaData;
};

export type CoachData = {
  id: string;
  data: CoachMetaData;
  type: string;
  conversations: {
    [key: string]: { messages: GenAIMessageProps[] } | null;
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
