import { createContext } from 'react';

// Provided by GenAIMessage and read by the agent markdown renderers. It lives in helpers so that an overridden
// GenAIMessage still shares this one context object with the SDK renderers.
export type StreamingContextProps = {
  isStreamingMessage?: boolean;
  isStreamingInProgress?: boolean;
};

/** Metadata Context */
export const StreamingContext = createContext<StreamingContextProps | undefined>({
  isStreamingMessage: false
});
