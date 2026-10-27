# Data Model: AI Agent Experience in Case View and Application Assistant

**Feature**: `001-ai-agent-assistant` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

All entities are client-side view models. Persistent data (conversations, messages, ratings, attachments) is stored by the platform; the client keeps a session cache in the engine store (R10). Field names of server payloads are listed in [contracts/engine-genai-assistant.md](./contracts/engine-genai-assistant.md).

The entities below describe behaviour. In code they are the types ported from Constellation into `GenAICoach.types.ts` (research R15):

| Entity | Ported type or field |
|---|---|
| AgentOption | `coachOptions` items; `id` from `createCoachId(insName, type)` |
| AgentConfig | `getAgent`/`getCoach` response data (`ConfigurationResponse`) |
| ConversationContext | Hook arguments `caseID` (the context ID), `isCaseView` and `isLandingPage`; `instanceId` inside the hook |
| ConversationSummary, HistoryGroup | `HistoryResponse`; `ConversationHistoryProps['data']` built by `groupByUpdatedOn` |
| ChatMessage | `GenAIMessageProps` = `UserMessageProps` \| `CoachMessageProps` \| `SystemMessageProps` |
| ActionProgress | `progressSteps` and `progressStepsCompleted` on a coach message; tool metadata in `AgentStreamState` |
| QuestionSet, Answer | `QuestionnaireConfig` (`questions`, `inline`), `Question`, `FormAnswer` |
| Attachment | `FileItemProps` (declared locally), `AttachmentMeta` |
| AgentSessionCache | `genAICoach.<instanceId>` through the hook's `getInstanceValue`/`updateInstanceState` |
| AssistantDisplayState | `AppShell` state `showAgentPanel`, `showPageContent`, `agentExpanded`; `PortalAgentContext` exposes `showAgentPanel`, `agentExpanded` and `pagePanel` |

## 1. AgentOption

A configured agent the user can choose.

| Field | Type | Source / rule |
|---|---|---|
| `id` | string | `"<insName>##<type>"`; only `insName` is sent to the engine |
| `insName` | string | `coaches[].config.coach.insName`, or `selectedAgents[].pxInsName` |
| `type` | `'agent' \| 'coach'` | `config.coach.type`, or `pyComponentName === 'AIAgentObject'` → agent |
| `label` | string | `config.coach.label`, or `pyDisplayLabel` falling back to `pyLabel` |
| `classID` | string | `config.coach.classID` / `selectedAgents[].classID` |

**Validation**: Drop entries whose `config.visibility === false` (hidden on purpose) and entries whose `config.coach` is null. If entries were provided but none has a resolved `coach`, the panel shows the "configuration incomplete" state; if all were hidden, nothing is shown. The first remaining entry is selected initially.

## 2. AgentConfig

Per-agent settings, from the `getAgent`/`getCoach` response or a conversation-creation response (`data`).

| Field | Type | Meaning |
|---|---|---|
| `welcomeMessage` | string? | Salutation in the empty state |
| `suggestedPrompts` | Prompt[] | Prompt text under the mapped prompt key; instruction under the mapped instructions key (key mapping + namespace stripping) |
| `guided` | boolean | `assistantMode === 'Guided'` (FR-013) |
| `streamingEnabled` | boolean | `supportedCapabilities.stream.isEnabled` (FR-010) |
| `feedbackEnabled` | boolean | `!turnOffFeedback`, and agent kind only (FR-026) |
| `initialInstruction` / `initialAdditionalInstruction` | string? | Auto-sent first message when present |

Ignored in this release (out of scope): `enableTracer`, `enableFilteredToolsDisplay`, `suggestionsMode === 'Dynamic'` card fields (`title`, `category`, `auxiliaryValue`, `isAISuggestion`). Dynamic prompts are shown as plain suggestions using their prompt text.

**Derived**: up to 4 prompts shown as initial suggestions (FR-009); all prompts available in the suggestions menu and, in guided mode, as the only input.

## 3. ConversationContext

| Field | Type | Rule |
|---|---|---|
| `contextID` | string | Host rules in research R9 |
| `contextName` | string | `pConnect.getContextName()` |
| `instanceId` | string | Cache namespace (R10), as in the source hook: `caseview` for the case view, `landingpage` for agents configured on a landing page (R21), otherwise the agent `insName` values joined with `_` (fallback `coaches`), which the application assistant uses |

## 4. ConversationSummary and HistoryGroup

| Entity | Fields |
|---|---|
| `ConversationSummary` | `id`, `title` (server `name`), `updatedOn`, `createdOn` |
| `HistoryGroup` | `section` (localized label), `conversations: ConversationSummary[]` |

**Grouping rule** (by calendar day of `updatedOn`, newest first, groups in first-seen order): same day → "Today"; within 7 days → "Previous 7 Days"; within 30 days → "Previous 30 Days"; same year → month name; otherwise → year.

**Paging**: page size 20, page index from 1; the list is complete when a page returns fewer than 20 items.

## 5. ChatMessage

Discriminated by `from`.

| Variant | Fields |
|---|---|
| `UserMessage` (`from: 'user'`) | `id`, `text`, `attachments: SentAttachment[]` |
| Coach message (`from: 'coach'`, for agent and coach answers) | `id` (server `messageID` once known, else local), `text` (formatted), `status`, `error?`, `suggestions: {id, text}[]`, `feedback?: {enabled, reaction?: 'liked' \| 'disliked'}`, `progress?: {title, steps: string[], completed: number}`, `approvalNotice?: string` (R7) |
| `SystemMessage` (`from: 'system'`) | `id`, `kind: 'case-created' \| 'case-opened' \| 'action-failed' \| 'stopped'`, `text`, `caseRef?: {id, type, label}` |

**Rules**
- Only the latest message displays follow-up suggestions (FR-012).
- Ratings appear only on the last completed agent message of each answer segment, for agents with `feedbackEnabled` (FR-026).
- `text` for agent messages is rendered as formatted content with control blocks removed (FR-014, FR-015).

**Coach message status transitions**

```text
pending ──first text──▶ streaming ──end of stream──▶ complete
   │                       │ └──Stop──▶ stopped (partial text kept; SystemMessage 'stopped' appended)
   │                       └──error──▶ failed (partial text kept, error shown)
   ├──complete JSON response──▶ complete
   └──error──▶ failed
```

A `pending` message with no text is an "orphan loader": the first streamed text adopts it; it is removed when an action progress item or image-choice event takes its place, and on finalization.

## 6. ActionProgress

Shown as a coach message with progress steps (`progressSteps`, `progressStepsCompleted`), converted on completion.

| Field | Type | Source |
|---|---|---|
| `toolType` | `'CREATE_CASE' \| 'OPEN_CASE' \| 'PERFORM_ASSIGNMENT'` | stream event |
| `caseType` | `{id, label}` | `displayMetadata.casetype` |
| `case` | `{id, label}`? | `displayMetadata.case` |
| `assignment` | `{id, label, taskID, processID, stageID, stageLabel, isTaskCompleted}`? | `displayMetadata.assignment` |
| `steps` / `completed` | string[] / number | accumulated |
| `outcome` | `'SUCCESS' \| other` | `output.status` (default `UNKNOWN`) |

**Transitions**

```text
CREATE_CASE / OPEN_CASE:
  started ──end SUCCESS + label──▶ SystemMessage (case-created / case-opened)
  started ──end SUCCESS, no label or case type──▶ removed silently
  started ──end failure──▶ kept (a retry reuses it) ──finalize──▶ removed
PERFORM_ASSIGNMENT:
  started ──more steps (retry of same taskID not duplicated)──▶ started
  started ──step end SUCCESS──▶ completed += 1 (each completion visible ≥ 750 ms)
  started ──finalize, all steps done──▶ removed
  started ──finalize, a step incomplete/failed──▶ replaced by SystemMessage (action-failed, "<stage>: <assignment>")
```

## 7. QuestionSet and Answers

| Entity | Fields |
|---|---|
| `Question` | `field`, `type: 'single' \| 'multi'`, `questionText`, `defaultInput?`, `options: {key, label, displayLabel?}[]` |
| `QuestionSet` | `questions: Question[]`, `inline: boolean` |
| `Answer` | per `field`: `selected: {key, label}[]`, `questionText`, `type` |

**Rules**
- `inline` when exactly one question, type `single`, three or fewer options; otherwise a form (FR-020).
- Form lists up to five options; with more, four are listed and the rest are reachable through a searchable list.
- Sending requires at least one answered question or typed text; unanswered questions are omitted. Label resolution order: `displayLabel`, `label`, `key`.

**Transitions**: `none → presented (inline | form) → answered (sent with next submission) | dismissed`. A presented set is cached with the conversation and restored with it.

## 8. Attachment

| Field | Type | Rule |
|---|---|---|
| `localId` | string | Generated |
| `name`, `size`, `format` | string, number, string | From the file |
| `status` | `'uploading' \| 'uploaded' \| 'error'` | |
| `progress` | 0–100 | Capped at 99 until the upload resolves |
| `serverId` | string? | Upload response `ID` |
| `error` | string? | Localized message |
| `previewUrl` | string? | Local object URL (revoked on removal) |

**Validation**: size must not exceed `getMaxAttachmentSize()` MB (default 3 when unset) (FR-025). A new selection replaces previous unsent attachments. A message cannot be sent while any attachment is uploading or in error; the user is told why (US6). Agent kind only.

**Send payload item**: `{type: 'File', category: 'File', fileName: name, ID: serverId}`.

**Transitions**: `selected → uploading → uploaded → sent | removed`; `selected → error → removed`.

## 9. AgentSessionCache (engine store)

Path `genAICoach.<instanceId>` via PConnect state.

| Key | Shape |
|---|---|
| `coaches` | `AgentRecord[]` |
| `currentCoach` | `{assistantID, conversationID, isAgent}` |

`AgentRecord` = `{ id, type, latestConversationId, config: AgentConfig (raw response data), conversations: { [conversationId]: { messages: ChatMessage[], pendingQuestionnaire?: QuestionSet } }, history: HistoryGroup[] }`.

**Rules**: Seed records only for agents not already present; update by merging. If a response arrives for an agent or conversation that is no longer current, its cached conversation entry is cleared instead of updating the visible messages.

## 10. AssistantDisplayState (application assistant)

Ported from the source `AppShell` state. The three flags form three modes; `PortalAgentContext` exposes `showAgentPanel`, `agentExpanded` and `pagePanel.visible` (`showPageContent && !agentExpanded`):

| Mode | `showAgentPanel` | `showPageContent` | `agentExpanded` |
|---|---|---|---|
| hidden | false | true | false |
| split | true | true | false |
| full | true | false | true |

The agent panel's content mounts the first time `showAgentPanel` is true and stays mounted while the portal is open (`PortalAgentSplitView`).

**Initial mode**: `getPortalAgentInitialState(getAIAssistantMode(navDisplayOptions.aiAssistantWidth))` — `Hidden` → hidden, `Split-width` → split, `Full-width` → full, anything else → hidden.

**Narrow screens** (below the `md` breakpoint, FR-029; SDK-specific): `split` is replaced by `full` (the assistant covers the page), and the events that switch `full` to `split` hide the assistant instead so the page is visible.

**Transitions** (`onAgentClick` for the navigation entry and Hide, `onAgentToggle` for Full width and Split width)

```text
hidden ──nav entry──▶ split
split  ──nav entry / Hide──▶ hidden
split  ──Full width──▶ full
full   ──Split width──▶ split
full   ──Hide / nav entry──▶ hidden
full   ──page shown on app/primary, case opened, case created──▶ split
```

The first page-shown event for the home page after the portal loads does not leave `full` (source `isAgentInStartupMode`).
