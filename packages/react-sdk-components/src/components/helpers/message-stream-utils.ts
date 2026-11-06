import type { ErrorResponse, MessageResponse, StreamResponse } from '../widget/GenAICoach/GenAICoach.types';

class MessageStreamError extends Error {
  response: ErrorResponse['response'];
  constructor(errorResponse: ErrorResponse['response']) {
    super();
    this.response = errorResponse;
  }
}

// Local stand-in for the Cosmos `tryCatch` helper: the result of `fn`, or undefined if it throws.
const tryCatch = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

export const isErrorResponse = (e: unknown): e is ErrorResponse => {
  return (
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    typeof e.response === 'object' &&
    e.response !== null &&
    'data' in e.response &&
    typeof e.response.data === 'object' &&
    e.response.data !== null &&
    'errorDetails' in e.response.data &&
    Array.isArray(e.response.data.errorDetails)
  );
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
    ----------------- final response added by platform --------------------------------------------------------------------------------------------------------------
    {aiGuidedQuestions:[],messageID:"MSG-1234",response:"Hello world"}
 */
export const handleMessageStream = async (
  result: StreamResponse,
  streamHandler?: ({ data, streaming }: { data: string; streaming: boolean }) => void,
  errorHandler?: (error: ErrorResponse) => void
): Promise<MessageResponse | undefined> => {
  const stream = result.data;
  if (!stream) {
    streamHandler?.({ data: '', streaming: false });
    return;
  }

  // Fallback incase there is no stream to handle and the response is a JSON
  const contentType = result?.headers?.['content-type'];
  if (typeof stream.getReader !== 'function') {
    // stream.getReader is unavailable – cannot process as a ReadableStream.
    // For SSE responses, signal that no content was streamed so callers can
    // fall back to their own handling; for all others, return the raw result.
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

    const processChunk = async (): Promise<MessageResponse | undefined> => {
      const { done, value } = await reader.read();

      if (done) {
        let finalResponse: MessageResponse | undefined;

        // The agent stream ends with a metadata SSE event (timing / token telemetry).
        // It carries no message content and no JSON blob follows it, so we return
        // undefined here. callSendMessage will call updateMessagesWithResponse({ data: '' })
        // which sets allChunksReceived: true and clears the loading state.
        if (/^event:\s*metadata/m.test(buffer)) {
          return finalResponse;
        }

        const jsonBoundary = buffer.indexOf('\n\n{');
        let rawJson: string | undefined;
        if (jsonBoundary !== -1) {
          rawJson = buffer.slice(jsonBoundary + 2);
        } else if (buffer.trimStart().startsWith('{')) {
          rawJson = buffer.trim();
        }

        if (rawJson) {
          const json = rawJson;
          // Try as-is first; if literal newline bytes appear inside a JSON string value,
          // sanitize unescaped \r\n / \r / \n to the \\n escape sequence and retry.
          const parsedResponse = tryCatch(() => JSON.parse(json)) ?? tryCatch(() => JSON.parse(json.replace(/(?<!\\)(\r\n|\r|\n)/g, '\\n')));

          if (parsedResponse) {
            if (parsedResponse.errorDetails) {
              const errorResponse = { data: parsedResponse };
              if (isErrorResponse({ response: errorResponse })) {
                throw new MessageStreamError(errorResponse);
              }
            } else {
              finalResponse = { data: parsedResponse };
            }
          }
        }
        return finalResponse;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      buffer += decodedChunk;

      let content = '';

      // Process complete events (ending with double newline).
      // Split on \n\n that is immediately followed by an SSE field name
      // (event:, data:) OR the opening { of the final JSON response.
      // This processes all complete SSE events while keeping the final JSON intact in buffer.
      const events = buffer.split(/\n\n(?=(?:event|data):|\{)/);

      // Keep the last incomplete event or the final JSON block in buffer
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
              // Continuation of a data field with embedded literal newlines
              // (e.g. LLM sending un-escaped \n bytes inside the JSON string).
              // Per SSE spec these should be separate data: lines, but some
              // servers emit raw newlines. Append rather than silently drop.
              eventData += `\n${line}`;
            }
          }

          if (eventType === 'error' && eventData) {
            handleError(errorHandler, eventData);
          } else if (eventType === 'message' && eventData) {
            try {
              const parsedData = JSON.parse(eventData);
              if (parsedData?.content) {
                content += parsedData.content;
              }
            } catch {
              // If JSON parsing fails, use raw data, this should never happen considering above contract
              content += eventData;
            }
          } else if (eventType === 'toolReasonEnd') {
            // Add a new line for toolReasonEnd event
            content += '\n';
          }
          // Note: 'metadata' events are intentionally ignored here.
          // They serve as agent end-of-stream markers and are handled in the done=true block above.
        }
      }

      if (content) {
        streamHandler?.({ data: content, streaming: true });
        completeResponse = completeResponse.concat(content);
      }
      return processChunk();
    };

    return await processChunk();
  } finally {
    reader?.releaseLock();
  }
};
