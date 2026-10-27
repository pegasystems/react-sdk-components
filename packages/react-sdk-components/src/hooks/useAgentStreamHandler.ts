import { useRef, useCallback, useEffect, useMemo } from 'react';

import { createUID, isCoachMessage, isMenuGroupProps } from '../components/designSystemExtension/GenAICoachContent/GenAICoach.utils';
import type { CoachMessageProps, GenAIMessageProps, MarkdownMap } from '../components/designSystemExtension/GenAICoachContent/GenAICoach.types';
import type {
  AgentStreamState,
  GetActiveCoach,
  SetMessagesUpdater,
  StreamEvent,
  ToolCallDisplayMetadata
} from '../components/widget/GenAICoach/GenAICoach.types';
import { createAgentMarkdownMap } from '../components/helpers/agent-markdown-renderers';

const MESSAGE_FROM_COACH = 'coach' as const;
const MESSAGE_FROM_SYSTEM = 'system' as const;
const TOOL_OUTPUT_SUCCESS = 'SUCCESS' as const;

const localeCategory = 'GenAICoach';

// Deviation from Constellation: the case system messages are localized; `{1}` is the case label.
const getCaseSystemMessage = (text: string, caseLabel: string): string =>
  PCore.getLocaleUtils().getLocaleValue(text, localeCategory).replace('{1}', caseLabel);

/** Returns true when the message is an orphan loader: coach, loading, no content. */
const isOrphanLoader = (msg: GenAIMessageProps): boolean => isCoachMessage(msg) && !!msg.loading && !msg.message;

/** Resolves the active coach's display name. */
const resolveCoachName = (getActiveCoach: GetActiveCoach): string => {
  const coach = getActiveCoach();
  return !isMenuGroupProps(coach) ? (coach.primary ?? '') : '';
};

/** Creates a base coach message with streaming enabled. */
const createBaseCoachMessage = (
  id: string,
  coachName: string,
  markdownMap: MarkdownMap,
  overrides?: Partial<CoachMessageProps>
): GenAIMessageProps => ({
  id,
  from: MESSAGE_FROM_COACH,
  coachName,
  loading: true,
  enableStreaming: true,
  allChunksReceived: false,
  markdownMap,
  ...overrides
});

/**
 * Manages the message-object lifecycle for an agent SSE stream.
 *
 * During a PERFORM_ASSIGNMENT (PA) flow, two persistent message objects are maintained:
 * 1. A progress indicator message — created on the first PA toolCallStart, updated in-place.
 * 2. A text message — created on the first `message` event after a PA tool call.
 *
 * Call `finalizeStream` after the stream ends and before applying final response metadata.
 */
const useAgentStreamHandler = (setMessages: SetMessagesUpdater, getActiveCoach: GetActiveCoach, markdownMap?: MarkdownMap) => {
  const mdMap = useMemo(() => markdownMap || createAgentMarkdownMap(), [markdownMap]);
  const initialState: AgentStreamState = {
    activeMessageId: '',
    assignmentProgressId: '',
    assignmentTextId: '',
    assignmentStepLabels: [],
    assignmentStepsCompleted: 0,
    lastTaskId: '',
    assignmentFailedLabel: '',
    caseCreationProgressId: ''
  };

  /** Minimum time (ms) a step spinner must be visible before transitioning to a checkmark. */
  const minDuration = 750;

  const stateRef = useRef<AgentStreamState>({ ...initialState });
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepStartedAtRef = useRef(0);

  const resetStreamState = useCallback(() => {
    if (completionTimerRef.current !== null) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    stateRef.current = { ...initialState };
  }, []);

  /** Updates a single message by ID via the setMessages updater. */
  const updateMessageById = useCallback(
    (id: string, updater: (msg: CoachMessageProps) => GenAIMessageProps) => {
      setMessages(prev => prev.map(msg => (isCoachMessage(msg) && msg.id === id ? updater(msg) : msg)));
    },
    [setMessages]
  );

  /** Appends text content to the message field of a given message ID. */
  const appendContent = useCallback(
    (id: string, content: string) => {
      updateMessageById(id, msg => ({
        ...msg,
        message: `${msg.message ?? ''}${content}`
      }));
    },
    [updateMessageById]
  );

  /** Increments the completed-step counter and updates the progress message. */
  const applyStepCompletion = useCallback(() => {
    const s = stateRef.current;
    if (!s.assignmentProgressId) return;

    s.assignmentStepsCompleted += 1;
    updateMessageById(s.assignmentProgressId, msg => ({
      ...msg,
      progressStepsCompleted: s.assignmentStepsCompleted
    }));
  }, [updateMessageById]);

  /**
   * Seals the current PA text message so subsequent message events create a new bubble.
   * Called before each toolCallStart to preserve correct message ordering when tool calls
   * are interleaved with streamed text (e.g. CREATE_CASE fires while assignmentTextId is set).
   */
  const sealAssignmentTextIfNeeded = useCallback(() => {
    const { assignmentTextId } = stateRef.current;
    if (!assignmentTextId) return;

    updateMessageById(assignmentTextId, msg => ({
      ...msg,
      loading: false,
      allChunksReceived: true
    }));
    stateRef.current.assignmentTextId = '';
  }, [updateMessageById]);

  /**
   * Removes the in-flight PA progress message and resets all PA tracking state.
   * Called when CREATE_CASE or OPEN_CASE supersedes an active PA flow, regardless
   * of what combination of events preceded it.
   */
  const clearPAProgressIfNeeded = useCallback(() => {
    const { assignmentProgressId } = stateRef.current;
    if (!assignmentProgressId) return;

    if (completionTimerRef.current !== null) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && msg.id === assignmentProgressId)));

    stateRef.current.assignmentProgressId = '';
    stateRef.current.assignmentStepLabels = [];
    stateRef.current.assignmentStepsCompleted = 0;
    stateRef.current.lastTaskId = '';
    stateRef.current.assignmentFailedLabel = '';
  }, [setMessages]);

  /** Seals the active non-PA message: sets loading to false and clears tracking. */
  const sealActiveMessage = useCallback(() => {
    const { activeMessageId } = stateRef.current;
    if (!activeMessageId) return;

    updateMessageById(activeMessageId, msg => ({
      ...msg,
      loading: false,
      allChunksReceived: true
    }));

    stateRef.current.activeMessageId = '';
  }, [updateMessageById]);

  /** Removes the last message if it's an orphan loader (placeholder with no content). */
  const removeOrphanLoader = useCallback(() => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      return last && isOrphanLoader(last) ? prev.slice(0, -1) : prev;
    });
  }, [setMessages]);

  /** Clears whatever precedes a tool call: seals the active message or removes orphan loader. */
  const clearPrecedingMessage = useCallback(() => {
    if (stateRef.current.activeMessageId) {
      sealActiveMessage();
    } else {
      removeOrphanLoader();
    }
  }, [sealActiveMessage, removeOrphanLoader]);

  /**
   * Adopts an existing orphan loader or creates a fresh coach message.
   * Stores the ID as the active tracked message.
   */
  const adoptOrCreateMessage = useCallback((): string => {
    const newId = createUID();
    stateRef.current.activeMessageId = newId;

    setMessages(prev => {
      const last = prev[prev.length - 1];

      if (last && isOrphanLoader(last)) {
        if (last.id === stateRef.current.caseCreationProgressId) {
          stateRef.current.caseCreationProgressId = '';
        }

        return [
          ...prev.slice(0, -1),
          {
            ...last,
            id: newId,
            enableStreaming: true,
            allChunksReceived: false
          } as GenAIMessageProps
        ];
      }

      return [...prev, createBaseCoachMessage(newId, resolveCoachName(getActiveCoach), mdMap)];
    });

    return newId;
  }, [setMessages, getActiveCoach, mdMap]);

  /** Pushes a new coach message with progress steps. Returns its ID. */
  const createProgressMessage = useCallback(
    (steps: string[], completedSteps?: number): string => {
      const newId = createUID();
      const overrides: Partial<CoachMessageProps> = {
        progressSteps: steps,
        ...(completedSteps !== undefined ? { progressStepsCompleted: completedSteps } : {})
      };

      setMessages(prev => [...prev, createBaseCoachMessage(newId, resolveCoachName(getActiveCoach), mdMap, overrides)]);
      return newId;
    },
    [setMessages, getActiveCoach, mdMap]
  );

  const handleMessageEvent = useCallback(
    (content: string) => {
      const state = stateRef.current;

      if (state.assignmentProgressId) {
        // PA flow active — route text to the persistent PA text message.
        if (!state.assignmentTextId) {
          const newId = createUID();
          state.assignmentTextId = newId;

          setMessages(prev => [...prev, createBaseCoachMessage(newId, resolveCoachName(getActiveCoach), mdMap, { message: content })]);
        } else {
          appendContent(state.assignmentTextId, content);
        }
      } else {
        // Normal flow — adopt orphan or append to active message.
        if (!state.activeMessageId) {
          adoptOrCreateMessage();
        }
        appendContent(state.activeMessageId, content);
      }
    },
    [setMessages, adoptOrCreateMessage, appendContent, getActiveCoach, mdMap]
  );

  const handleToolCallStartCreateCase = useCallback(
    (displayMetadata: ToolCallDisplayMetadata) => {
      const state = stateRef.current;
      const label = displayMetadata.casetype?.label ?? '';

      // Seal any in-flight PA text so the case bubble is inserted after it (correct order).
      sealAssignmentTextIfNeeded();
      // Remove any active PA progress and reset PA state so the next PA after this
      // case creation starts a fresh progress bubble instead of updating a stale one.
      clearPAProgressIfNeeded();

      if (state.caseCreationProgressId) {
        // Retry after failure — reuse the existing progress message.
        state.activeMessageId = state.caseCreationProgressId;
      } else {
        // First attempt — clear preceding content and create a fresh progress message.
        clearPrecedingMessage();
        const progressId = createProgressMessage([label]);
        state.activeMessageId = progressId;
        state.caseCreationProgressId = progressId;
      }
    },
    [clearPrecedingMessage, createProgressMessage, sealAssignmentTextIfNeeded, clearPAProgressIfNeeded]
  );

  const handleToolCallEndCreateCase = useCallback(
    (displayMetadata: ToolCallDisplayMetadata, outputStatus: string) => {
      const { activeMessageId } = stateRef.current;
      stateRef.current.activeMessageId = '';

      if (outputStatus !== TOOL_OUTPUT_SUCCESS) {
        return;
      }

      stateRef.current.caseCreationProgressId = '';

      const caseLabel = displayMetadata.case?.label ?? '';

      if (!caseLabel) {
        setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && msg.id === activeMessageId)));
        return;
      }

      const caseInfo =
        displayMetadata.case?.ID && displayMetadata.casetype?.ID
          ? {
              id: displayMetadata.case.ID,
              type: displayMetadata.casetype.ID,
              label: displayMetadata.case.label || displayMetadata.casetype.label || ''
            }
          : undefined;

      setMessages(prev =>
        prev.map(msg => {
          if (isCoachMessage(msg) && msg.id === activeMessageId) {
            return {
              id: msg.id,
              from: MESSAGE_FROM_SYSTEM,
              message: getCaseSystemMessage('Case \u201C{1}\u201D created', caseLabel),
              caseInfo
            };
          }
          return msg;
        })
      );
    },
    [setMessages]
  );

  const handleToolCallStartOpenCase = useCallback(
    (displayMetadata: ToolCallDisplayMetadata) => {
      // Seal any in-flight PA text so it becomes its own bubble before OPEN_CASE.
      sealAssignmentTextIfNeeded();
      // Remove any active PA progress and reset PA state so the next PA after this
      // open-case starts a fresh progress bubble instead of updating a stale one.
      clearPAProgressIfNeeded();
      // Handle any remaining non-PA preceding message (orphan loader or active message).
      clearPrecedingMessage();

      const label = displayMetadata.casetype?.label ?? displayMetadata.case?.label ?? '';
      stateRef.current.activeMessageId = createProgressMessage([label]);
    },
    [clearPrecedingMessage, createProgressMessage, sealAssignmentTextIfNeeded, clearPAProgressIfNeeded]
  );

  const handleToolCallEndOpenCase = (displayMetadata: ToolCallDisplayMetadata) => {
    const { activeMessageId } = stateRef.current;

    // If casetype.ID is null/falsy, the case was not found — remove the progress message silently.
    if (!displayMetadata.casetype?.ID) {
      setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && msg.id === activeMessageId)));
      stateRef.current.activeMessageId = '';
      return;
    }

    const caseLabel = displayMetadata.case?.label ?? '';

    const caseInfo =
      displayMetadata.case?.ID && displayMetadata.casetype?.ID
        ? {
            id: displayMetadata.case.ID,
            type: displayMetadata.casetype.ID,
            label: displayMetadata.case.label || displayMetadata.casetype.label || ''
          }
        : undefined;

    setMessages(prev =>
      prev.map(msg => {
        if (isCoachMessage(msg) && msg.id === activeMessageId) {
          return {
            id: msg.id,
            from: MESSAGE_FROM_SYSTEM,
            message: getCaseSystemMessage('Case \u201C{1}\u201D opened', caseLabel),
            caseInfo
          };
        }
        return msg;
      })
    );
    stateRef.current.activeMessageId = '';
  };

  const handleToolCallStartPerformAssignment = useCallback(
    (displayMetadata: ToolCallDisplayMetadata) => {
      const state = stateRef.current;

      // Seal any PA text accumulated since the last tool call so each narrative segment
      // between tool calls renders as its own bubble (correct ordering).
      sealAssignmentTextIfNeeded();

      // If a previous step's completion is pending (min display time), flush it now.
      if (completionTimerRef.current !== null) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;

        applyStepCompletion();
      }
      stepStartedAtRef.current = Date.now();

      const label = displayMetadata.assignment?.label ?? '';
      const taskId = displayMetadata.assignment?.taskID ?? '';
      const { assignmentStepLabels, assignmentStepsCompleted } = state;

      // Retry detection: skip if the same task is retrying (same step within an assignment).
      const isRetry = taskId !== '' && state.lastTaskId === taskId;

      state.lastTaskId = taskId;

      if (!isRetry) {
        state.assignmentStepLabels = [...assignmentStepLabels, label];
      }
      const updatedLabels = [...state.assignmentStepLabels];

      if (!state.assignmentProgressId) {
        // First PA step — clear preceding content and create the progress message.
        clearPrecedingMessage();
        state.assignmentProgressId = createProgressMessage(updatedLabels, assignmentStepsCompleted);
      } else {
        // Subsequent PA step — update the existing progress message in-place.
        updateMessageById(state.assignmentProgressId, msg => ({
          ...msg,
          progressSteps: updatedLabels,
          progressStepsCompleted: assignmentStepsCompleted
        }));
      }
    },
    [clearPrecedingMessage, createProgressMessage, updateMessageById, applyStepCompletion, sealAssignmentTextIfNeeded]
  );

  const handleToolCallEndPerformAssignment = useCallback(
    (displayMetadata: ToolCallDisplayMetadata, outputStatus: string) => {
      const state = stateRef.current;
      if (!state.assignmentProgressId) return;

      const isTaskCompleted = displayMetadata.assignment?.isTaskCompleted === true;

      if (isTaskCompleted && outputStatus === TOOL_OUTPUT_SUCCESS) {
        // Defer the checkmark so the spinner is visible for at least minDuration.
        const elapsed = Date.now() - stepStartedAtRef.current;
        const remaining = minDuration - elapsed;

        if (remaining > 0) {
          completionTimerRef.current = setTimeout(() => {
            completionTimerRef.current = null;
            applyStepCompletion();
          }, remaining);
        } else {
          applyStepCompletion();
        }
      } else {
        // Covers both explicit failure (status !== SUCCESS) and silent non-completion
        const stageLabel = displayMetadata.assignment?.stageLabel ?? '';
        const assignmentLabel = displayMetadata.assignment?.label ?? '';

        state.assignmentFailedLabel = stageLabel ? `${stageLabel}: ${assignmentLabel}` : assignmentLabel;
      }
    },
    [applyStepCompletion]
  );

  /**
   * Cancels an in-flight stream: removes orphan loaders, seals partially streamed messages,
   * optionally applies feedback to the last coach message, and appends a stopped system message.
   */
  const cancelStream = useCallback(
    (stopped?: boolean, addFeedback?: (msg: CoachMessageProps) => CoachMessageProps) => {
      setMessages(prev => {
        const sealed = prev
          .filter(msg => !isOrphanLoader(msg))
          .map(msg => {
            if (isCoachMessage(msg) && msg.loading) {
              return { ...msg, loading: false, allChunksReceived: true };
            }
            return msg;
          });

        let result: GenAIMessageProps[] = sealed;

        if (addFeedback) {
          const last = sealed[sealed.length - 1];
          if (last && isCoachMessage(last) && last.message && !last.feedback) {
            result = [...sealed.slice(0, -1), addFeedback(last)];
          }
        }

        if (stopped) {
          return [...result, { id: createUID(), from: MESSAGE_FROM_SYSTEM, stopped: true }];
        }

        return result;
      });
      resetStreamState();
    },
    [setMessages, resetStreamState]
  );

  /** Removes the PA progress message and inserts an error system message if any step failed. */
  const finalizeStream = useCallback(
    (needsToolConfirmation?: boolean) => {
      // Flush any pending min-display-time completion before finalizing.
      if (completionTimerRef.current !== null) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;

        applyStepCompletion();
      }

      const state = stateRef.current;

      const { caseCreationProgressId } = state;
      if (caseCreationProgressId) {
        setMessages(prev => prev.filter(msg => !(isCoachMessage(msg) && msg.id === caseCreationProgressId)));
        state.caseCreationProgressId = '';
      }

      const { assignmentProgressId } = state;
      if (assignmentProgressId) {
        const hasIncompleteStep = state.assignmentStepLabels.length > state.assignmentStepsCompleted;

        setMessages(prev => {
          const progressIdx = prev.findIndex(msg => isCoachMessage(msg) && msg.id === assignmentProgressId);
          const filtered = prev.filter(msg => !(isCoachMessage(msg) && msg.id === assignmentProgressId));

          if (hasIncompleteStep) {
            const label = state.assignmentFailedLabel || state.assignmentStepLabels[state.assignmentStepLabels.length - 1] || '';

            if (label) {
              const errorMsg: GenAIMessageProps = {
                id: createUID(),
                from: MESSAGE_FROM_SYSTEM,
                message: label
              };

              const insertAt = progressIdx >= 0 ? progressIdx : filtered.length;
              filtered.splice(insertAt, 0, errorMsg);
            }
          }

          return filtered;
        });
      }

      // Remove orphan loaders. If tool confirmation is needed, also ensure at least one
      // loading coach message exists for updateMessagesWithResponse to target — all in one
      // updater so the check and the addition are atomic with the cleanup.
      setMessages(prev => {
        const filtered = prev.filter(msg => !isOrphanLoader(msg));
        if (needsToolConfirmation && !filtered.some(msg => isCoachMessage(msg) && !!msg.loading)) {
          const coachName = resolveCoachName(getActiveCoach);
          return [
            ...filtered,
            {
              id: createUID(),
              from: MESSAGE_FROM_COACH,
              message: undefined,
              loading: true,
              coachName,
              markdownMap: mdMap
            }
          ];
        }
        return filtered;
      });
    },
    [setMessages, applyStepCompletion, getActiveCoach, mdMap]
  );

  const handleStreamEvent = useCallback(
    (event: StreamEvent) => {
      if (event.type === 'message') {
        handleMessageEvent(event.content);
        return;
      }

      if (event.type === 'toolCallStart') {
        if (event.toolType === 'CREATE_CASE') {
          handleToolCallStartCreateCase(event.displayMetadata);
        } else if (event.toolType === 'OPEN_CASE') {
          handleToolCallStartOpenCase(event.displayMetadata);
        } else if (event.toolType === 'PERFORM_ASSIGNMENT') {
          handleToolCallStartPerformAssignment(event.displayMetadata);
        }

        return;
      }

      if (event.type === 'toolCallEnd') {
        if (event.toolType === 'CREATE_CASE') {
          handleToolCallEndCreateCase(event.displayMetadata, event.output.status);
        } else if (event.toolType === 'OPEN_CASE') {
          handleToolCallEndOpenCase(event.displayMetadata);
        } else if (event.toolType === 'PERFORM_ASSIGNMENT') {
          handleToolCallEndPerformAssignment(event.displayMetadata, event.output.status);
        } else if (event.toolType === 'UI_INSIGHT') {
          // here \n's are required to render json as a markdown code block in the UI
          handleMessageEvent(`\n${event.displayMetadata.output || ''}\n\n`);
          if (stateRef.current?.activeMessageId) {
            try {
              const codeBlockMatch = event.displayMetadata?.output?.match(/```[\s\S]*?\n([\s\S]*?)```/);
              const aiGuidedQuestions = codeBlockMatch ? JSON.parse(codeBlockMatch[1])?.aiGuidedQuestions : undefined;
              if (aiGuidedQuestions?.length > 0)
                updateMessageById(stateRef.current.activeMessageId, msg => {
                  return {
                    ...msg,
                    suggestions: aiGuidedQuestions.map((ques: string) => ({ id: createUID(), message: ques }))
                  };
                });
            } catch {
              // If parsing fails, we can choose to skip showing suggested questions.
            }
          }
        }
      }
    },
    [
      handleMessageEvent,
      handleToolCallStartCreateCase,
      handleToolCallEndCreateCase,
      handleToolCallStartOpenCase,
      handleToolCallStartPerformAssignment,
      handleToolCallEndPerformAssignment
    ]
  );

  useEffect(() => {
    return () => {
      if (completionTimerRef.current !== null) {
        clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  return {
    handleAgentStreamEvent: handleStreamEvent,
    resetStreamState,
    finalizeAgentStream: finalizeStream,
    cancelAgentStream: cancelStream
  };
};

export default useAgentStreamHandler;
