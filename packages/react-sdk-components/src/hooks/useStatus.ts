import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface FormStatusProps {
  hasSuggestions?: boolean;
  showFieldMessage?: boolean;
  messageVisibility?: boolean;
  showSuggestionStatus?: boolean;
  validatemessage?: string;
  readOnly?: boolean;
}

export type Status = 'error' | 'warning' | 'pending' | 'success' | undefined;

const useStatus = ({ showFieldMessage, messageVisibility, validatemessage, readOnly }: FormStatusProps = {}): [
  Status,
  Dispatch<SetStateAction<Status>>
] => {
  const [status, setStatus] = useState<Status>();

  useEffect(() => {
    if (validatemessage) {
      setStatus('error');
    } else if (showFieldMessage && messageVisibility && !readOnly) {
      setStatus('error');
    } else {
      setStatus(undefined);
    }
  }, [validatemessage, messageVisibility, readOnly, showFieldMessage]);

  return [status, setStatus];
};

export default useStatus;
