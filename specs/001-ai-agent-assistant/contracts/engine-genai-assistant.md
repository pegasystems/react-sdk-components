# Contract: Engine GenAI Assistant API (consumed)

**Feature**: `001-ai-agent-assistant` | **Status**: Consumed interface (provided by the bundled engine, `@pega/constellationjs` 26.1.0) — not reimplemented.

Source of truth: engine module `genai-assistant` (reference `REF:packages/corejs/src/genai-assistant/index.ts`, `release/26.1.2`) and the 26.1 typings (`@pega/pcore-pconnect-typedefs` 5.1.x). The repository still uses the 4.1 typings. The ported hook calls these methods directly and casts at the call site where the 4.1 typings lack a method or argument; request and response shapes are declared in `GenAICoach.types.ts` (research R2).

## 1. Access

| Entry point | Used for |
|---|---|
| `PCore.getGenAIAssistantUtils()` | All conversation operations (§2) |
| `PCore.getRestClient().getCancelTokenSource()` / `.isRequestCanceled(error)` | Stop and cancellation detection |
| `PCore.getAttachmentUtils().uploadAttachment(...)` / `.downloadAttachment(...)` | Attachments (§6) |
| `PCore.getEnvironmentInfo()` | `isInfinityRuntime()`, `getMaxAttachmentSize()`, `getKeyMapping(key)`, `getFeatureMap().namespaceList` |
| `PCore.isNamespaceEnabled()`, `PCore.getNameSpaceUtils().getDefaultQualifiedName(name)` | Prompt key resolution |
| `PCore.getMessageManager().clearMessages({ type: 'error', category: 'HTTP', context })` | Clears page-level error banners raised for this context by a failed agent call; the panel shows its own error instead |

`context` arguments below are the PConnect context name (`pConnect.getContextName()`). Agent and coach IDs are the rule `insName` (the `insName` part of the option ID). `contextID` follows research R9.

## 2. Methods

### Agent path

| Method | Parameters (in order) | Request (query / body) | Resolves to |
|---|---|---|---|
| `getAgent` | `agentID: string, context: string, contextID: string, cancelTokenSource: CancelTokenSource[] = []` | query `{agentID, contextID?}`; no body | Configuration (§3) |
| `createConversationForAgent` | `contextID: string, agentID: string, context: string, cancelTokenSource: CancelTokenSource[] = [], config?: { isManualConfirmationSupported?: boolean }` | query `{agentID}`; body `{contextID, executeStarterQuestion: false}` plus `capabilities.tools.isManualConfirmationSupported: true` only if the flag is set. **This feature never sets the flag** (R7). | Configuration with `data.ID` (§3) |
| `sendMessageForAgent` | `agentID: string, conversationID: string, message: string, context: string, attachments?: Attachment[], config?: SendMessageConfig` | query `{agentID, conversationID}`; body §2.1 | Streamed response (see [stream-events.md](./stream-events.md)) or complete response (§4) |
| `getConversationsForAgent` | `agentID: string, contextID: string, pageSize: number, pageIndex: number, context: string, cancelTokenSource: CancelTokenSource[] = []` | query `{agentID, contextID, pageSize, pageIndex}` (index starts at 1) | History page (§5) |
| `getMessagesForAgent` | `agentID: string, conversationID: string, context: string, cancelTokenSource: CancelTokenSource[] = []` | query `{agentID, conversationID}` | Conversation messages (§5) |
| `likeAgentMessage` | `agentID: string, conversationID: string, messageID: string, context: string` | query `{agentID, conversationID, messageID}` | Acknowledgement |
| `unLikeAgentMessage` | `agentID: string, conversationID: string, messageID: string, context: string, feedbackText = ''` | same query; body `{feedbackText}` | Acknowledgement |

### Coach path

| Method | Parameters | Notes |
|---|---|---|
| `getCoach` | `assistantID, context, contextID, cancelTokenSource[] = []` | Same as `getAgent`; query `{assistantID, contextID?}` |
| `createConversation` | `contextID, assistantID, context, cancelTokenSource[] = []` | No configuration argument |
| `sendMessage` | `assistantID, conversationID, message, context, config?: SendMessageConfig` | Streamed when `config.enableStreaming`; **no attachments and no cancellation token** on this path; the complete (non-streamed) path ignores `config` |
| `getConversations` | `assistantID, contextID, pageSize, pageIndex, context, cancelTokenSource[] = []` | As agent path |
| `getMessages` | `assistantID, conversationID, context, cancelTokenSource[] = []` | As agent path |

Coaches have no rating methods; ratings, Stop, attachments, case actions and questions are agent-only in this feature.

### 2.1 Send body and configuration

`SendMessageConfig` = `{ enableStreaming: boolean; additionalInstruction?: string; questionnaire?: { questions: { field: string; type: 'single' | 'multi'; questionText: string; selectedItems: { key: string; label: string }[] }[] }; cancelTokenSource?: CancelTokenSource; toolsReviewed?: ToolResponse[]; isManualConfirmationSupported?: boolean }`. This feature never sends `toolsReviewed` or `isManualConfirmationSupported`.

| Body field | Streamed send | Complete send |
|---|---|---|
| `request` (the message text) | present only if non-empty | present |
| `additionalInstruction` | if set | if set |
| `attachments` | if non-empty | if non-empty |
| `questionnaire` | if set | **not sent** |
| `capabilities.stream.isEnabled: true` | always | — |

`Attachment` item = `{ type: 'File', category: 'File', fileName: string, ID: string }` where `ID` is the upload response ID.

Streamed sends request `Accept: text/event-stream` with a stream response type; the agent path honours `config.cancelTokenSource` for cancellation.

### 2.2 Common behaviour

- **Headers**: conversation, message, send, like and dislike calls carry `user-timezone` and `user-locale` (added by the engine when available). Configuration calls (`getAgent`/`getCoach`) do not.
- **Cancellation arrays**: methods taking `cancelTokenSource: CancelTokenSource[]` cancel any tokens already in the passed array before starting, then push their own. Pass one long-lived array per operation kind (configuration, creation, history, messages) so a newer request cancels an older one.
- **Errors**: rejections are request errors whose user-facing text is `error.response.data.errorDetails[0].localizedValue`. Requests cancelled by a token are recognised with `PCore.getRestClient().isRequestCanceled(error)` and must not show an error.
- **Routing**: route keys `getAgent`, `getCoach`, `createConversation[ForAgent]`, `sendMessage[ForAgent]`, `getConversations[ForAgent]`, `getMessages[ForAgent]`, `likeAgentMessage`, `dislikeAgentMessage` are resolved by the engine from server routing metadata. Clients never build URLs.

## 3. Configuration (`getAgent` / `getCoach` / creation responses)

Response envelope `{ data: { … } }`. Fields used:

| Field | Type | Use |
|---|---|---|
| `ID` | string | Conversation ID (creation responses only) |
| `welcomeMessage` | string? | Empty-state salutation |
| `suggestedPrompts` | Prompt[] | Suggestions; prompt text under the mapped `pyPrompt` key, instruction under the mapped `pyInstructions` key (mapping: `getKeyMapping(key) ?? key`, namespace-qualified via `getDefaultQualifiedName`, then the `<ns>__` prefix stripped) |
| `assistantMode` | string? | `'Guided'` → guided mode |
| `supportedCapabilities.stream.isEnabled` | boolean? | Streamed sends |
| `turnOffFeedback` | boolean? | Hide ratings |
| `initialInstruction`, `initialAdditionalInstruction` | string? | Auto-sent first message (`"<instruction> <additional>"`) |
| `response`, `messageID`, `aiGuidedQuestions` | string, string, Prompt[] | Creation responses may already contain a first answer |
| `enableTracer`, `enableFilteredToolsDisplay`, `suggestionsMode` and dynamic prompt fields | — | Out of scope; ignored |

## 4. Complete (non-streamed) send response

- Agent: `{ data: { messageID: string, response: string, aiGuidedQuestions?: Prompt[], toolsNeedConfirmation?: unknown[] } }`. If `toolsNeedConfirmation` is non-empty, show the read-only approval notice (R7).
- Coach: `{ data: string }` — the answer text.
- Error payload: `{ errorDetails: [ { localizedValue, message, … } ] }` via the rejection.

## 5. History and messages

**History page**: `{ data: { conversations: [ { id, name, updatedOn, createdOn } ] } }`. `name` is the conversation title. Fewer than `pageSize` items means no more pages.

**Conversation messages**: `{ data: { id, name, createdOn, updatedOn, messages: Message[] } }`.

| Message field | Meaning / mapping |
|---|---|
| `role` | `USER` → user message; `ASSISTANT` → agent message; `SYSTEM` → system message (see below) |
| `content` | Text. For `role: USER` with `type: 'ANSWER'`, `content` is a JSON array of `{pyLabel}`; display the labels joined by `", "` |
| `messageID` | Agent message ID (used for ratings) |
| `isLiked` | `true` → liked, `false` → disliked, `null` → none |
| `aiGuidedQuestions` | Follow-up suggestions (prompt text via the mapped key) |
| `attachments` | `[{ id, ID, fileName, extension, mimeType }]`; preview/download with `downloadAttachment(ID, context, '')` |
| `event` | JSON string `{ toolType, displayMetadata }` on `SYSTEM` messages |
| `toolType` | `UI_INSIGHT` system entries render as agent messages; `CREATE_CASE`/`OPEN_CASE` with `displayMetadata.casetype.ID` and `displayMetadata.case.ID` render as case-created/opened system messages (label from `case.label`, else `casetype.label`); entries without `casetype.ID` are skipped |
| `questionnaire` | JSON string `{ component: 'questionnaire', props: <JSON string of { questionnaire: { questions, inline? } }> }`; taken from the **last** message only, to restore a pending question set |
| `toolsNeedConfirmation` | On the last message: show the read-only approval notice (R7) |

## 6. Attachments

| Call | Parameters | Result |
|---|---|---|
| `uploadAttachment` | `file, onUploadProgress(event: {loaded, total}), onError, context, contextID (undefined on Infinity), category 'File'` | Resolves to an object with `ID` (server file ID) |
| `downloadAttachment` | `ID, context, ''` | Resolves to `{ data, headers }` for preview or download |

Limits: `PCore.getEnvironmentInfo().getMaxAttachmentSize()` in MB; default 3 when unset.

## 7. Engine-handled behaviour (no client work)

When an assignment is loaded, the engine subscribes to agent case-value updates (`COACH_UPDATE`, criteria case and assignment) and writes the values into the case data itself. The client must **not** subscribe to these messages or write the fields; the open case re-renders from the store (FR-019).
