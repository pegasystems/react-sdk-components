import type {
  CoachMessageProps,
  GenAIMessageProps,
  MenuGroupProps,
  MenuItemProps,
  Question,
  State,
  UserMessageProps,
  Variant
} from './GenAICoach.types';

export const getSelectedKeys = (question: Question): string[] => question.optionItems.filter(option => option.selected).map(option => option.key);

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

// Local stand-ins for the Cosmos helpers the ported code uses.
export const createUID = (): string => {
  return `_${Math.random().toString(36).slice(2, 11)}`;
};

export const isMenuGroupProps = (item: MenuItemProps | MenuGroupProps): item is MenuGroupProps => {
  return 'items' in item && Array.isArray(item.items);
};
