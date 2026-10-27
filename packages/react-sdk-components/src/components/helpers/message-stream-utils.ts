import type { ErrorResponse, MessageResponse, StreamEvent, StreamResponse } from '../widget/GenAICoach/GenAICoach.types';
import type { Question, QuestionnaireConfig } from '../designSystemExtension/GenAICoachContent/GenAICoach.types';

class MessageStreamError extends Error {
  response: ErrorResponse['response'];
  constructor(errorResponse: ErrorResponse['response']) {
    super();
    this.response = errorResponse;
  }
}

// Local stand-in for the Cosmos `tryCatch` helper: returns undefined when the callback throws.
const tryCatch = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

const checkErrorResponse = (e: unknown): e is ErrorResponse =>
  typeof e === 'object' &&
  e !== null &&
  'response' in e &&
  typeof e.response === 'object' &&
  e.response !== null &&
  'data' in e.response &&
  typeof e.response.data === 'object' &&
  e.response.data !== null &&
  'errorDetails' in e.response.data &&
  Array.isArray(e.response.data.errorDetails) &&
  e.response.data.errorDetails.length > 0 &&
  typeof e.response.data.errorDetails[0]?.localizedValue === 'string';

interface LocalizationService {
  getLocalizedText: (text: string) => string;
}

export const normalizeErrorResponse = (e: unknown, l11nService: LocalizationService, fallbackMessage?: string): ErrorResponse => {
  if (checkErrorResponse(e)) {
    return e;
  }
  const defaultMsg = 'Something went wrong. Try again.';
  const rawMessage = fallbackMessage ?? defaultMsg;
  const message = e instanceof Error && e.message ? e.message : l11nService.getLocalizedText(rawMessage);
  return {
    response: {
      data: {
        errorDetails: [
          {
            message,
            erroneousInputOutputFieldInPage: '',
            erroneousInputOutputIdentifier: '',
            errorClassification: '',
            localizedValue: message,
            messageParameters: []
          }
        ]
      }
    }
  };
};

/**
 * Parses a questionnaire payload that arrives on a conversation history message.
 *
 * The history API serializes the questionnaire as a JSON string of the shape
 * `{ component: 'questionnaire', props: '<json string>' }`, where `props` is
 * itself a JSON string of `{ questionnaire: { questions: Question[] } }`.
 */
export const parseQuestionnaireFromHistory = (questionnaire: string | undefined): QuestionnaireConfig | undefined => {
  if (!questionnaire) return undefined;

  const outer = tryCatch<{ component?: string; props?: string }>(() => JSON.parse(questionnaire));
  if (!outer || outer.component !== 'questionnaire' || typeof outer.props !== 'string') {
    return undefined;
  }

  const props = tryCatch<{ questionnaire?: QuestionnaireConfig }>(() => JSON.parse(outer.props ?? ''));
  const questions = props?.questionnaire?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return undefined;
  }

  return { questions, inline: props?.questionnaire?.inline };
};

const handleError = (errorHandler: ((error: ErrorResponse) => void) | undefined, eventData: string) => {
  if (errorHandler) {
    try {
      const parsedError = JSON.parse(eventData);
      errorHandler({
        response: {
          data: {
            errorDetails: [
              {
                message: parsedError.errorMessage,
                erroneousInputOutputFieldInPage: '',
                erroneousInputOutputIdentifier: '',
                errorClassification: '',
                localizedValue: parsedError.errorMessage,
                messageParameters: []
              }
            ]
          }
        }
      });
    } catch {
      // If JSON parsing fails, use raw error data
      errorHandler({
        response: {
          data: {
            errorDetails: [
              {
                message: eventData,
                erroneousInputOutputFieldInPage: '',
                erroneousInputOutputIdentifier: '',
                errorClassification: '',
                localizedValue: eventData,
                messageParameters: []
              }
            ]
          }
        }
      });
    }
  }
};

/* The stream is of the format
    ----------------- stream from the assistant service (https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#examples) -----------
    event:message + \n
    data:{content:"Hello"} + \n\n
    event:message + \n
    data:{content:"world"} + \n\n
    For agent streams, additional event types are emitted:
      event:toolCallStart  data: { toolType, toolName, displayMetadata }
      event:toolCallEnd    data: { toolType, toolName, displayMetadata, output: { status } }
    ----------------- final response added by platform --------------------------------------------------------------------------------------------------------------
    {aiGuidedQuestions:[],messageID:"MSG-1234",response:"Hello world"}
 */
export const handleMessageStream = async (
  result: StreamResponse,
  streamHandler?: ({ data, streaming }: { data: string; streaming: boolean }) => void,
  errorHandler?: (error: ErrorResponse) => void,
  agentStreamHandler?: (event: StreamEvent) => void,
  questionnaireHandler?: (data: QuestionnaireConfig) => void
): Promise<MessageResponse | undefined> => {
  const stream = result.data;
  if (!stream) {
    streamHandler?.({ data: '', streaming: false });
    return;
  }

  // Fallback incase there is no stream to handle and the response is a JSON
  const contentType = result?.headers?.['content-type'];
  if (typeof stream.getReader !== 'function') {
    if (typeof contentType === 'string' && contentType.startsWith('text/event-stream')) {
      return undefined;
    }
    return result as MessageResponse;
  }

  const reader: ReadableStreamDefaultReader<Uint8Array> = stream.getReader();
  const decoder = new TextDecoder();

  try {
    let completeResponse = '';
    let buffer = ''; // Buffer to accumulate incomplete chunks
    const pendingQuestionnaireQuestions: Question[] = [];

    const processChunk = async (): Promise<MessageResponse | undefined> => {
      const { done, value } = await reader.read();

      if (done) {
        // Parse the final response left in the buffer after stream processing
        let finalResponse: MessageResponse | undefined;
        if (/^event:\s*metadata/m.test(buffer)) {
          // Deviation from Constellation: questions are also delivered when the stream ends with a metadata frame.
          if (questionnaireHandler && pendingQuestionnaireQuestions.length > 0) {
            questionnaireHandler({ questions: pendingQuestionnaireQuestions });
          }
          return finalResponse;
        }

        // Extract JSON from buffer - it may be preceded by SSE event data
        const jsonBoundary = buffer.indexOf('\n\n{');
        let rawJson: string | undefined;
        if (jsonBoundary !== -1) {
          rawJson = buffer.slice(jsonBoundary + 2);
        } else if (buffer.trimStart().startsWith('{')) {
          rawJson = buffer.trim();
        }

        if (rawJson) {
          const json = rawJson;
          const parsedResponse = tryCatch(() => JSON.parse(json)) ?? tryCatch(() => JSON.parse(json.replace(/(?<!\\)(\r\n|\r|\n)/g, '\\n')));

          if (parsedResponse) {
            if (parsedResponse?.errorDetails) {
              const errorResponse = { data: parsedResponse };
              throw new MessageStreamError(errorResponse);
            } else {
              finalResponse = { data: parsedResponse };
            }
          }
        }

        if (questionnaireHandler && pendingQuestionnaireQuestions.length > 0) {
          questionnaireHandler({ questions: pendingQuestionnaireQuestions });
        }

        return finalResponse;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      buffer += decodedChunk;

      // Accumulated plain-text content for the legacy (non-agent) streamHandler
      let textContent = '';

      // Process complete events (ending with double newline).
      // Split on \n\n that is immediately followed by an SSE field name
      const events = buffer.split(/\n\n(?=(?:event|data):|\{)/);

      // Keep the last incomplete event in buffer
      buffer = events.pop() || '';

      for (const event of events) {
        if (event.trim()) {
          const lines = event.split('\n');
          let eventType = '';
          let eventData = '';
          let dataStarted = false;

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              // Handle multi-line data by concatenating
              if (eventData) {
                eventData += '\n';
              }
              eventData += line.replace('data:', '').trim();
              dataStarted = true;
            } else if (dataStarted && line !== '') {
              eventData += `\n${line}`;
            }
          }

          if (eventType === 'error' && eventData) {
            handleError(errorHandler, eventData);
          } else if (eventType === 'message' && eventData) {
            try {
              const parsedData = JSON.parse(eventData);
              if (parsedData?.content) {
                if (agentStreamHandler) {
                  agentStreamHandler({ type: 'message', content: parsedData.content });
                } else {
                  textContent += parsedData.content;
                }
              }
            } catch {
              // If JSON parsing fails, use raw data — this should never happen given the above contract
              if (agentStreamHandler) {
                agentStreamHandler({ type: 'message', content: eventData });
              } else {
                textContent += eventData;
              }
            }
          } else if (eventType === 'toolReasonEnd') {
            // Add a line break after the LLM reasoning phase
            if (agentStreamHandler) {
              agentStreamHandler({ type: 'message', content: '\n' });
            } else {
              textContent += '\n';
            }
          } else if (eventType === 'questionnaireProvided' && questionnaireHandler && eventData) {
            try {
              const parsed: { questionnaire?: { questions?: Question[] } } = JSON.parse(eventData);
              if (parsed.questionnaire?.questions) {
                pendingQuestionnaireQuestions.push(...parsed.questionnaire.questions);
              }
            } catch {
              // Skip malformed questionnaireProvided events
            }
          } else if ((eventType === 'toolCallStart' || eventType === 'toolCallEnd') && agentStreamHandler && eventData) {
            const sanitized = eventData.replace(/,(\s*[}\]])/g, '$1');
            const parsedData = tryCatch(() => JSON.parse(sanitized));

            if (parsedData) {
              const shared = {
                toolType: parsedData.toolType,
                toolName: parsedData.toolName,
                displayMetadata: parsedData.displayMetadata ?? {}
              };

              agentStreamHandler(
                eventType === 'toolCallEnd'
                  ? { type: 'toolCallEnd', ...shared, output: parsedData.output ?? { status: 'UNKNOWN' } }
                  : { type: 'toolCallStart', ...shared }
              );
            }
          }
        }
      }

      if (textContent) {
        streamHandler?.({ data: textContent, streaming: true });
        completeResponse = completeResponse.concat(textContent);
      }
      return processChunk();
    };

    return await processChunk();
  } finally {
    reader?.releaseLock();
  }
};
