import type { CoachMessageProps, GenAIMessageProps, MenuGroupProps, MenuItemProps, State, UserMessageProps, Variant } from './GenAICoach.types';

export const isCoachMessage = (message: GenAIMessageProps): message is CoachMessageProps => {
  return message.from === 'coach';
};

export const isUserMessage = (message: GenAIMessageProps): message is UserMessageProps => {
  return message.from === 'user';
};

export const isInUtilities = (
  item: Variant
): item is {
  placement: 'utilities';
  state: State;
  onStateChange: (state: State) => void;
} => {
  return item.placement === 'utilities';
};

export const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);

    try {
      textArea.select();
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  } catch {
    return false;
  }
};

// Local stand-ins for the Cosmos helpers the ported code uses.
export const createUID = (): string => {
  return `_${Math.random().toString(36).slice(2, 11)}`;
};

export const isMenuGroupProps = (item: MenuItemProps | MenuGroupProps): item is MenuGroupProps => {
  return 'items' in item && Array.isArray(item.items);
};
