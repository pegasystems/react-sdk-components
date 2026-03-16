import { useState, useEffect, useCallback } from 'react';

function formatError(error: any, localizedVal: Function): string {
  if (typeof error === 'string') return localizedVal(error, 'Messages');
  const label = error.label?.endsWith(':') ? error.label : `${error.label}:`;
  return localizedVal(`${label} ${error.description}`, 'Messages');
}

/**
 * Subscribes to the PCore store and returns formatted validation error messages
 * for the given itemKey. Reacts to any ADD_MESSAGES / CLEAR_MESSAGES dispatch
 * (blur, tab, submit, etc.) so the banner appears and clears in real time.
 */
export function useValidationBanner(itemKey: string): string[] {
  const [messages, setMessages] = useState<string[]>([]);

  const readMessages = useCallback(() => {
    const localizedVal = PCore.getLocaleUtils().getLocaleValue;
    const errors: any[] = PCore.getMessageManager().getValidationErrorMessages(itemKey) || [];
    setMessages(errors.map(error => formatError(error, localizedVal)));
  }, [itemKey]);

  useEffect(() => {
    readMessages();
    return PCore.getStore().subscribe(readMessages);
  }, [readMessages]);

  return messages;
}
