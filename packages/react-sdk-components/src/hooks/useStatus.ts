import { useEffect, useState } from 'react';

export interface FormStatusProps {
  hasSuggestions?: boolean;
  showFieldMessage?: boolean;
  messageVisibility?: boolean;
  showSuggestionStatus?: boolean;
  validatemessage?: string;
  readOnly?: boolean;
}

export type Status = 'error' | 'warning' | 'pending' | 'success' | undefined;

const useStatus = ({ showFieldMessage, messageVisibility, validatemessage, readOnly }: FormStatusProps = {}): Status => {
  const [status, setStatus] = useState<any>();

  useEffect(() => {
    if (validatemessage) {
      setStatus('error');
    } else if (showFieldMessage && messageVisibility && !readOnly) {
      setStatus('warning');
    } else {
      setStatus(undefined);
    }
  }, [validatemessage, messageVisibility, readOnly, showFieldMessage]);

  return status;
};

export default useStatus;
