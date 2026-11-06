import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import download from 'downloadjs';

import { copyToClipboard, createUID, isCoachMessage, isMenuGroupProps } from '../components/designSystemExtension/GenAICoachContent/GenAICoach.utils';
import type {
  ActionsProps,
  CoachMessageProps,
  ConversationHistoryProps,
  FileDisplayProps,
  FileItemProps,
  GenAIMessageProps,
  MenuGroupProps,
  MenuItemProps,
  MenuItems,
  MessageProps,
  Reaction,
  SendMessageProps,
  State,
  UserMessageProps
} from '../components/designSystemExtension/GenAICoachContent/GenAICoach.types';
import type {
  AttachmentMeta,
  CoachData,
  ConversationMessage,
  ConversationResponse,
  ErrorResponse,
  GenAICoach,
  GetMessagesResponse,
  HistoryResponse,
  MessageResponse,
  Prompt,
  StreamResponse
} from '../components/widget/GenAICoach/GenAICoach.types';
import { validateMaxSize } from '../components/helpers/attachmentShared';
import { fileDownload } from '../components/widget/Attachment/AttachmentUtils';
import { handleMessageStream } from '../components/helpers/message-stream-utils';
import { createAgentMarkdownMap } from '../components/helpers/agent-markdown-renderers';

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

const normalizeErrorResponse = (error: unknown, localizationService: { getLocalizedText: (key: string) => string }): ErrorResponse => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'errorDetails' in error.response.data &&
    Array.isArray(error.response.data.errorDetails) &&
    error.response.data.errorDetails.length > 0 &&
    typeof error.response.data.errorDetails[0]?.localizedValue === 'string'
  ) {
    return error as ErrorResponse;
  }

  const errorMessage = error instanceof Error ? error.message : undefined;
  const localizedValue = errorMessage || localizationService.getLocalizedText('Something went wrong. Try again.');

  return {
    response: {
      data: {
        errorDetails: [
          {
            message: localizedValue,
            erroneousInputOutputFieldInPage: '',
            erroneousInputOutputIdentifier: '',
            errorClassification: '',
            localizedValue,
            messageParameters: []
          }
        ]
      }
    }
  };
};

const isStreamResponse = (sendMessageResponse: MessageResponse | StreamResponse): sendMessageResponse is StreamResponse => {
  const headers = (sendMessageResponse as StreamResponse)?.headers;
  if (typeof sendMessageResponse !== 'object' || sendMessageResponse === null || typeof headers !== 'object' || headers === null) {
    return false;
  }
  const contentType = headers['content-type'];
  return typeof contentType === 'string' && contentType.startsWith('text/event-stream');
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

// This custom hook returns the data needed to render the Gen AI Coach widget.
const useGenAICoachObj = (
  coaches: undefined | GenAICoach[],
  caseID: string,
  pConnect: typeof PConnect,
  isCaseView: boolean = false,
  utilitiesExpanded: boolean = false
) => {
  const pageSize = 20;
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const [initialSuggestedMessages, setInitialSuggestedMessages] = useState<MessageProps[]>([]);
  const [messages, setMessages] = useState<GenAIMessageProps[]>([]);
  const [conversationID, setConversationID] = useState('');
  const [enableStreaming, setEnableStreaming] = useState(false);
  const [loading, setLoading] = useState<boolean | string>(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [suggestions, setSuggestions] = useState<MenuItems>([]);
  const [error, setError] = useState('');
  const [salutation, setSalutation] = useState<string | undefined>(undefined);
  const [disclaimerMessage, setDisclaimerMessage] = useState<string | undefined>(undefined);
  const [guidedMode, setGuidedMode] = useState(true);
  // Stand-in for the Cosmos toaster: the panel shows this message.
  const [toastMessage, setToastMessage] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [selectedItemInHistory, setSelectedItemInHistory] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const pageIndexRef = useRef(1);
  const fullHistoryFetched = useRef(false);
  const [historyResp, setHistoryResp] = useState<HistoryResponse[]>([]);
  const inFullPage = useRef(false);

  const cancelCreateConversationTokenSource = useRef([]);
  const cancelGetConversationsTokenSource = useRef([]);
  const cancelGetMessagesTokenSource = useRef([]);
  const GUIDED = 'Guided';
  const AGENT = 'agent';
  const DELIMITER = '##';
  const ASSISTANT_MODE = 'assistantMode';
  const promptKey = getMappedValue('pyPrompt') as keyof Prompt;

  const markdownMap = useMemo(() => createAgentMarkdownMap({ getPConnect: () => pConnect }), [pConnect]);

  const handleCopyResponse = async (response: string) => {
    const copied = await copyToClipboard(response);
    setToastMessage(localizedVal(copied ? 'Copied to clipboard' : 'Failed to copy', localeCategory));
  };

  const buildMessageActions = (response: string, messageActions?: ActionsProps): ActionsProps => ({
    ...messageActions,
    items: [
      {
        id: 'copy-response',
        text: localizedVal('Copy', localeCategory),
        icon: 'copy',
        onClick: () => handleCopyResponse(response)
      },
      ...(messageActions?.items.filter(({ id }) => id !== 'copy-response') ?? [])
    ]
  });

  // Setting the attachment object.
  const [attachments, setAttachments] = useState<FileItemProps[]>([]);
  const [attachmentsError, setAttachmentsError] = useState('');
  const uploadedFile = useRef<Record<string, File>>({});
  const l11nService = pConnect.getLocalizationService();
  const UPLOAD_COMPLETE = 100;

  // The 4.1 typings do not declare these engine methods.
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
    getMessagesForAgent
  } = PCore.getGenAIAssistantUtils() as any;
  const { isRequestCanceled } = PCore.getRestClient() as any;

  // Function to create the ID
  const createCoachId = (name: string, type: string) => `${name}${DELIMITER}${type}`;

  // Function to split the ID back into name and type
  const splitCoachId = (id: string) => {
    const [name, type] = id.split(DELIMITER);
    return { name, type };
  };

  const getSelectedCoach = (coachID = '') => {
    const coachesData = pConnect.getValue('genAICoach.coaches');
    const currentCoachInfo = pConnect.getValue('genAICoach.currentCoach');
    const selectedCoach = coachesData?.find((coach: CoachData) => coach.id === (coachID || currentCoachInfo?.assistantID));

    return {
      selectedCoach,
      coachesData,
      currentCoachInfo
    };
  };

  // This method formats the coaches as needed for the component and also stores the coaches data in Redux.
  const buildCoachOptions = useCallback((coachesList: GenAICoach[] | undefined) => {
    const filterCoaches = (genAICoaches: GenAICoach[] | undefined) => {
      return genAICoaches?.filter(e => e.config.coach !== null && (!('visibility' in e.config) || e.config.visibility === true)) || [];
    };

    const mappedCoaches: MenuItems = [];
    const filteredCoaches = filterCoaches(coachesList);

    filteredCoaches.forEach((item: GenAICoach, index: number) => {
      const coachConfig = item.config.coach;
      if (coachConfig) {
        mappedCoaches.push({
          id: createCoachId(coachConfig.insName, coachConfig.type),
          primary: coachConfig.label,
          selected: index === 0
        });
      }
    });

    // Deviation from Constellation: hosts without agents make no engine-store writes, so they behave as before.
    if (!coachesList) return mappedCoaches;

    // Updates Redux with the coaches data.
    pConnect.updateState({
      genAICoach: {
        coaches: filteredCoaches.map((item: GenAICoach) => {
          const coachConfig = item.config.coach;
          if (!coachConfig) return null;
          return {
            id: createCoachId(coachConfig.insName, coachConfig.type),
            type: coachConfig.type,
            latestConversationId: '',
            data: {},
            conversations: {},
            history: []
          };
        })
      }
    });
    return mappedCoaches;
  }, []);

  const [coachOptions, setCoachOptions] = useState<MenuItems>(() => buildCoachOptions(coaches));
  const [activeCoach, setActiveCoach] = useState<MenuItemProps | MenuGroupProps>(coachOptions[0]);
  const fetchNewHistory = useRef<Record<string, boolean>>(
    coachOptions.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {})
  );

  // Deviation from Constellation: the panel renders the history from state (see getHistoryData).
  const groupedHistory = useMemo(() => groupByUpdatedOn(historyResp, pConnect), [historyResp]);

  useEffect(() => {
    if (!coaches) return;
    const { selectedCoach, coachesData } = getSelectedCoach(activeCoach?.id);
    // Updates the messages in redux
    pConnect.updateState({
      genAICoach: {
        coaches:
          coachesData?.map((e: CoachData) => {
            if (e.id === activeCoach?.id && selectedCoach.latestConversationId) {
              return {
                ...e,
                conversations: {
                  ...e.conversations,
                  [selectedCoach.latestConversationId]: {
                    ...e.conversations[selectedCoach.latestConversationId],
                    messages
                  }
                }
              };
            }
            return e;
          }) || []
      }
    });
  }, [messages]);

  useEffect(() => {
    if (!coaches) return;
    const { selectedCoach } = getSelectedCoach(activeCoach?.id);
    pConnect.updateState({
      genAICoach: {
        currentCoach: {
          assistantID: selectedCoach?.id,
          conversationID: selectedCoach?.latestConversationId,
          isAgent: selectedCoach?.type === AGENT
        }
      }
    });
  }, [activeCoach]);

  useEffect(() => {
    if (!coaches) return;
    const { currentCoachInfo, coachesData } = getSelectedCoach();
    const assistantID = currentCoachInfo?.assistantID;

    if (assistantID) {
      pConnect.updateState({
        genAICoach: {
          coaches: coachesData.map((e: CoachData) => {
            if (e.id === assistantID) {
              return {
                ...e,
                history: groupedHistory
              };
            }
            return e;
          })
        }
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

  if (!coaches) return;

  // Returns an object containing the error message.
  if (coaches.length === 0) {
    return {
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
    };
  }

  if (coaches.some(e => e.config.coach !== null && (!('visibility' in e.config) || e.config.visibility === true))) {
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
      setSalutation(undefined);
      setDisclaimerMessage(undefined);
    };

    // This method formats the suggestions as needed for the component.
    const buildSuggestions = (suggestionsList: Prompt[], coach: MenuItemProps | MenuGroupProps = activeCoach) => {
      setSuggestions([
        {
          id: coach.id,
          label: !isMenuGroupProps(coach) ? coach.primary : '',
          items: suggestionsList.map((item: Prompt) => {
            return {
              id: createUID(),
              primary: item[promptKey]
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
            message: item[promptKey]
          };
        })
      );
    };

    // Helper function to update active coach details.
    const updateCurrentCoachDetails = (assistantID: string, chatID: string, type: string) => {
      pConnect.updateState({
        genAICoach: {
          currentCoach: {
            assistantID,
            conversationID: chatID,
            isAgent: type === AGENT
          }
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

    // Deviation from Constellation: a failed load without error details (such as a network error) still shows a message.
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
      pConnect.updateState({
        genAICoach: {
          coaches: coachesData.map((e: CoachData) => {
            if (e.id === assistantID) {
              return {
                ...e,
                latestConversationId: chatID
              };
            }
            return e;
          })
        }
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
        currentCoachInfo: { assistantID },
        selectedCoach
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
          if (isCoachMessage(message) && message.id === id) {
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
      message: string,
      isUser: boolean,
      isLoading: boolean,
      coachSuggestions: string[] = [],
      coach: MenuItemProps | MenuGroupProps = activeCoach,
      messageID: string = '',
      attachmentIds?: string[]
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
            // The Cosmos lightbox is not ported: a sent attachment is downloaded, from the file the user selected
            // (the ID of an upload is not an attachment key, so the server cannot return it yet).
            onPreview: attachment.file ? () => download(attachment.file as File, attachment.name) : undefined,
            displayText: attachment.name,
            value: attachment.name,
            format: attachment.format
          });
        }
      });
      if (isUser) {
        const messageObject: UserMessageProps = {
          id: messageID || createUID(),
          from: 'user',
          message,
          attachments: files
        };

        setMessages((res: GenAIMessageProps[]) => [...res, messageObject]);
      } else if (!isMenuGroupProps(coach)) {
        const messageObject: CoachMessageProps = {
          id: isAgent ? messageID : createUID(),
          from: 'coach',
          message,
          loading: isLoading,
          coachName: coach.primary ?? '',
          markdownMap,
          messageActions: buildMessageActions(message)
        };
        if (isAgent) {
          messageObject.suggestions = buildCoachSuggestions(coachSuggestions);
          messageObject.feedback = {
            reaction: undefined,
            onReaction: handleReaction,
            onFeedbackComplete: handleFeedback
          };
        }
        setMessages((res: GenAIMessageProps[]) => [...res, messageObject]);
      }
    };

    // Updates the state with the response from the conversation API / redux.
    const updateCoachDetails = (result: CoachData) => {
      setConversationID(result.latestConversationId);
      const selectedCoach = coachOptions.find((e: MenuItemProps | MenuGroupProps) => e.id === result.id);
      setSalutation(result.data.welcomeMessage || undefined);
      setDisclaimerMessage(result.data.disclaimerMessage || undefined);
      // Checks if guided mode is active, based on the presence of 'assistantMode' in the response.
      setGuidedMode(result.data[ASSISTANT_MODE] === GUIDED);
      setEnableStreaming(!!result.data.supportedCapabilities?.stream?.isEnabled);
      const suggestedPrompts = result.data?.suggestedPrompts ?? [];
      if (suggestedPrompts.length > 0) buildSuggestions(suggestedPrompts, selectedCoach);
      // Checks if there are messages and updates the messages for new coach.
      const reduxData = result.conversations?.[result.latestConversationId]?.messages || [];
      if (reduxData.length === 0) {
        setMessages([]);
      } else {
        // Updates the messages for an existing coach.
        setMessages(
          reduxData.map(message =>
            isCoachMessage(message)
              ? {
                  ...message,
                  messageActions: buildMessageActions(message.message ?? '', message.messageActions)
                }
              : message
          )
        );
      }
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

          pConnect.updateState({
            genAICoach: {
              coaches: updatedCoachesData
            }
          });
        }

        const updatedSelectedCoach = updatedCoachesData?.find((e: CoachData) => e.id === assistantID);
        if (updatedSelectedCoach) {
          updateCoachDetails(updatedSelectedCoach);
        }
      } else {
        const updatedMessages = data.map(item => {
          let messageObject: UserMessageProps | CoachMessageProps;
          const {
            currentCoachInfo: { isAgent }
          } = getSelectedCoach();
          if (isApiResponseMsg(item)) {
            if (item.role === 'USER') {
              const attachmentsWithFormat = (item.attachments as (FileDisplayProps & AttachmentMeta)[])?.map(att => ({
                ...att,
                format: att.extension
              }));

              messageObject = {
                id: createUID(),
                from: 'user',
                message: item.content,
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
                message: item.content,
                coachName: !isMenuGroupProps(activeCoach) ? activeCoach.primary : '',
                enableStreaming: false,
                markdownMap,
                messageActions: buildMessageActions(item.content)
              };
              if (isAgent) {
                messageObject.suggestions = buildCoachSuggestions((item.aiGuidedQuestions ?? []).map((question: Prompt) => question[promptKey]));
                messageObject.feedback = {
                  reaction: updateReaction(),
                  onReaction: handleReaction,
                  onFeedbackComplete: handleFeedback
                };
              }
            }
          } else {
            messageObject = item;
            if (item.from === 'coach') {
              messageObject = {
                ...item,
                enableStreaming: false,
                messageActions: buildMessageActions(item.message ?? '', item.messageActions)
              };

              if (isAgent) {
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

        setMessages(updatedMessages || []);

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
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      setAttachments([]);
      setError('');
      setSelectedItemInHistory(conversationId);
      setLoading(true);

      if (selectedCoach && Object.keys(selectedCoach.conversations).length > 0 && selectedCoach.conversations?.[conversationId]) {
        const reduxData = selectedCoach.conversations[conversationId].messages;
        handleFetchMessagesForConversation(assistantID, conversationId, coachesData, selectedCoach, currentConversationID, reduxData || []);
      } else if (selectedCoach.type !== AGENT) {
        getMessages(assistantIDSendInAPI, conversationId, pConnect.getContextName(), cancelGetMessagesTokenSource.current)
          .then((response: GetMessagesResponse) => {
            handleFetchMessagesForConversation(
              assistantID,
              conversationId,
              coachesData,
              selectedCoach,
              currentConversationID,
              response.data.messages || [],
              true
            );
          })
          .catch((err: unknown) => handleLoadError(err));
      } else {
        getMessagesForAgent(assistantIDSendInAPI, conversationId, pConnect.getContextName(), cancelGetMessagesTokenSource.current)
          .then((response: GetMessagesResponse) => {
            handleFetchMessagesForConversation(
              assistantID,
              conversationId,
              coachesData,
              selectedCoach,
              currentConversationID,
              response.data.messages || [],
              true
            );
          })
          .catch((err: unknown) => handleLoadError(err));
      }
    };

    // Deviation from Constellation: only a complete answer (all chunks received) stops loading. Here the messages remount
    // (fullscreen, minimize and maximize, history), and a remounted earlier answer reports that it is complete again;
    // in Cosmos they never remount.
    const handleStreamingProgress = (isStreamingDone: boolean) => {
      if (isStreamingDone) {
        setMessages(currentMessages => {
          const lastMessage = currentMessages.at(-1);
          if (!lastMessage || !isCoachMessage(lastMessage) || !lastMessage.loading || !lastMessage.allChunksReceived) {
            return currentMessages;
          }
          return currentMessages.map((message, index) => (index === currentMessages.length - 1 ? { ...message, loading: false } : message));
        });
      }
    };

    // This method updates the state with the response from the send message API.
    const updateMessagesWithResponse = (
      result: MessageResponse,
      reqAssistantID: string,
      reqConversationID: string,
      streaming?: boolean,
      enableStream: boolean = enableStreaming
    ) => {
      const {
        currentCoachInfo: { assistantID },
        coachesData,
        selectedCoach
      } = getSelectedCoach();
      fetchNewHistory.current[assistantID] = true;
      const latestConversationID = selectedCoach.latestConversationId;

      if (assistantID !== reqAssistantID || latestConversationID !== reqConversationID) {
        pConnect.updateState({
          genAICoach: {
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
          }
        });
      } else {
        const { data } = result;
        setMessages((prevData: GenAIMessageProps[]) => {
          return prevData.map((message: GenAIMessageProps) => {
            if (isCoachMessage(message) && message.loading === true) {
              if (typeof data !== 'string') {
                const { messageID, response, aiGuidedQuestions = [] } = data;
                const updatedMessage = streaming ? `${message.message || ''}${response}` : message.message || response;

                return {
                  ...message,
                  id: messageID,
                  message: updatedMessage,
                  messageActions: buildMessageActions(updatedMessage, message.messageActions),
                  suggestions: buildCoachSuggestions(aiGuidedQuestions.map((question: Prompt) => question[promptKey])),
                  loading: enableStream,
                  onStreamingUpdate: (isStreamingDone: boolean) => handleStreamingProgress(isStreamingDone),
                  allChunksReceived: !streaming,
                  enableStreaming: enableStream
                };
              }
              if (typeof data === 'string') {
                const updatedMessage = streaming ? `${message.message || ''}${data}` : message.message || data;

                return {
                  ...message,
                  message: updatedMessage,
                  messageActions: buildMessageActions(updatedMessage, message.messageActions),
                  loading: enableStream,
                  onStreamingUpdate: (isStreamingDone: boolean) => handleStreamingProgress(isStreamingDone),
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
      if (err?.response?.data?.errorDetails?.length > 0) {
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

    const addUserMessage = ({ message, attachmentIds }: { message: string; attachmentIds?: string[] }) => {
      // Append the attachment to coach conversation
      updateMessages(message, true, false, [], activeCoach, '', attachmentIds ?? []);
      // Generates an empty message with a loading icon until the coach's response is received.
      updateMessages('', false, true);
      // Clears the initial suggested messages to hide the quick-select questions.
      setInitialSuggestedMessages([]);
    };

    const callSendMessage = async ({
      assistantID,
      currentConversationID,
      message,
      coachType,
      enableStream,
      formattedAttachments
    }: {
      assistantID: string;
      currentConversationID: string;
      message: string;
      coachType: string;
      enableStream: boolean;
      formattedAttachments?: { type: string; category: string; fileName: string; ID: string }[];
    }) => {
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      if (coachType !== AGENT) {
        try {
          let result: MessageResponse | StreamResponse = await sendMessage(
            assistantIDSendInAPI,
            currentConversationID,
            message,
            pConnect.getContextName(),
            {
              enableStreaming: enableStream
            }
          );
          if (enableStream && isStreamResponse(result)) {
            const streamFinalResponse = await handleMessageStream(result, ({ data, streaming }) =>
              updateMessagesWithResponse({ data }, assistantID, currentConversationID, streaming, enableStream)
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
        try {
          let result: MessageResponse | StreamResponse = await sendMessageForAgent(
            assistantIDSendInAPI,
            currentConversationID,
            message,
            pConnect.getContextName(),
            formattedAttachments,
            {
              enableStreaming: enableStream
            }
          );
          if (enableStream && isStreamResponse(result)) {
            const streamFinalResponse = await handleMessageStream(result, ({ data, streaming }) =>
              updateMessagesWithResponse({ data }, assistantID, currentConversationID, streaming, enableStream)
            );
            if (streamFinalResponse && typeof streamFinalResponse.data !== 'string') {
              streamFinalResponse.data.response = '';
              result = streamFinalResponse;
              updateMessagesWithResponse(result, assistantID, currentConversationID, false, enableStream);
            } else {
              // Agent streaming completed with no final JSON response (only SSE events).
              // Use an empty string payload so the string branch in updateMessagesWithResponse
              // is taken, which preserves the accumulated message content and existing message ID.
              updateMessagesWithResponse({ data: '' }, assistantID, currentConversationID, false, enableStream);
            }
          } else {
            updateMessagesWithResponse(result as MessageResponse, assistantID, currentConversationID, false, enableStream);
          }
        } catch (e) {
          if (!(e instanceof Error && isRequestCanceled(e))) {
            updateMessagesWithError(normalizeErrorResponse(e, l11nService));
          }
        }
      }
    };

    // Calls the Send Message API and updates the messages with the API response.
    const onSend = async (item: SendMessageProps) => {
      const isUploading = attachments.some(att => att.progress !== UPLOAD_COMPLETE);
      if (isUploading) {
        setAttachmentsError(l11nService.getLocalizedText('Please wait for the attachments to finish uploading.'));
        return;
      }

      const updatedMessage = item.message.trim();

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

      addUserMessage({ message: updatedMessage, attachmentIds: item?.attachmentIds });

      // Constructs the text using a combination of pyPrompt and pyInstructions, then makes an API call.
      const instruction =
        (prompts.length > 0 &&
          prompts.reduce((acc, obj) => {
            const instructionsKey = getMappedValue('pyInstructions') as keyof Prompt;
            if (obj[promptKey] === updatedMessage) {
              acc = `${obj[promptKey]} ${obj[instructionsKey]}`;
            }
            return acc;
          }, '')) ||
        updatedMessage;

      if (item?.fromComposer) setAttachments([]);

      callSendMessage({
        assistantID,
        coachType: selectedCoach.type,
        currentConversationID,
        enableStream: enableStreaming,
        formattedAttachments,
        message: instruction
      });
    };

    // This method handles the conversation response and updates the state.
    const handleConversationResponse = (
      result: ConversationResponse,
      assistantID: string,
      selectedCoachType: string,
      showAgentRecommendations = false
    ) => {
      fetchNewHistory.current[assistantID] = true;
      if (inFullPage.current) {
        updateHistoryData();
      }
      setSelectedItemInHistory(result.data.ID);
      const coachesData = pConnect.getValue('genAICoach.coaches');
      pConnect.updateState({
        genAICoach: {
          coaches: coachesData.map((e: CoachData) => {
            if (e.id === assistantID) {
              return {
                ...e,
                latestConversationId: result.data.ID,
                data: result.data,
                conversations: {
                  ...e.conversations,
                  [result.data.ID]: {
                    messages: []
                  }
                }
              };
            }
            return e;
          })
        }
      });
      resetGlobalStates();
      setLoading(false);
      updateCurrentCoachDetails(assistantID, result.data.ID, selectedCoachType);
      updateCoachDetails({
        id: assistantID,
        latestConversationId: result.data.ID,
        type: selectedCoachType,
        data: result.data,
        conversations: {},
        history: []
      });

      const recommendationMessages = result.data.recommendationMessages ?? [];
      if (showAgentRecommendations && recommendationMessages.length > 0) {
        const selectedCoach = coachOptions.find(coach => coach.id === assistantID);
        if (selectedCoach && !isMenuGroupProps(selectedCoach)) {
          recommendationMessages.forEach(({ pyRole, pyContent, pyMessageID }) => {
            updateMessages(pyContent, pyRole === 'USER', false, [], selectedCoach, pyMessageID);
          });
        }
      } else if (result.data.initialInstruction) {
        addUserMessage({ message: result.data.initialInstruction });
        callSendMessage({
          assistantID,
          currentConversationID: result.data.ID,
          message: `${result.data.initialInstruction} ${result.data.initialAdditionalInstruction}`,
          coachType: selectedCoachType,
          enableStream: !!result.data.supportedCapabilities?.stream?.isEnabled
        });
      }
    };

    // Calls the conversation API and updates the state.
    const startConversation = (assistantID: string, newChat?: boolean) => {
      // Retrieves the coaches data from Redux.
      const { selectedCoach } = getSelectedCoach(assistantID);
      const assistantIDSendInAPI = splitCoachId(assistantID).name;
      // Checks if specified coach exists in Redux. If it does, it uses the existing data; otherwise, it calls the API and assigns the response.
      // Deviation from Constellation: the cache is used only with its conversation. The engine store deep-merges arrays of the
      // same length, so the reset in buildCoachOptions keeps a remounted host's configuration but clears its conversation ID.
      if (!newChat && selectedCoach && Object.keys(selectedCoach.data).length > 0 && selectedCoach.latestConversationId) {
        // Updates the state with redux data.
        updateCurrentCoachDetails(selectedCoach.id, selectedCoach.latestConversationId, selectedCoach.type);
        updateCoachDetails(selectedCoach);
      } else {
        setLoading(true);
        if (selectedCoach.type !== AGENT) {
          createConversation(caseID, assistantIDSendInAPI, pConnect.getContextName(), cancelCreateConversationTokenSource.current)
            .then((result: ConversationResponse) => {
              handleConversationResponse(result, assistantID, selectedCoach.type);
            })
            .catch((err: unknown) => handleLoadError(err));
        } else {
          createConversationForAgent(caseID, assistantIDSendInAPI, pConnect.getContextName(), cancelCreateConversationTokenSource.current, !newChat)
            .then((result: ConversationResponse) => handleConversationResponse(result, assistantID, selectedCoach.type, !newChat))
            .catch((err: unknown) => handleLoadError(err));
        }
      }
    };

    // Resets all state variables to their default values when the coach is changed.
    const onCoachChange = (id: string) => {
      // Checks if the currently active coach is selected again from the dropdown.
      if (activeCoach.id === id) return;
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
      if (utilitiesExpanded && state === 'maximized') {
        startConversation(activeCoach.id);
      }
    };

    // This method triggers when the coach is mounted.
    const onOpen = () => {
      if (!utilitiesExpanded) {
        startConversation(activeCoach.id);
      }
    };

    // The AI tracer action is not ported.
    const actions: ActionsProps = {
      items: [
        {
          id: 'new_chat',
          text: l11nService.getLocalizedText('New chat'),
          onClick: () => {
            if (inFullPage.current) {
              setHistoryError('');
            } else {
              setShowHistory(false);
            }

            setAttachments([]);
            // create new conversation object
            startConversation(activeCoach.id, true);
          }
        },
        {
          id: 'view_history',
          text: localizedVal('History', localeCategory),
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

      // The 4.1 typings declare a narrower file type than the engine accepts.
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
          // Deviation from Constellation: the error is always set (the reference sets it only on an item that already has an error, so it was never shown).
          fileItem.error = (l11nService as any).getLocalizedText('File is too big. Max allowed size is {1}MB.', [maxAttachmentSize]);

          return fileItem;
        }

        // Upload valid file
        attachmentUtils
          .uploadAttachment(
            uploadedFile.current[fileID],
            (ev: { loaded?: number; total?: number }) => onUploadProgress(fileID, { loaded: ev.loaded ?? 0, total: ev.total ?? 1 }),
            () => {},
            pConnect.getContextName()
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

    return {
      loading,
      enableStreaming,
      messages,
      coachOptions,
      onCoachChange,
      onSend,
      onOpen,
      initialSuggestedMessages,
      suggestions,
      error,
      salutation,
      disclaimerMessage,
      guidedMode,
      onStateChange: isCaseView ? onStateChange : undefined,
      onLayoutChange: (inFullPageArg: boolean) => {
        inFullPage.current = inFullPageArg;
      },
      actions,
      conversationHistory: showHistory
        ? {
            error: historyError || undefined,
            loading: historyLoading,
            data: getHistoryData(),
            onDismiss: () => {
              setShowHistory(false);
            },
            onItemClick: (conversationId: string) => {
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
      onAddAttachment,
      attachments,
      attachmentsError,
      toastMessage,
      onToastClose: () => setToastMessage('')
    };
  }

  return undefined;
};

export default useGenAICoachObj;
