import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import isEqual from 'fast-deep-equal';
import HistoryIcon from '@mui/icons-material/History';

import { createUID, isCoachMessage, isMenuGroupProps } from '../components/designSystemExtension/GenAICoachContent/GenAICoach.utils';
import type {
  ActionsProps,
  CoachMessageProps,
  ConversationHistoryProps,
  FileDisplayProps,
  FileItemProps,
  GenAIMessageProps,
  MenuItemProps,
  MenuGroupProps,
  MenuItems,
  MessageProps,
  QuestionnaireConfig,
  Reaction,
  SendMessageProps,
  State,
  UserMessageProps
} from '../components/designSystemExtension/GenAICoachContent/GenAICoach.types';
import type {
  AttachmentMeta,
  CoachData,
  ConfigurationResponse,
  ConversationMessage,
  ConversationResponse,
  DynamicSuggestedPrompt,
  ErrorResponse,
  GenAICoach,
  GetMessagesResponse,
  HistoryResponse,
  MessageResponse,
  Prompt,
  QuestionnaireAnswerPayload,
  QuestionnaireEvent,
  StreamResponse,
  ToolResponse
} from '../components/widget/GenAICoach/GenAICoach.types';
import { validateMaxSize } from '../components/helpers/attachmentShared';
import { fileDownload } from '../components/widget/Attachment/AttachmentUtils';
import { handleMessageStream, normalizeErrorResponse, parseQuestionnaireFromHistory } from '../components/helpers/message-stream-utils';
import { createAgentMarkdownMap } from '../components/helpers/agent-markdown-renderers';

import useAgentStreamHandler from './useAgentStreamHandler';

const localeCategory = 'GenAICoach';

const isApiResponseMsg = (message: ConversationMessage | GenAIMessageProps): message is ConversationMessage => {
  return 'content' in message && 'createdOn' in message && 'role' in message;
};

function isResponseWithID(response: unknown): response is { ID?: string } {
  return (
    typeof response === 'object' && response !== null && ('ID' in response ? typeof response.ID === 'string' || response.ID === undefined : true)
  );
}

function isResponseWithStringData(response: unknown): response is { data: string } {
  return typeof response === 'object' && response !== null && 'data' in response && typeof response.data === 'string';
}

const isStreamResponse = (sendMessageResponse: MessageResponse | StreamResponse): sendMessageResponse is StreamResponse => {
  const headers = (sendMessageResponse as StreamResponse)?.headers;
  return (
    typeof sendMessageResponse === 'object' &&
    sendMessageResponse !== null &&
    typeof headers === 'object' &&
    headers !== null &&
    typeof headers['content-type'] === 'string' &&
    // Deviation from Constellation: any text/event-stream content type, not only 'text/event-stream;charset=UTF-8'.
    headers['content-type'].toLowerCase().startsWith('text/event-stream')
  );
};

const groupByUpdatedOn = (input: HistoryResponse[], pConnect: typeof PConnect): ConversationHistoryProps['data'] => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const lastSevenDays = new Date();
  lastSevenDays.setDate(now.getDate() - 7);

  const lastMonth = new Date();
  lastMonth.setDate(now.getDate() - 30);

  const groupsMap: Map<string, HistoryResponse[]> = new Map();

  input.forEach(item => {
    const itemDate = new Date(item.updatedOn);
    const itemDateString = itemDate.toISOString().split('T')[0];

    let groupKey = '';

    if (itemDateString === today) {
      groupKey = pConnect.getLocalizationService().getLocalizedText('Today');
    } else if (itemDate >= lastSevenDays) {
      groupKey = pConnect.getLocalizationService().getLocalizedText('Previous 7 Days');
    } else if (itemDate >= lastMonth) {
      groupKey = pConnect.getLocalizationService().getLocalizedText('Previous 30 Days');
    } else {
      const currentYear = now.getFullYear();
      const itemYear = itemDate.getFullYear();

      if (itemYear === currentYear) {
        const monthName = itemDate.toLocaleString('default', { month: 'long' });
        groupKey = monthName;
      } else {
        groupKey = itemYear.toString();
      }
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }

    groupsMap.get(groupKey)?.push(item);
  });

  // Prepare final output array
  const result: ConversationHistoryProps['data'] = [];
  let sectionId = 1;

  for (const [section, items] of groupsMap.entries()) {
    result.push({
      section,
      id: sectionId.toString(),
      conversations: items.map(item => ({ id: item.id, title: item.title }))
    });

    sectionId += 1;
  }

  return result;
};

const getMappedValue = (value: string) => {
  return PCore.getEnvironmentInfo().getKeyMapping(value) ?? value;
};

const formatOptionLabel = (label: string): string => {
  try {
    const parsed: unknown = JSON.parse(label);
    if (Array.isArray(parsed)) {
      const values = parsed.flatMap(item => {
        if (typeof item !== 'object' || item === null) return [];
        return Object.values(item);
      });
      if (values.length > 0) return values.join(' \u2192 ');
    }
  } catch {
    // not JSON, return as-is
  }
  return label;
};

const stripNamespacePrefix = (value: string) => {
  if (PCore.isNamespaceEnabled() && value) {
    const namespaces: string[] = (PCore.getEnvironmentInfo()?.getFeatureMap() as any)?.namespaceList ?? [];
    const matchingNs = namespaces.find(ns => value.startsWith(`${ns}__`));

    if (matchingNs) {
      const nsPrefix = `${matchingNs}__`;
      return value.slice(nsPrefix.length);
    }
  }

  return value;
};

// Normalizes defaultInput (string | string[] | undefined → string[]), marks option.selected,
// and applies formatOptionLabel. Used for live-stream, history-load, and cache-restore paths,
// so defaults are (re)applied every time a questionnaire is restored, not just when first parsed.
const applyQuestionnaireDefaults = (data: QuestionnaireConfig): QuestionnaireConfig => {
  const normalizeDefaultInput = (value: string[] | string | undefined): string[] => {
    if (typeof value === 'string') return value ? [value] : [];
    return value ?? [];
  };

  return {
    ...data,
    questions: data.questions?.map(question => {
      const defaultInput = normalizeDefaultInput(question.defaultInput);
      return {
        ...question,
        optionItems: question.optionItems.map(option => {
          const displayLabel = formatOptionLabel(option.label);
          const normalizedOption = { ...option, selected: defaultInput.includes(option.key) };
          return displayLabel !== option.label ? { ...normalizedOption, displayLabel } : normalizedOption;
        })
      };
    })
  };
};

// Action approval is not supported: the confirmation text is shown read-only with a notice.
const buildApprovalNotice = (toolsNeedConfirmation: ToolResponse[] = []): string => {
  if (toolsNeedConfirmation.length === 0) return '';
  const confirmations = toolsNeedConfirmation.map(tool => tool.pyConfirmationMessage).filter(Boolean);
  const notice = PCore.getLocaleUtils().getLocaleValue('Action approval is not available in this application.', localeCategory);
  return [...confirmations, `_${notice}_`].join('\n\n');
};

const appendText = (text: string | undefined, addition: string): string => {
  if (!addition) return text ?? '';
  return text ? `${text}\n\n${addition}` : addition;
};

// A response that was still loading when the panel was closed was cancelled:
// seal it when the conversation is restored so the panel is usable and nothing is resent.
const sealInterruptedMessages = (cachedMessages: GenAIMessageProps[]): GenAIMessageProps[] =>
  cachedMessages
    .filter(msg => !(isCoachMessage(msg) && msg.loading && !msg.message))
    .map(msg => (isCoachMessage(msg) && msg.loading ? { ...msg, loading: false, allChunksReceived: true } : msg));

// This custom hook returns the data needed to render the Gen AI Coach widget.
const useGenAICoachObj = (
  coaches: undefined | GenAICoach[],
  caseID: string,
  pConnect: typeof PConnect,
  isCaseView: boolean = false,
  utilitiesExpanded: boolean = false,
  isLandingPage: boolean = false
) => {
  const pageSize = 20;
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const [initialSuggestedMessages, setInitialSuggestedMessages] = useState<MessageProps[]>([]);
  const [conversationID, setConversationID] = useState('');
  const [enableStreaming, setEnableStreaming] = useState(false);
  const [isAgentStreamActive, setIsAgentStreamActive] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [loading, setLoading] = useState<boolean | string>(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [suggestions, setSuggestions] = useState<MenuItems>([]);
  const [error, setError] = useState('');
  const [conversationError, setConversationError] = useState('');
  const [guidedMode, setGuidedMode] = useState(true);
  const [salutation, setSalutation] = useState<string | undefined>();
  const [showFeedback, setShowFeedback] = useState(true);
  const [draftMessage, setDraftMessage] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [selectedItemInHistory, setSelectedItemInHistory] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const pageIndexRef = useRef(1);
  const fullHistoryFetched = useRef(false);
  const [historyResp, setHistoryResp] = useState<HistoryResponse[]>([]);
  const questionnaireArrivedRef = useRef(false);

  const inFullPage = useRef(false);

  const cancelCreateConversationTokenSource = useRef<{ cancel?: () => void }[]>([]);
  // Deviation from Constellation: the agent configuration has its own cancel list, so loading it again (on maximize or
  // reopen) cannot cancel the conversation being created for the first message.
  const cancelGetConfigurationTokenSource = useRef<{ cancel?: () => void }[]>([]);
  const cancelGetConversationsTokenSource = useRef([]);
  const cancelGetMessagesTokenSource = useRef([]);
  const suggestionSelectRef = useRef<(message: string) => void>(() => {});
  const GUIDED = 'Guided';
  const AGENT = 'agent';
  const DELIMITER = '##';
  const ASSISTANT_MODE = 'assistantMode';

  // getNameSpaceUtils() is not in the 4.1 typings.
  const promptKey = useMemo(() => stripNamespacePrefix(getMappedValue((PCore as any).getNameSpaceUtils().getDefaultQualifiedName('pyPrompt'))), []);
  const instructionsKey = useMemo(
    () => stripNamespacePrefix(getMappedValue((PCore as any).getNameSpaceUtils().getDefaultQualifiedName('pyInstructions'))),
    []
  );

  // Setting the attachment object.
  const [attachments, setAttachments] = useState<FileItemProps[]>([]);
  const [attachmentsError, setAttachmentsError] = useState('');
  const uploadedFile = useRef<Record<string, File>>({});
  const l11nService = pConnect.getLocalizationService();
  const UPLOAD_COMPLETE = 100;

  // The 4.1 typings do not declare all of these engine methods or their config arguments.
  const {
    createConversation,
    sendMessage,
    createConversationForAgent,
    sendMessageForAgent,
    likeAgentMessage,
    unLikeAgentMessage,
    getConversations,
    getConversationsForAgent,
    getMessages,
    getMessagesForAgent,
    getCoach,
    getAgent
  } = PCore.getGenAIAssistantUtils() as any;
  const { isRequestCanceled, getCancelTokenSource } = PCore.getRestClient() as any;

  const streamCancelTokenRef = useRef<{ cancel: () => void } | null>(null);

  // Function to create the ID
  const createCoachId = (name: string, type: string) => `${name}${DELIMITER}${type}`;

  // Function to split the ID back into name and type
  const splitCoachId = (id: string) => {
    const [name, type] = id.split(DELIMITER);
    return { name, type };
  };

  // Each context type gets its own fixed Redux namespace to avoid collisions.
  // Widgets use the insName combination to support multiple widget configurations.
  let instanceId = coaches?.map(c => c.config.coach?.insName)?.join('_') || 'coaches';
  if (isCaseView) instanceId = 'caseview';
  else if (isLandingPage) instanceId = 'landingpage';

  const getInstanceValue = (subKey: string) => pConnect.getValue(`genAICoach.${instanceId}.${subKey}`);
  const updateInstanceState = (payload = {}) => pConnect.updateState({ genAICoach: { [instanceId]: payload } });

  const getSelectedCoach = (coachID = '') => {
    const coachesData = getInstanceValue('coaches');
    const currentCoachInfo = getInstanceValue('currentCoach');
    const selectedCoach = coachesData?.find((coach: CoachData) => coach.id === (coachID || currentCoachInfo?.assistantID));

    return {
      selectedCoach,
      coachesData,
      currentCoachInfo
    };
  };

  const { coachesData: availableCoaches, selectedCoach: availableSelectedCoach } = getSelectedCoach();
  const isCoachesDataEmpty = !availableCoaches || availableCoaches.length === 0;

  const initialMessages = isCoachesDataEmpty
    ? []
    : sealInterruptedMessages(availableSelectedCoach?.conversations?.[availableSelectedCoach?.latestConversationId]?.messages || []);
  const [messages, setMessages] = useState<GenAIMessageProps[]>(initialMessages);
  const messagesRef = useRef<GenAIMessageProps[]>(initialMessages);

  const markdownMap = useMemo(
    () =>
      createAgentMarkdownMap({
        getPConnect: () => pConnect,
        getConversationCases: () => messagesRef.current.flatMap(msg => (msg.from === 'system' && msg.caseInfo ? [msg.caseInfo] : []))
      }),
    [pConnect]
  );

  // Restore any pending questionnaire from Redux so it survives widget remounts (e.g. switching tabs/utilities).
  const initialPendingQuestionnaire = isCoachesDataEmpty
    ? undefined
    : availableSelectedCoach?.conversations?.[availableSelectedCoach?.latestConversationId]?.pendingQuestionnaire;
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireConfig | undefined>(
    initialPendingQuestionnaire?.questions?.length ? applyQuestionnaireDefaults(initialPendingQuestionnaire) : undefined
  );

  const normalizedMessages = useMemo(() => {
    const showFeedbackEnabled = showFeedback;

    const result: GenAIMessageProps[] = [];
    let seenInSegment = false;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];

      if (msg.from === 'user') {
        seenInSegment = false;
        result.push(msg);
      } else if (isCoachMessage(msg)) {
        const isTarget = !seenInSegment;
        seenInSegment = true;

        const shouldKeepFeedback = showFeedbackEnabled && isTarget;
        const normalized = !shouldKeepFeedback && msg.feedback ? { ...msg, feedback: undefined } : msg;
        result.push(normalized);
      } else {
        result.push(msg);
      }
    }

    return result.reverse();
  }, [messages, showFeedback]);

  // This method formats the coaches as needed for the component and also stores the coaches data in Redux.
  const buildCoachOptions = useCallback((coachesList: GenAICoach[] | undefined) => {
    const filterCoaches = (genAICoaches: GenAICoach[] | undefined) => {
      return genAICoaches?.filter(e => e.config.coach !== null && (!('visibility' in e.config) || e.config.visibility === true)) || [];
    };

    const currentCoaches: CoachData[] = Array.isArray(getInstanceValue('coaches')) ? getInstanceValue('coaches') : [];
    const selectedCoachId = getSelectedCoach().selectedCoach?.id;
    const mappedCoaches: MenuItems = [];
    const filteredCoaches = filterCoaches(coachesList);

    filteredCoaches.forEach((item: GenAICoach, index: number) => {
      const coachConfig = item.config.coach;
      if (coachConfig) {
        const coachId = createCoachId(coachConfig.insName, coachConfig.type);
        mappedCoaches.push({
          id: coachId,
          primary: coachConfig.label,
          selected: currentCoaches.length > 0 && selectedCoachId ? coachId === selectedCoachId : index === 0
        });
      }
    });

    // Seed only coaches that don't yet have a Redux record; never overwrite existing conversation data.
    const newCoachRecords = filteredCoaches.flatMap(item => {
      const coachConfig = item.config.coach;
      if (!coachConfig) return [];
      const id = createCoachId(coachConfig.insName, coachConfig.type);
      if (currentCoaches.some((c: CoachData) => c.id === id)) return [];
      return [{ id, type: coachConfig.type, latestConversationId: '', data: {}, conversations: {}, history: [] }];
    });

    if (newCoachRecords.length > 0) {
      updateInstanceState({ coaches: [...currentCoaches, ...newCoachRecords] });
    }

    return mappedCoaches;
  }, []);

  const [coachOptions, setCoachOptions] = useState<MenuItems>(() => buildCoachOptions(coaches));
  const [activeCoach, setActiveCoach] = useState<MenuItemProps | MenuGroupProps>(() => {
    return coachOptions.find(item => !isMenuGroupProps(item) && item.selected) || coachOptions[0];
  });

  useEffect(() => {
    const newOptions = buildCoachOptions(coaches);
    if (newOptions.length === 0) return;
    // `coaches` may be a new array reference every render even when its content is unchanged;
    // only update state when the resolved options actually differ to avoid a render loop.
    if (isEqual(newOptions, coachOptions)) return;

    setCoachOptions(newOptions);
    setActiveCoach(newOptions.find(item => !isMenuGroupProps(item) && item.selected) || newOptions[0]);
  }, [coaches]);

  const { handleAgentStreamEvent, resetStreamState, finalizeAgentStream, cancelAgentStream } = useAgentStreamHandler(
    setMessages,
    () => activeCoach,
    markdownMap
  );

  const fetchNewHistory = useRef<Record<string, boolean>>(
    coachOptions.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {})
  );

  useEffect(() => {
    messagesRef.current = messages;
    if (!conversationID) return;

    const { coachesData } = getSelectedCoach(activeCoach?.id);
    updateInstanceState({
      coaches:
        coachesData?.map((e: CoachData) => {
          if (e.id === activeCoach?.id) {
            return {
              ...e,
              conversations: {
                ...e.conversations,
                [conversationID]: {
                  ...e.conversations[conversationID],
                  messages,
                  // Written together with `messages` in this single effect (rather than from a separate
                  // updateInstanceState call elsewhere) so the two never race and clobber each other.
                  pendingQuestionnaire: questionnaireData?.questions?.length ? questionnaireData : { questions: [] }
                }
              }
            };
          }
          return e;
        }) || []
    });
  }, [messages, questionnaireData, conversationID, activeCoach?.id]);

  useEffect(() => {
    // Hosts without agents make no engine-store writes, so they behave as before.
    if (!coaches) return;
    const { selectedCoach } = getSelectedCoach(activeCoach?.id);
    updateInstanceState({
      currentCoach: {
        assistantID: selectedCoach?.id,
        conversationID: selectedCoach?.latestConversationId,
        isAgent: selectedCoach?.type === AGENT
      }
    });
  }, [activeCoach]);

  const groupedHistory = useMemo(() => groupByUpdatedOn(historyResp, pConnect), [historyResp]);

  useEffect(() => {
    if (!coaches) return;
    const {
      currentCoachInfo: { assistantID },
      coachesData
    } = getSelectedCoach();

    if (assistantID) {
      updateInstanceState({
        coaches: coachesData.map((e: CoachData) => {
          if (e.id === assistantID) {
            return {
              ...e,
              history: groupedHistory
            };
          }
          return e;
        })
      });
    }
  }, [groupedHistory]);

  useEffect(() => {
    if (attachments.some(att => att.error)) {
      setAttachmentsError(l11nService.getLocalizedText(attachments[0]?.error ?? ''));
    } else if (attachments.length > 0 && attachments.every(att => att.progress === UPLOAD_COMPLETE)) {
      setAttachmentsError('');
    }
  }, [attachments]);

  // Leaving a conversation cancels its stream, so unlike in Constellation no late response
  // clears its cached loading answer: the cached copy is sealed instead, so the conversation is usable when reopened.
  const leaveConversation = () => {
    streamCancelTokenRef.current?.cancel();
    streamCancelTokenRef.current = null;
    // Deviation from Constellation: a conversation still being created and a configuration still loading are cancelled
    // too, so they cannot apply to the view the user moved to.
    [...cancelCreateConversationTokenSource.current, ...cancelGetConfigurationTokenSource.current].forEach(token => token?.cancel?.());
    setLoading(false);

    const { coachesData, currentCoachInfo } = getSelectedCoach();
    const assistantID = currentCoachInfo?.assistantID;
    const leftConversationID = currentCoachInfo?.conversationID;
    const leftMessages = messagesRef.current;
    if (!assistantID || !leftConversationID || !Array.isArray(coachesData)) return;
    if (!leftMessages.some(msg => isCoachMessage(msg) && msg.loading)) return;

    updateInstanceState({
      coaches: coachesData.map((e: CoachData) =>
        e.id === assistantID && e.conversations?.[leftConversationID]
          ? {
              ...e,
              conversations: {
                ...e.conversations,
                [leftConversationID]: { ...e.conversations[leftConversationID], messages: sealInterruptedMessages(leftMessages) }
              }
            }
          : e
      )
    });
  };

  // Leaving the host leaves the conversation; late responses are ignored.
  useEffect(() => {
    return () => {
      leaveConversation();
    };
  }, []);

  if (!coaches) return;

  // Returns an object containing the error message.
  const getConfigurationIncompleteResult = () => ({
    loading: false,
    messages: [],
    coachOptions: [],
    onCoachChange: () => {},
    onSend: () => {},
    onOpen: () => {},
    initialSuggestedMessages: [],
    suggestions: undefined,
    error: l11nService.getLocalizedText('Agent configuration is incomplete. Kindly associate the required Agent rules.'),
    onStateChange: isCaseView ? () => {} : undefined,
    guidedMode: true
  });

  if (coaches.length === 0) {
    return getConfigurationIncompleteResult();
  }

  if (coaches.some(e => e.config.coach !== null && (!('visibility' in e.config) || e.config.visibility === true))) {
    if (coachOptions.length === 0) return;

    // This method clears the error messages from the top of the page.
    const clearErrorMessages = () => {
      PCore.getMessageManager().clearMessages({
        type: 'error',
        category: 'HTTP',
        context: pConnect.getContextName()
      } as any);
    };

    // This method resets all global states to their default values.
    const resetGlobalStates = () => {
      setMessages([]);
      setInitialSuggestedMessages([]);
      setPrompts([]);
      setSuggestions([]);
      setConversationID('');
      setError('');
      setConversationError('');
      setDraftMessage('');
      setIsCreatingConversation(false);
      setSalutation(undefined);
      setShowFeedback(true);
      setQuestionnaireData(undefined);
      questionnaireArrivedRef.current = false;
      resetStreamState();
    };

    // This method formats the suggestions as needed for the component.
    const buildSuggestions = (suggestionsList: Prompt[], coach: MenuItemProps | MenuGroupProps = activeCoach, mode?: 'Dynamic' | 'Static') => {
      if (mode === 'Dynamic') {
        // The suggestion cards of the Dynamic mode are not ported; the prompts are offered through the suggestions menu.
        const dynamicList = suggestionsList.filter((item): item is Prompt & DynamicSuggestedPrompt => 'category' in item);
        setPrompts(suggestionsList);

        setSuggestions([
          {
            id: coach.id,
            label: !isMenuGroupProps(coach) ? coach.primary : '',
            items: dynamicList.map(dynamic => ({
              id: createUID(),
              primary: dynamic.title,
              onClick: () => {
                suggestionSelectRef.current(dynamic[promptKey] as string);
              }
            }))
          }
        ]);
        return;
      }

      setSuggestions([
        {
          id: coach.id,
          label: !isMenuGroupProps(coach) ? coach.primary : '',
          items: suggestionsList.map((item: Prompt) => {
            return {
              id: createUID(),
              primary: item[promptKey] as string
            };
          })
        }
      ]);
      setPrompts(suggestionsList);
      // Sets the initial suggested messages to be displayed as quick-select questions.
      setInitialSuggestedMessages(
        suggestionsList.slice(0, 4).map((item: Prompt) => {
          return {
            id: createUID(),
            message: item[promptKey] as string
          };
        })
      );
    };

    // Helper function to update active coach details.
    const updateCurrentCoachDetails = (assistantID: string, chatID: string, type: string) => {
      updateInstanceState({
        currentCoach: {
          assistantID,
          conversationID: chatID,
          isAgent: type === AGENT
        }
      });
    };

    // This method handles the error response and stops the loader.
    const handleErrorResponse = (err: ErrorResponse, inHistoryView?: boolean) => {
      clearErrorMessages();
      if (!isRequestCanceled(err) && err?.response?.data?.errorDetails?.length > 0) {
        const errorMessage = err.response.data.errorDetails[0].localizedValue;
        if (inHistoryView) setHistoryError(errorMessage);
        else setError(errorMessage);
      }
      if (!isRequestCanceled(err)) {
        if (inHistoryView) setHistoryLoading(false);
        else setLoading(false);
      }
    };

    // Deviation from Constellation: a failure without error details, such as a network error, still shows a message.
    const handleLoadError = (err: unknown, inHistoryView?: boolean) => {
      handleErrorResponse(isRequestCanceled(err) ? (err as ErrorResponse) : normalizeErrorResponse(err, l11nService), inHistoryView);
    };

    // Downloads the file using the attachment utils and file download utility.
    const downloadFile = (ID: string, name: string): void => {
      const attachmentUtils = PCore.getAttachmentUtils();
      const contextName = pConnect.getContextName();

      attachmentUtils
        .downloadAttachment(ID, contextName, '')
        .then((content: unknown) => {
          if (isResponseWithStringData(content)) {
            fileDownload(content.data, name, null, (content as { headers?: Record<string, string> }).headers ?? {});
          }
        })
        .catch(err => {
          handleErrorResponse(err);
        });
    };

    // update latest conversation id for a coach, for switching between coaches to go to last coach
    const updateLatestConversationIdForCoach = (assistantID: string, chatID: string, coachesData: CoachData[]) => {
      updateInstanceState({
        coaches: coachesData.map((e: CoachData) => {
          if (e.id === assistantID) {
            return {
              ...e,
              latestConversationId: chatID
            };
          }
          return e;
        })
      });
    };

    const handleHistoryData = (response: { data: { conversations: HistoryResponse[] } }, loadMore: boolean) => {
      const items = (response.data?.conversations ?? []).map(item => {
        return {
          ...item,
          title: item.name
        };
      });
      if (items.length === 0 || items.length < pageSize) {
        fullHistoryFetched.current = true;
      }

      if (loadMore) {
        setHistoryResp((prev: HistoryResponse[]) => [...prev, ...items]);
      } else {
        setHistoryResp(items);
      }

      setHistoryLoading(false);
    };

    const updateHistoryData = (loadMore?: boolean) => {
      const {
        selectedCoach,
        currentCoachInfo: { assistantID }
      } = getSelectedCoach();

      if (!loadMore && fetchNewHistory.current[assistantID]) {
        fullHistoryFetched.current = false;
        pageIndexRef.current = 1;
      }

      // Deviation from Constellation: gate on the history held in state, which is what the panel shows.
      if (!fullHistoryFetched.current && (historyResp.length === 0 || loadMore || fetchNewHistory.current[assistantID])) {
        fetchNewHistory.current[assistantID] = false;
        setHistoryLoading(true);
        const assistantIDSendInAPI = splitCoachId(assistantID).name;

        if (selectedCoach.type !== AGENT) {
          getConversations(
            assistantIDSendInAPI,
            caseID,
            pageSize,
            pageIndexRef.current,
            pConnect.getContextName(),
            cancelGetConversationsTokenSource.current
          )
            .then(response => {
              handleHistoryData(response, loadMore ?? false);
            })
            .catch(err => {
              handleLoadError(err, true);
            });
        } else {
          getConversationsForAgent(
            assistantIDSendInAPI,
            caseID,
            pageSize,
            pageIndexRef.current,
            pConnect.getContextName(),
            cancelGetConversationsTokenSource.current
          )
            .then(response => {
              handleHistoryData(response, loadMore ?? false);
            })
            .catch(err => {
              handleLoadError(err, true);
            });
        }
      }
    };

    // Helper function to update messages with feedback
    const updateMessageFeedback = (id: MessageProps['id'], reaction: Reaction | undefined) => {
      clearErrorMessages();
      setMessages(prevData => {
        return prevData.map((message: GenAIMessageProps) => {
          if (isCoachMessage(message) && message.id === id && showFeedback) {
            return {
              ...message,
              feedback: {
                reaction,
                onReaction: handleReaction,
                onFeedbackComplete: handleFeedback
              }
            };
          }
          return message;
        });
      });
    };

    // This method records a like for a specific coach message.
    const handleReaction = (id: MessageProps['id'], reaction: Reaction | undefined) => {
      const {
        currentCoachInfo: { assistantID, conversationID: currentConversationID }
      } = getSelectedCoach();
      fetchNewHistory.current[assistantID] = true;

      if (reaction === 'liked') {
        const assistantIDSendInAPI = splitCoachId(assistantID).name;
        likeAgentMessage(assistantIDSendInAPI, currentConversationID ?? conversationID, id, pConnect.getContextName())
          .then(() => updateMessageFeedback(id, reaction))
          .catch(() => updateMessageFeedback(id, undefined));
      } else {
        updateMessageFeedback(id, reaction);
      }
    };

    // This method records feedback for an unlike scenario related to a specific coach message.
    const handleFeedback = (id: MessageProps['id'], comment = '') => {
      const {
        currentCoachInfo: { assistantID, conversationID: currentConversationID }
      } = getSelectedCoach();
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      unLikeAgentMessage(assistantIDSendInAPI, currentConversationID ?? conversationID, id, pConnect.getContextName(), comment).catch(() =>
        updateMessageFeedback(id, undefined)
      );
    };

    // This method builds the coach suggestions.
    const buildCoachSuggestions = (coachSuggestions: string[]) => {
      return coachSuggestions.map((suggestion: string) => {
        return {
          id: createUID(),
          message: suggestion
        };
      });
    };

    // This method builds the messages and updates the state.
    const updateMessages = (
      message: string | undefined,
      isUser: boolean,
      isLoading: boolean,
      coachSuggestions: string[] = [],
      coach: MenuItemProps | MenuGroupProps = activeCoach,
      messageID: string = '',
      attachmentIds?: string[],
      isCustom?: boolean
    ) => {
      const {
        currentCoachInfo: { isAgent }
      } = getSelectedCoach();

      const files: FileDisplayProps[] = [];
      attachmentIds?.forEach((id: string) => {
        const attachment = attachments.find(item => item.id === id);
        if (attachment) {
          files.push({
            id,
            // The Cosmos lightbox is not ported: a sent attachment is downloaded.
            onPreview: attachment.ID ? () => downloadFile(attachment.ID as string, attachment.name) : undefined,
            displayText: attachment.name,
            value: attachment.name,
            format: attachment.format
          });
        }
      });
      if (isUser && (message || files.length > 0)) {
        const messageObject: UserMessageProps = {
          id: createUID(),
          from: 'user',
          message,
          attachments: files
        };

        setMessages((res: GenAIMessageProps[]) => [...res, messageObject]);
      } else if (!isMenuGroupProps(coach)) {
        if (isLoading) {
          questionnaireArrivedRef.current = false;
        }
        const messageObject: CoachMessageProps = {
          id: isAgent && !isCustom ? messageID : createUID(),
          from: 'coach',
          message,
          ...(isCustom ? { isCustom: true } : {}),
          loading: isLoading,
          coachName: coach.primary ?? '',
          markdownMap
        };
        if (isAgent) {
          messageObject.suggestions = buildCoachSuggestions(coachSuggestions);

          if (showFeedback) {
            messageObject.feedback = {
              reaction: undefined,
              onReaction: handleReaction,
              onFeedbackComplete: handleFeedback
            };
          }
        }
        setMessages((res: GenAIMessageProps[]) => [...res, messageObject]);
      }
    };

    // Updates the state with the response from the conversation API / redux.
    const updateCoachDetails = (result: CoachData, displayConversationId?: string) => {
      const convId = displayConversationId ?? result.latestConversationId;
      setConversationID(convId);
      const selectedCoach = coachOptions.find((e: MenuItemProps | MenuGroupProps) => e.id === result.id);
      // Checks if guided mode is active, based on the presence of 'assistantMode' in the response.
      setGuidedMode(result.data[ASSISTANT_MODE] === GUIDED);
      setEnableStreaming(!!result.data.supportedCapabilities?.stream?.isEnabled);
      setSalutation(result.data.welcomeMessage || undefined);
      setShowFeedback(!result.data.turnOffFeedback);

      const mode = result.data.suggestionsMode;
      const suggestedPrompts = result.data?.suggestedPrompts ?? [];
      if (suggestedPrompts.length > 0) buildSuggestions(suggestedPrompts, selectedCoach, mode);
      // Checks if there are messages and updates the messages for new coach.
      const latestConversation = result.conversations?.[convId];
      const reduxData = latestConversation?.messages || [];
      if (reduxData.length === 0) {
        setMessages([]);
      } else {
        // Updates the messages for an existing coach.
        setMessages(reduxData);
      }
      // Restore any pending questionnaire for this conversation.
      const pendingQuestionnaire = latestConversation?.pendingQuestionnaire;
      setQuestionnaireData(pendingQuestionnaire?.questions?.length ? applyQuestionnaireDefaults(pendingQuestionnaire) : undefined);
    };

    const handleFetchMessagesForConversation = (
      assistantID: string,
      conversationId: string,
      coachesData: CoachData[],
      selectedCoach: CoachData,
      currentConversationID: string,
      data: (ConversationMessage | GenAIMessageProps)[],
      fromAPI?: boolean
    ) => {
      setLoading(false);
      if (currentConversationID === conversationId) return;

      updateLatestConversationIdForCoach(assistantID, conversationId, coachesData);
      setConversationID(conversationId);
      updateCurrentCoachDetails(assistantID, conversationId, selectedCoach.type);

      if (data.length === 0) {
        let updatedCoachesData = getSelectedCoach().coachesData;
        if (fromAPI) {
          updatedCoachesData = coachesData.map((e: CoachData) => {
            if (e.id === assistantID) {
              return {
                ...e,
                conversations: {
                  ...e.conversations,
                  [conversationId]: {
                    messages: []
                  }
                }
              };
            }
            return e;
          });

          updateInstanceState({
            coaches: updatedCoachesData
          });
        }

        const updatedSelectedCoach = updatedCoachesData?.find((e: CoachData) => e.id === assistantID);
        if (updatedSelectedCoach) {
          updateCoachDetails(updatedSelectedCoach, conversationId);
        }
      } else {
        const allUpdatedMessages = data.map(item => {
          let messageObject: GenAIMessageProps;
          const {
            currentCoachInfo: { isAgent }
          } = getSelectedCoach();

          if (isApiResponseMsg(item)) {
            if (item.role === 'SYSTEM') {
              let caseInfo: { id: string; type: string; label: string } | undefined;
              let skipMessage = false;

              if (item.event && typeof item.event === 'string') {
                try {
                  const { displayMetadata, toolType } = JSON.parse(item.event);

                  if (toolType === 'CREATE_CASE' || toolType === 'OPEN_CASE') {
                    // If casetype.ID is null/falsy, the case was not found — skip the separator.
                    if (!displayMetadata?.casetype?.ID) {
                      skipMessage = true;
                    } else if (displayMetadata?.case?.ID) {
                      caseInfo = {
                        id: displayMetadata.case.ID,
                        type: displayMetadata.casetype.ID,
                        label: displayMetadata.case.label || displayMetadata.casetype.label || ''
                      };
                    }
                  }
                } catch {
                  // ignore parse errors
                }
              }

              // Skip separators for invalid case lookups — the server persists
              // the bad text (e.g. "Case null Opened"), so filter it on replay.
              if (skipMessage) {
                return null;
              }

              // UI_INSIGHT messages contain charts/tables query that need the full
              // coach rendering (RichTextViewer + markdownMap).
              if (item.toolType === 'UI_INSIGHT') {
                messageObject = {
                  id: item.messageID || createUID(),
                  from: 'coach',
                  message: item.content,
                  coachName: !isMenuGroupProps(activeCoach) ? activeCoach.primary : '',
                  enableStreaming: false,
                  markdownMap
                };
              } else {
                messageObject = {
                  id: item.messageID || createUID(),
                  from: 'system',
                  message: item.content,
                  ...(caseInfo ? { caseInfo } : {})
                };
              }
            } else if (item.role === 'USER') {
              const attachmentsWithFormat = (item.attachments as (FileDisplayProps & AttachmentMeta)[])?.map(att => ({
                ...att,
                format: att.extension
              }));

              let userMessageContent: string | undefined = item.content;
              if (item.type === 'ANSWER') {
                const parsed = JSON.parse(item.content);
                if (Array.isArray(parsed)) {
                  userMessageContent = parsed
                    .map(obj => (typeof obj === 'object' && obj !== null && 'pyLabel' in obj ? String(obj.pyLabel ?? '') : ''))
                    .filter(Boolean)
                    .join(', ');
                }
              }

              messageObject = {
                id: createUID(),
                from: 'user',
                message: userMessageContent,
                attachments: attachmentsWithFormat?.map(attachment => ({
                  id: attachment.id,
                  name: attachment.fileName,
                  // The Cosmos lightbox is not ported: the attachment is downloaded.
                  onPreview: () => {
                    downloadFile(attachment.ID || attachment.id, attachment.fileName);
                  },
                  displayText: attachment.fileName,
                  value: attachment.fileName,
                  format: attachment.extension
                }))
              };
            } else {
              const updateReaction = () => {
                if (item.isLiked === null) return;
                return item.isLiked ? 'liked' : 'disliked';
              };

              messageObject = {
                id: item.messageID,
                from: 'coach',
                message: appendText(item.content, buildApprovalNotice(item.toolsNeedConfirmation)),
                coachName: !isMenuGroupProps(activeCoach) ? activeCoach.primary : '',
                enableStreaming: false,
                markdownMap
              };
              if (isAgent) {
                messageObject.suggestions = buildCoachSuggestions(
                  (item.aiGuidedQuestions ?? []).map((question: Prompt) => question[promptKey] as string)
                );

                if (showFeedback) {
                  messageObject.feedback = {
                    reaction: updateReaction(),
                    onReaction: handleReaction,
                    onFeedbackComplete: handleFeedback
                  };
                }
              }
            }
          } else {
            messageObject = item;
            if (item.from === 'coach') {
              messageObject = {
                ...item,
                enableStreaming: false
              };

              if (isAgent && showFeedback) {
                messageObject.feedback = {
                  reaction: item.feedback?.reaction,
                  onReaction: handleReaction,
                  onFeedbackComplete: handleFeedback
                };
              }
            }
          }

          return messageObject;
        });
        const updatedMessages = allUpdatedMessages.filter((msg): msg is GenAIMessageProps => msg !== null);

        setMessages(updatedMessages || []);

        if (fromAPI) {
          const lastApiMessage = data[data.length - 1];
          const raw = isApiResponseMsg(lastApiMessage) ? parseQuestionnaireFromHistory(lastApiMessage.questionnaire) : undefined;
          // Persistence to Redux happens in the messages-sync effect (keyed off `questionnaireData`),
          // so it's written atomically together with `messages` instead of via a separate, racy write here.
          setQuestionnaireData(raw ? applyQuestionnaireDefaults(raw) : undefined);
        }

        const updatedCoachesData = getSelectedCoach().coachesData;
        const updatedSelectedCoach = updatedCoachesData?.find(({ id }: CoachData) => id === assistantID);

        if (updatedSelectedCoach) {
          setGuidedMode(updatedSelectedCoach.data[ASSISTANT_MODE] === GUIDED);
        }
      }
    };

    const fetchMessagesForConversation = (conversationId: string) => {
      const {
        coachesData,
        currentCoachInfo: { conversationID: currentConversationID, assistantID },
        selectedCoach
      } = getSelectedCoach();

      if (conversationId === currentConversationID) {
        setSelectedItemInHistory(conversationId);
        setLoading(false);
        return;
      }
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      setAttachments([]);
      setError('');
      setSelectedItemInHistory(conversationId);
      setLoading(true);
      setMessages([]);

      if (selectedCoach && Object.keys(selectedCoach.conversations).length > 0 && selectedCoach.conversations?.[conversationId]) {
        const cachedConversation = selectedCoach.conversations[conversationId];
        setQuestionnaireData(
          cachedConversation.pendingQuestionnaire?.questions?.length ? applyQuestionnaireDefaults(cachedConversation.pendingQuestionnaire) : undefined
        );
        const reduxData = cachedConversation.messages;

        handleFetchMessagesForConversation(assistantID, conversationId, coachesData, selectedCoach, currentConversationID, reduxData || []);
      } else {
        setQuestionnaireData(undefined);

        if (selectedCoach.type !== AGENT) {
          getMessages(assistantIDSendInAPI, conversationId, pConnect.getContextName(), cancelGetMessagesTokenSource.current)
            .then((response: GetMessagesResponse) => {
              handleFetchMessagesForConversation(
                assistantID,
                conversationId,
                coachesData,
                selectedCoach,
                currentConversationID,
                response.data?.messages || [],
                true
              );
            })
            .catch(err => handleLoadError(err));
        } else {
          getMessagesForAgent(assistantIDSendInAPI, conversationId, pConnect.getContextName(), cancelGetMessagesTokenSource.current)
            .then((response: GetMessagesResponse) => {
              handleFetchMessagesForConversation(
                assistantID,
                conversationId,
                coachesData,
                selectedCoach,
                currentConversationID,
                response.data?.messages || [],
                true
              );
            })
            .catch(err => handleLoadError(err));
        }
      }
    };

    const handleStreamingProgress = (isStreamingDone: boolean) => {
      if (isStreamingDone) {
        setMessages(currentMessages =>
          currentMessages.map(message => {
            // Seal whichever coach message has received all chunks and is still loading.
            // Matching by identity (allChunksReceived + loading)
            if (isCoachMessage(message) && message.loading && message.allChunksReceived) {
              return { ...message, loading: false };
            }
            return message;
          })
        );
      }
    };

    const handleQuestionnaireEvent = (data: QuestionnaireConfig) => {
      const transformed = applyQuestionnaireDefaults(data);

      const firstQuestion = transformed.questions?.[0];
      const isInlineEligible =
        transformed.questions?.length === 1 && firstQuestion?.type === 'single' && (firstQuestion?.optionItems?.length ?? 0) <= 3;

      if (isInlineEligible && firstQuestion) {
        setMessages(prev => [
          ...prev.map((message, index) => (index === prev.length - 1 ? ({ ...message, loading: false } as GenAIMessageProps) : message)),
          {
            id: createUID(),
            from: 'coach',
            message: firstQuestion.questionText,
            loading: false,
            coachName: !isMenuGroupProps(activeCoach) ? (activeCoach.primary ?? '') : '',
            markdownMap,
            suggestions: firstQuestion.optionItems.map(option => ({
              id: option.key,
              message: option.displayLabel ?? option.label,
              selected: option.selected
            }))
          }
        ]);
        setQuestionnaireData({ ...transformed, inline: true });
      } else {
        setQuestionnaireData(transformed);
      }

      questionnaireArrivedRef.current = true;

      // Persist the pending questionnaire to Redux so it survives conversation switches.
      const {
        currentCoachInfo: { assistantID, conversationID: activeConversationID },
        coachesData
      } = getSelectedCoach();
      if (assistantID && activeConversationID) {
        updateInstanceState({
          coaches: coachesData.map((coach: CoachData) => {
            if (coach.id === assistantID) {
              return {
                ...coach,
                conversations: {
                  ...coach.conversations,
                  [activeConversationID]: {
                    ...coach.conversations[activeConversationID],
                    pendingQuestionnaire: isInlineEligible ? { ...transformed, inline: true } : transformed
                  }
                }
              };
            }
            return coach;
          })
        });
      }
    };

    // This method updates the state with the response from the send message API.
    const updateMessagesWithResponse = (
      result: MessageResponse,
      reqAssistantID: string,
      reqConversationID: string,
      streaming?: boolean,
      enableStream: boolean = enableStreaming,
      inProgressMessage?: boolean
    ) => {
      const {
        currentCoachInfo: { assistantID },
        coachesData,
        selectedCoach
      } = getSelectedCoach();
      fetchNewHistory.current[assistantID] = true;
      const latestConversationID = selectedCoach.latestConversationId;

      if (assistantID !== reqAssistantID || latestConversationID !== reqConversationID) {
        updateInstanceState({
          coaches: coachesData.map((e: CoachData) => {
            if (e.id === reqAssistantID) {
              return {
                ...e,
                conversations: {
                  ...e.conversations,
                  [reqConversationID]: null
                }
              };
            }
            return e;
          })
        });
      } else {
        const { data } = result;
        setMessages((prevData: GenAIMessageProps[]) => {
          return prevData.map((message: GenAIMessageProps) => {
            if (isCoachMessage(message) && message.loading === true) {
              if (typeof data !== 'string') {
                const { messageID, response, aiGuidedQuestions = [], toolsNeedConfirmation = [] } = data;
                const approvalNotice = buildApprovalNotice(toolsNeedConfirmation);
                const responseText = streaming ? `${message.message || ''}${response}` : message.message || response;

                return {
                  ...message,
                  id: messageID,
                  message: appendText(responseText, approvalNotice),
                  suggestions: questionnaireArrivedRef.current
                    ? undefined
                    : message.suggestions && message.suggestions.length > 0
                      ? message.suggestions
                      : buildCoachSuggestions(aiGuidedQuestions.map((question: Prompt) => question[promptKey] as string)),
                  loading: enableStream,
                  ...(showFeedback
                    ? {
                        feedback: {
                          reaction: undefined,
                          onReaction: handleReaction,
                          onFeedbackComplete: handleFeedback
                        }
                      }
                    : {}),
                  onStreamingUpdate: isStreamingDone => handleStreamingProgress(isStreamingDone),
                  allChunksReceived: !streaming,
                  enableStreaming: enableStream
                };
              }
              if (typeof data === 'string') {
                return {
                  ...message,
                  message: streaming ? `${message.message || ''}${data}` : data || message.message,
                  loading: inProgressMessage || enableStream,
                  onStreamingUpdate: isStreamingDone => handleStreamingProgress(isStreamingDone),
                  allChunksReceived: !streaming,
                  enableStreaming: enableStream
                };
              }
            }
            return message;
          });
        });
      }
    };

    // This method updates the message with error response and stops the loader.
    const updateMessagesWithError = (err: ErrorResponse) => {
      clearErrorMessages();
      if (err?.response?.data?.errorDetails) {
        const errorMessage = err.response.data.errorDetails[0].localizedValue;
        setMessages((prevData: GenAIMessageProps[]) => {
          return prevData.map((message: GenAIMessageProps) => {
            if (isCoachMessage(message) && message.loading === true) {
              return { ...message, error: errorMessage, loading: false };
            }
            return message;
          });
        });
      }
    };

    const addUserOrToolMessage = ({ message, attachmentIds }: { message: string; attachmentIds?: string[] }) => {
      // Append the attachment to coach conversation
      updateMessages(message, true, false, [], activeCoach, '', attachmentIds ?? []);
      // Generates an empty message with a loading icon until the coach's response is received.
      updateMessages(undefined, false, true);
      // Clears the initial suggested messages to hide the quick-select questions.
      setInitialSuggestedMessages([]);
    };

    const clearPendingQuestionnaire = () => {
      const {
        currentCoachInfo: { assistantID, conversationID: activeConversationID },
        coachesData
      } = getSelectedCoach();
      if (assistantID && activeConversationID) {
        updateInstanceState({
          coaches: coachesData.map((coach: CoachData) => {
            if (coach.id === assistantID) {
              const currentConversation = coach.conversations[activeConversationID];
              if (!currentConversation) return coach;
              return {
                ...coach,
                conversations: {
                  ...coach.conversations,
                  [activeConversationID]: {
                    messages: currentConversation.messages,
                    pendingQuestionnaire: { questions: [] }
                  }
                }
              };
            }
            return coach;
          })
        });
      }
    };

    const callSendMessage = async ({
      assistantID,
      currentConversationID,
      message,
      coachType,
      enableStream,
      formattedAttachments,
      additionalInstruction,
      questionnaire
    }: {
      assistantID: string;
      currentConversationID: string;
      message: string;
      coachType: string;
      enableStream: boolean;
      formattedAttachments?: { type: string; category: string; fileName: string; ID: string }[];
      additionalInstruction?: string;
      questionnaire?: QuestionnaireEvent;
    }) => {
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      const cancelToken = enableStream ? getCancelTokenSource() : null;
      streamCancelTokenRef.current = cancelToken;
      setIsCreatingConversation(false);

      if (coachType !== AGENT) {
        try {
          let result: MessageResponse | StreamResponse = await sendMessage(
            assistantIDSendInAPI,
            currentConversationID,
            message,
            pConnect.getContextName(),
            {
              enableStreaming: enableStream,
              additionalInstruction
            }
          );

          if (isStreamResponse(result)) {
            const streamFinalResponse = await handleMessageStream(
              result,
              ({ data, streaming }) => updateMessagesWithResponse({ data }, assistantID, currentConversationID, streaming, enableStream),
              undefined,
              undefined,
              handleQuestionnaireEvent
            );
            if (streamFinalResponse && typeof streamFinalResponse.data === 'string') {
              streamFinalResponse.data = '';
              result = streamFinalResponse;
            }
          }
          updateMessagesWithResponse(result as MessageResponse, assistantID, currentConversationID, false, enableStream);
        } catch (e) {
          if (!(e instanceof Error && isRequestCanceled(e))) {
            updateMessagesWithError(normalizeErrorResponse(e, l11nService));
          }
        }
      } else {
        const isAgentSseStream = cancelToken !== null;
        if (isAgentSseStream) {
          setIsAgentStreamActive(true);
        }
        try {
          // `isManualConfirmationSupported` is not advertised: action approval is not supported.
          let result: MessageResponse | StreamResponse = await sendMessageForAgent(
            assistantIDSendInAPI,
            currentConversationID,
            message,
            pConnect.getContextName(),
            formattedAttachments,
            {
              enableStreaming: enableStream,
              additionalInstruction,
              ...(cancelToken && { cancelTokenSource: cancelToken }),
              ...(questionnaire && { questionnaire })
            }
          );

          if (enableStream && isStreamResponse(result)) {
            const streamFinalResponse = await handleMessageStream(result, undefined, undefined, handleAgentStreamEvent, handleQuestionnaireEvent);
            if (streamFinalResponse && typeof streamFinalResponse.data !== 'string') {
              streamFinalResponse.data.response = '';
              result = streamFinalResponse;
            } else if (!streamFinalResponse) {
              // A stream that ends with a `metadata` frame has no final response: keep the streamed answer and its ID.
              result = { data: '' };
            }

            const needsToolConfirmation =
              typeof (result as MessageResponse).data !== 'string' && ((result as any).data?.toolsNeedConfirmation ?? []).length > 0;
            finalizeAgentStream(needsToolConfirmation);
          }
          updateMessagesWithResponse(result as MessageResponse, assistantID, currentConversationID, false, enableStream);
          // Remove any remaining orphan loaders.
          setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && !!msg.loading && !msg.message)));
        } catch (e) {
          streamCancelTokenRef.current = null;

          if (!(e instanceof Error && isRequestCanceled(e))) {
            updateMessagesWithError(normalizeErrorResponse(e, l11nService));
          }

          finalizeAgentStream();
        } finally {
          if (isAgentSseStream) {
            setIsAgentStreamActive(false);
          }
        }
      }
    };

    // Creates a conversation and then sends a message. Used when conversation creation is deferred.
    const createConversationThenSend = async (
      assistantID: string,
      coachType: string,
      message: string,
      formattedAttachments?: { type: string; category: string; fileName: string; ID: string }[],
      additionalInstruction?: string,
      questionnaire?: QuestionnaireEvent,
      userMessageData?: { attachmentIds?: string[] }
    ) => {
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      const createFn = coachType !== AGENT ? createConversation : createConversationForAgent;
      const messagesBeforeSend = messagesRef.current;
      const initialSuggestionsBeforeSend = initialSuggestedMessages;
      let conversationCreated = false;

      if (coachType === AGENT) {
        setConversationError('');
      }

      if (coachType === AGENT) {
        setIsCreatingConversation(true);
      }

      // Deviation from Constellation: the message is shown while its conversation is created, not after.
      if (userMessageData !== undefined) {
        addUserOrToolMessage({ message, attachmentIds: userMessageData.attachmentIds });
      }

      try {
        // `isManualConfirmationSupported` is not advertised: action approval is not supported.
        const result: ConversationResponse = await createFn(
          caseID,
          assistantIDSendInAPI,
          pConnect.getContextName(),
          cancelCreateConversationTokenSource.current
        );
        conversationCreated = true;

        const conversationId = result.data.ID;
        fetchNewHistory.current[assistantID] = true;
        setSelectedItemInHistory(conversationId);
        setConversationID(conversationId);

        const coachesData = getInstanceValue('coaches');
        updateInstanceState({
          coaches: coachesData.map((e: CoachData) => {
            if (e.id === assistantID) {
              return {
                ...e,
                latestConversationId: conversationId,
                data: result.data,
                conversations: {
                  ...e.conversations,
                  [conversationId]: {
                    messages: []
                  }
                }
              };
            }
            return e;
          })
        });

        const isFullPage = inFullPage.current;
        if (isFullPage) {
          updateHistoryData();
        }

        updateCurrentCoachDetails(assistantID, conversationId, coachType);

        await callSendMessage({
          assistantID,
          currentConversationID: conversationId,
          message,
          coachType,
          enableStream: !!result.data.supportedCapabilities?.stream?.isEnabled,
          formattedAttachments,
          additionalInstruction,
          questionnaire
        });

        if (isFullPage) {
          updateHistoryData();
        }
      } catch (err) {
        const isCanceled = err instanceof Error && isRequestCanceled(err);

        // A conversation that could not be created withdraws the message shown for it (it goes back to the composer),
        // or else the loader, so a new message can be sent.
        if (!conversationCreated && !isCanceled) {
          if (userMessageData !== undefined) {
            setMessages(messagesBeforeSend);
            setInitialSuggestedMessages(initialSuggestionsBeforeSend);
          } else {
            setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && msg.loading && !msg.message)));
          }
        }

        if (coachType === AGENT) {
          if (!isCanceled) {
            clearErrorMessages();
            setConversationError(normalizeErrorResponse(err, l11nService).response.data.errorDetails[0].localizedValue);
            if (userMessageData !== undefined) {
              setDraftMessage(message);
            }
          }
        } else if (!isCanceled) {
          handleErrorResponse(normalizeErrorResponse(err, l11nService));
        }
        setIsCreatingConversation(false);
      }
    };

    // Calls the Send Message API and updates the messages with the API response.
    const onSend = async (sendItem: SendMessageProps) => {
      let item = sendItem;
      const isUploading = attachments.some(att => att.progress !== UPLOAD_COMPLETE);

      if (isUploading) {
        setAttachmentsError(l11nService.getLocalizedText('Please wait for the attachments to finish uploading.'));
        return;
      }

      if (questionnaireData?.inline && !item.formAnswers) {
        const question = questionnaireData.questions[0];
        if (question) {
          if (question.optionItems.some(opt => opt.key === item.id)) {
            item = {
              ...item,
              message: '',
              formAnswers: {
                [question.field]: { value: [item.id], questionText: question.questionText }
              }
            };
          } else if (item.fromComposer && item.message) {
            const typedAnswer = item.message;
            item = {
              ...item,
              message: '',
              formAnswers: {
                [question.field]: { value: [typedAnswer], questionText: question.questionText }
              }
            };
          }
        }
      }

      // Handle questionnaire submission when formAnswers are present
      if (item.formAnswers) {
        const {
          currentCoachInfo: { assistantID, conversationID: currentConversationID },
          selectedCoach
        } = getSelectedCoach();

        const textMessage = item.message || '';
        const { formAnswers } = item;

        const resolveLabel = (optionKey: string, options: QuestionnaireConfig['questions'][number]['optionItems']) => {
          const option = options.find(opt => opt.key === optionKey);
          return formatOptionLabel(option?.displayLabel ?? option?.label ?? optionKey);
        };

        const answeredQuestions = (questionnaireData?.questions ?? []).filter(question => (formAnswers[question.field]?.value ?? []).length > 0);

        resetStreamState();

        answeredQuestions.forEach(question => {
          const selectedKeys = formAnswers[question.field]?.value ?? [];
          if (!questionnaireData?.inline) {
            updateMessages(question.questionText, false, false, [], activeCoach, '', undefined, true);
          }
          const answerText = selectedKeys.map(key => resolveLabel(key, question.optionItems)).join(', ');
          updateMessages(answerText, true, false);
        });

        if (textMessage) {
          updateMessages(textMessage, true, false);
        }

        updateMessages(undefined, false, true);
        setInitialSuggestedMessages([]);

        setQuestionnaireData(undefined);
        clearPendingQuestionnaire();

        if (item.fromComposer) setAttachments([]);

        const questions: QuestionnaireAnswerPayload[] = (questionnaireData?.questions ?? []).map(question => {
          const selectedKeys = formAnswers[question.field]?.value ?? [];
          return {
            field: question.field,
            type: question.type,
            questionText: question.questionText,
            selectedItems: selectedKeys.map(key => ({
              key,
              label: resolveLabel(key, question.optionItems)
            }))
          };
        });

        if (!currentConversationID) {
          createConversationThenSend(assistantID, selectedCoach.type, textMessage, undefined, undefined, {
            questions
          });
          return;
        }

        callSendMessage({
          assistantID,
          currentConversationID,
          message: textMessage,
          coachType: selectedCoach.type,
          enableStream: enableStreaming,
          questionnaire: { questions }
        });

        return;
      }

      const updatedMessage = (item.message || '').trim();

      const {
        currentCoachInfo: { assistantID, conversationID: currentConversationID },
        selectedCoach
      } = getSelectedCoach();

      // Filter the attachments based on the selected item .
      const filteredAttachments =
        item?.attachmentIds && item.attachmentIds?.length ? attachments.filter(att => item.attachmentIds?.includes(att.id)) : [];

      // Formats the attachments to be sent in the API request.
      const formattedAttachments =
        filteredAttachments && filteredAttachments.length > 0 && item?.fromComposer
          ? filteredAttachments.map(att => ({
              type: 'File',
              category: 'File',
              fileName: att.name,
              ID: att.ID as string
            }))
          : [];

      const additionalInstruction = prompts.find(obj => obj[promptKey] === updatedMessage)?.[instructionsKey] as string | undefined;
      const messageToSend = updatedMessage;
      const instructionToSend = additionalInstruction;

      resetStreamState();

      setQuestionnaireData(undefined);
      clearPendingQuestionnaire();

      if (item?.fromComposer) {
        setAttachments([]);
        setDraftMessage('');
      }

      // Deferred conversation creation: when config was fetched without creating a conversation.
      // The user message is appended while the conversation is created, and withdrawn if it cannot be created.
      if (!currentConversationID) {
        createConversationThenSend(assistantID, selectedCoach.type, messageToSend, formattedAttachments, instructionToSend, undefined, {
          attachmentIds: item?.attachmentIds
        });
        return;
      }

      addUserOrToolMessage({
        message: updatedMessage,
        attachmentIds: item?.attachmentIds
      });

      callSendMessage({
        assistantID,
        coachType: selectedCoach.type,
        currentConversationID,
        enableStream: enableStreaming,
        formattedAttachments,
        message: messageToSend,
        additionalInstruction: instructionToSend
      });
    };

    suggestionSelectRef.current = (message: string) => {
      if (guidedMode) {
        onSend({ id: createUID(), message });
      } else {
        setDraftMessage(message);
      }
    };

    // Handles the configuration-only response (no conversation created).
    const handleConfigurationResponse = (result: ConfigurationResponse, assistantID: string, selectedCoachType: string) => {
      setLoading(false);
      setGuidedMode(result.data.assistantMode === GUIDED);
      setEnableStreaming(!!result.data.supportedCapabilities?.stream?.isEnabled);
      setSalutation(result.data.welcomeMessage || undefined);
      setShowFeedback(!result.data.turnOffFeedback);

      const mode = result.data.suggestionsMode;
      const suggestedPrompts = result.data?.suggestedPrompts ?? [];
      const selectedCoachOption = coachOptions.find(e => e.id === assistantID);
      if (suggestedPrompts.length > 0 && selectedCoachOption) {
        buildSuggestions(suggestedPrompts, selectedCoachOption, mode);
      }

      if (result.data.initialInstruction) {
        resetStreamState();
        addUserOrToolMessage({ message: result.data.initialInstruction });
        createConversationThenSend(
          assistantID,
          selectedCoachType,
          `${result.data.initialInstruction || ''} ${result.data.initialAdditionalInstruction || ''}`
        );
      }
    };

    // Calls the conversation API and updates the state.
    const startConversation = async (assistantID: string) => {
      // Retrieves the coaches data from Redux.
      const { selectedCoach } = getSelectedCoach(assistantID);
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      // Checks if specified coach exists in Redux. If it does, it uses the existing data; otherwise, it calls the API and assigns the response.
      if (selectedCoach && Object.keys(selectedCoach.data).length > 0) {
        // Updates the state with redux data.
        updateCurrentCoachDetails(selectedCoach.id, selectedCoach.latestConversationId, selectedCoach.type);
        updateCoachDetails(selectedCoach);
      } else {
        // First load: fetch config only, defer conversation creation to first send.
        setLoading(true);
        try {
          const fetchFn = selectedCoach.type !== AGENT ? getCoach : getAgent;
          const result = await fetchFn(assistantIDSendInAPI, pConnect.getContextName(), caseID, cancelGetConfigurationTokenSource.current);
          handleConfigurationResponse(result, assistantID, selectedCoach.type);
        } catch (err) {
          if (!(err instanceof Error && isRequestCanceled(err))) {
            handleErrorResponse(normalizeErrorResponse(err, l11nService));
          }
        }
      }
    };

    // Resets all state variables to their default values when the coach is changed.
    const onCoachChange = (id: string) => {
      // Checks if the currently active coach is selected again from the dropdown.
      if (activeCoach.id === id) return;
      // Switching agents cancels any in-flight stream.
      leaveConversation();
      setGuidedMode(true);
      resetGlobalStates();
      setShowHistory(false);

      setHistoryError('');
      setHistoryLoading(false);
      fullHistoryFetched.current = false;
      pageIndexRef.current = 1;

      setSelectedItemInHistory('');
      // Updates the 'selected' property in the coach options array to reflect the newly selected coach.
      const updatedCoachOptions = [...coachOptions].map((item: MenuItemProps | MenuGroupProps) => ({
        ...item,
        selected: item.id === id
      }));
      setCoachOptions(updatedCoachOptions);
      const coach = updatedCoachOptions.find((item: MenuItemProps | MenuGroupProps) => item.id === id);
      if (coach) {
        const { selectedCoach } = getSelectedCoach(coach.id);
        updateCurrentCoachDetails(selectedCoach.id, selectedCoach.latestConversationId, selectedCoach.type);
        setActiveCoach(coach);
        setHistoryResp([]);
        // Triggers the conversation API with the new coach ID.
        startConversation(selectedCoach.id);
      }
    };

    // This method triggers when the coach state in the utilities is changed.
    const onStateChange = (state: State) => {
      if (utilitiesExpanded && state === 'maximized' && activeCoach?.id) {
        startConversation(activeCoach.id);
      }
    };

    // This method triggers when the coach is mounted.
    const onOpen = () => {
      if (!utilitiesExpanded && activeCoach?.id) {
        startConversation(activeCoach.id);
      }
    };

    const hasMessages = messages.length > 0;

    const handleNewChat = hasMessages
      ? () => {
          leaveConversation();
          if (inFullPage.current) {
            setHistoryError('');
          } else {
            setShowHistory(false);
          }

          setAttachments([]);
          resetGlobalStates();
          const { selectedCoach, coachesData } = getSelectedCoach();
          updateCurrentCoachDetails(activeCoach.id, '', selectedCoach.type);
          // Deviation from Constellation: reset from the cached configuration; the conversation is created on the next send.
          updateLatestConversationIdForCoach(activeCoach.id, '', coachesData);
          setSelectedItemInHistory('');
          // The configuration is cached once a conversation is created; until then it is fetched again.
          if (Object.keys(selectedCoach.data ?? {}).length > 0) {
            handleConfigurationResponse({ data: selectedCoach.data }, activeCoach.id, selectedCoach.type);
          } else {
            startConversation(activeCoach.id);
          }
        }
      : undefined;

    const actions: ActionsProps = {
      items: [
        {
          id: 'view_history',
          text: localizedVal('Your chats', localeCategory),
          visual: <HistoryIcon fontSize='small' />,
          onClick: () => {
            if (!showHistory) {
              setHistoryError('');
              setShowHistory(true);
              updateHistoryData();
            } else setShowHistory(false);
          }
        }
      ]
    };

    // Deviation from Constellation: render the history from state; its engine-store copy is written after the render and does not re-render this host.
    const getHistoryData = () => groupedHistory;

    const onUploadProgress = (id: string, ev: { loaded: number; total: number }) => {
      let progress: number = Math.floor((ev.loaded / ev.total) * UPLOAD_COMPLETE);
      if (progress >= UPLOAD_COMPLETE) progress = 99;
      setAttachments(localFiles =>
        localFiles.map(localFile => {
          if (localFile?.id === id) {
            return {
              ...localFile,
              inProgress: progress !== UPLOAD_COMPLETE, // true if not done, false if done
              progress
            };
          }
          return localFile;
        })
      );
    };

    const onAddAttachment = (files: File[]) => {
      const maxAttachmentSize = PCore.getEnvironmentInfo().getMaxAttachmentSize() || '3';

      // The 4.1 typings declare fewer arguments than the engine accepts.
      const attachmentUtils = PCore.getAttachmentUtils() as any;

      // Replace all existing attachments with new ones
      setAttachments([]);
      setAttachmentsError('');

      const addedFiles: FileItemProps[] = files.map((file: File) => {
        const fileID = createUID();
        const fileItem: FileItemProps = {
          ID: fileID,
          id: fileID,
          name: file.name,
          type: file.type,
          createTime: file.lastModified,
          format: file.name.split('.').pop(),
          progress: 0,
          inProgress: true,
          onDelete: () => setAttachments(current => current.filter(f => f.id !== fileID)),
          onCancel: () => setAttachments(c => c?.filter(f => f.id !== fileID)),
          file
        };

        // Store the raw file for upload
        uploadedFile.current[fileID] = file;

        // Validate file size
        if (!validateMaxSize({ size: file.size }, maxAttachmentSize)) {
          fileItem.error = (l11nService as any).getLocalizedText('File is too big. Max allowed size is {1}MB.', [maxAttachmentSize]);

          return fileItem;
        }

        // Upload valid file
        attachmentUtils
          .uploadAttachment(
            uploadedFile.current[fileID],
            (ev: { loaded?: number; total?: number }) => onUploadProgress(fileID, { loaded: ev.loaded ?? 0, total: ev.total ?? 1 }),
            () => {},
            pConnect.getContextName(),
            undefined,
            'File'
          )
          .then((fileResponse: unknown) => {
            if (isResponseWithID(fileResponse)) {
              const responseWithID = fileResponse;
              if (responseWithID.ID) {
                setAttachments(current =>
                  current.map(att => (att.id === fileID ? { ...att, ID: responseWithID.ID, progress: UPLOAD_COMPLETE, inProgress: false } : att))
                );
              }
            }
          })
          .catch((err: Error) => {
            setAttachments(current =>
              current.map(att =>
                att.id === fileID
                  ? {
                      ...att,
                      error: l11nService.getLocalizedText(err.message),
                      progress: UPLOAD_COMPLETE,
                      inProgress: false
                    }
                  : att
              )
            );
          });

        return fileItem;
      });

      // Add new attachments to state
      setAttachments(addedFiles);
    };

    const handleStopGenerating = () => {
      if (streamCancelTokenRef.current) {
        streamCancelTokenRef.current.cancel();
        streamCancelTokenRef.current = null;
      }

      cancelAgentStream(
        true,
        showFeedback
          ? msg => ({
              ...msg,
              feedback: {
                reaction: undefined,
                onReaction: handleReaction,
                onFeedbackComplete: handleFeedback
              }
            })
          : undefined
      );
      setQuestionnaireData(undefined);
      clearPendingQuestionnaire();
    };

    const onQuestionnaireDismiss = () => {
      setQuestionnaireData(undefined);
      clearPendingQuestionnaire();
    };

    return {
      loading,
      enableStreaming,
      messages: normalizedMessages,
      coachOptions,
      onCoachChange,
      onSend,
      onOpen,
      initialSuggestedMessages,
      suggestions,
      error,
      guidedMode,
      onStateChange: isCaseView ? onStateChange : undefined,
      onLayoutChange: (inFullPageArg: boolean) => {
        inFullPage.current = inFullPageArg;
      },
      actions,
      onNewChat: handleNewChat,
      conversationHistory: showHistory
        ? {
            error: historyError || undefined,
            loading: historyLoading,
            data: getHistoryData(),
            onDismiss: () => {
              setShowHistory(false);
            },
            onItemClick: (conversationId: string) => {
              // Deviation from Constellation: opening another conversation cancels the current stream, as switching agents does.
              if (conversationId !== getSelectedCoach().currentCoachInfo?.conversationID) {
                leaveConversation();
                resetStreamState();
              }
              if (!inFullPage.current) setShowHistory(false);
              fetchMessagesForConversation(conversationId);
            },
            loadMore: () => {
              // Deviation from Constellation: the next page follows from what is loaded, so a repeated call cannot skip a page.
              pageIndexRef.current = Math.floor(historyResp.length / pageSize) + 1;
              updateHistoryData(true);
            },
            selectedItemId: selectedItemInHistory
          }
        : undefined,
      // Attachments are offered for agents only.
      onAddAttachment: getSelectedCoach().selectedCoach?.type === AGENT ? onAddAttachment : undefined,
      attachments,
      attachmentsError,
      draftMessage,
      conversationError,
      onStop: enableStreaming && isAgentStreamActive && getSelectedCoach().selectedCoach?.type === AGENT ? handleStopGenerating : undefined,
      isCreatingConversation,
      salutation,
      questionnaireData,
      onQuestionnaireDismiss
    };
  }

  // Agents were configured but none could be resolved: explain instead of rendering nothing.
  if (coaches.some(e => e.config.coach === null && (!('visibility' in e.config) || e.config.visibility === true))) {
    return getConfigurationIncompleteResult();
  }

  return undefined;
};

export default useGenAICoachObj;
