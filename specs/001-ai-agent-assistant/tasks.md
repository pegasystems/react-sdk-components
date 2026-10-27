---

description: "Task list for AI Agent Experience in Case View and Application Assistant"
---

# Tasks: AI Agent Experience in Case View and Application Assistant

**Input**: Design documents from `/specs/001-ai-agent-assistant/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by Constitution VI. Test tasks are tagged **(developer-owned)**: the developer writes and runs them, and `/speckit-implement` must skip them. Git branches, commits and pull requests are also done by the developer.

**Approach**: Port from `constellation-frontend` at `release/26.1.2` (commit `85044c98fb`) the way existing SDK components were ported (research R15). Keep file names, function names, logic and comments. Replace Cosmos components with MUI v6 (`makeStyles`), turn Cosmos `t('<key>')` strings into `localizedVal(<English value>, localeCategory)` (R14), cast at the call site where the 4.1 typings lack an API (R2), leave out the features research.md lists as not ported, and do not copy the source's copyright header. Mark each deliberate deviation (R4, R5, R6 steps 2 and 4, R8, R13) with a one-line comment. Paths prefixed with `REF:` are in `constellation-frontend`.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1–US8)
- Paths are relative to the repository root. The widget folder is `packages/react-sdk-components/src/components/widget/GenAICoach/`; ported hooks go to `packages/react-sdk-components/src/hooks/` and ported utilities to `packages/react-sdk-components/src/components/helpers/`.
- Each ported Cosmos component is a design system extension component, like the SDK's other Cosmos clones (for example `WssQuickCreate`, used by the `QuickCreate` widget): its own folder `packages/react-sdk-components/src/components/designSystemExtension/<Name>/` with `<Name>.tsx` and an `index.tsx` re-export, named after the Constellation component it ports, registered in the component map, and rendered through `getComponentFromMap` (Constitution II and VIII, research R16).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency and folder skeleton

- [X] T001 Add `marked` (`^15.0.6`, the range Constellation's rich text viewer uses) to `dependencies` in packages/react-sdk-components/package.json and in the root package.json, then run `npm install` from the repository root (research R3)
- [X] T002 Create packages/react-sdk-components/src/components/widget/GenAICoach/ and port REF:packages/dx-components/src/components/Widgets/GenAICoach/config.json to packages/react-sdk-components/src/components/widget/GenAICoach/config-ext.json with `name: "GenAICoach"`, `label: "Agent"`, `description: "Agent"`, `type: "Widget"`, `subtype: "CASE"`, `properties: []` (contracts/ui-components.md §1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The ported chat core used by both hosts — case view (US1) and application assistant (US2)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Port the types, keeping the source's split: REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.types.ts to packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.types.ts (with local declarations of the engine types the source imports from `constellation-corejs-library`), and the in-scope types of REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.types.ts to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoach.types.ts (`Variant`, `MessageProps`, `UserMessageProps`, `CoachMessageProps` without tool and image-choice members, `SystemMessageProps`, `GenAIMessageProps`, `ConversationHistoryProps`, `OptionItem`, `Question`, `QuestionnaireConfig`, `FormAnswer`, `SendMessageProps` without `tools`, the in-scope `GenAICoachProps` as `GenAICoachContentProps`, `PortalAgentSplitViewProps` without resize props, and minimal stand-ins for the Cosmos core prop types they use; data-model.md); also port `StreamingContext` from REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessage.tsx (L62–L70) to packages/react-sdk-components/src/components/helpers/StreamingContext.ts (in helpers so an overridden GenAIMessage shares the one context object) for T007 and T013
- [X] T004 [P] Port REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.utils.ts to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoach.utils.ts (`getSelectedKeys`, `isCoachMessage`, `isInUtilities`, `isUserMessage`)
- [X] T005 [P] Port REF:packages/dx-components/src/utils/message-stream-utils.ts to packages/react-sdk-components/src/components/helpers/message-stream-utils.ts (`handleMessageStream`, `normalizeErrorResponse`, `parseQuestionnaireFromHistory`), delivering questions also when the stream ends with a `metadata` frame (deviation, research R8; contracts/stream-events.md §1–§3 and §5)
- [X] T006 [P] Port REF:packages/dx-components/src/utils/hooks/useAgentStreamHandler.ts to packages/react-sdk-components/src/hooks/useAgentStreamHandler.ts — text, tool-call (`CREATE_CASE`, `OPEN_CASE`, `PERFORM_ASSIGNMENT`, `UI_INSIGHT`), progress, Stop and finalization handling; `Case "{1}" created`, `Case "{1}" opened` and `Response stopped` localized (deviation, research R5); image-choice events ignored (contracts/stream-events.md §4)
- [X] T007 [P] Port the `link`, `code` and `text` renderers of REF:packages/dx-components/src/utils/components/agent-markdown-renderers.tsx to packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx — `createAgentMarkdownMap`, `ExternalLink`, `CoachCodeRenderer` (code block, and a loading state while streaming) and `CoachTextRenderer` (removes `###JSON_STARTS_HERE … ###JSON_ENDS_HERE` blocks and hides a trailing partial marker while streaming), reading `StreamingContext` (T003); add case-link handling (deviation, research R13): port REF:packages/dx-components/src/utils/components/agent-inline-edit-utils.ts to packages/react-sdk-components/src/components/helpers/agent-inline-edit-utils.ts; a link with case query parameters or to the configured Infinity server whose case key resolves (from the link, or for a work-ID-only link from the conversation's created or opened cases) and that opens natively opens with `getPConnect().getActionsApi().openWorkByHandle(caseKey, className)` on an unmodified click; other `http`/`https`/`mailto`/`tel` links open in a new tab with `rel="noopener noreferrer"`, other protocols render as text; the chart, insight and case-preview renderers are not ported
- [X] T008 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/AgentRichTextViewer/AgentRichTextViewer.tsx (plus `index.tsx`): the Cosmos `AgentRichTextViewer` wrapper from REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessage.tsx with the markdown mode of REF:packages/cosmos-rte/src/components/RichTextEditor/utils/markdownConverter.tsx — `marked.lexer()` tokens rendered as MUI elements (no HTML strings; `html` tokens as plain text), `markdownMap` overrides per token type (control-block stripping comes from the `text` override, T007), capped headings, scrollable tables and code blocks (research R3)
- [X] T009 Port the foundation of REF:packages/dx-components/src/utils/hooks/useGenAICoachObj.tsx to packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — signature `(coaches, caseID, pConnect, isCaseView, utilitiesExpanded, isPortalAgent)`, the instance ID rule and engine-store cache (`getInstanceValue`/`updateInstanceState` under `genAICoach.<instanceId>`), coach options with the visibility filter and the "configuration incomplete" error, `startConversation` loading `getAgent`/`getCoach` without creating a conversation, `onOpen`/`onStateChange` lazy start, `initialInstruction`, prompt and instruction keys with namespace stripping; Infinity path only (research R6, R9, R10, R18; contracts/ui-components.md §3)
- [X] T010 Port sending to packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — create-on-first-send with `isCreatingConversation`, the user message and loader shown while the conversation is created and withdrawn (message back in the composer) if creation fails (deviation, research R6 step 2), `draftMessage` and `conversationError` on failure; `onSend` through `handleMessageStream` and useAgentStreamHandler.ts with server `messageID` and `aiGuidedQuestions` from the final JSON; the complete JSON path for agents and coaches; `isStreamResponse` accepting any `text/event-stream` content type (deviation, research R4); `additionalInstruction` from a matching prompt; `onStop` with a cancel token and `isRequestCanceled` handling; `onCoachChange` cancelling any in-flight stream; stale-response guard; cancellation on unmount with late responses ignored and no automatic resend (research R6 step 9); `isManualConfirmationSupported` never advertised and the source's tool-confirmation flow left out (T042 adds the read-only notice; research R7)
- [X] T011 Port suggestions and states to packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — guided mode (`assistantMode === 'Guided'`), `salutation`, `initialSuggestedMessages` (max 4), the `suggestions` menu, follow-up suggestions on the latest message only, `loading`/`error` with `errorDetails[0].localizedValue` and the `Something went wrong. Try again.` fallback, error-banner clearing via `PCore.getMessageManager().clearMessages` for the context, and `markdownMap` from `createAgentMarkdownMap`
- [X] T012 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/InitialSuggestedMessage/InitialSuggestedMessage.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/InitialSuggestedMessage.tsx
- [X] T013 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessage.tsx — user message, coach message (text through `getComponentFromMap('AgentRichTextViewer')` with its `markdownMap`, loading and streaming indicator, error, follow-up suggestion buttons on the latest message), centred de-emphasised system line (`stopped`); `StreamingContext` (`isStreamingMessage`, `isStreamingInProgress`) provided around coach messages, as in the source (data-model.md §5)
- [X] T014 Implement packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx (plus `index.tsx`), the MUI port of `GenAICoachContent` and `HeaderActions` in REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.tsx — header with agent name, agent switcher (`coachOptions`, `onCoachChange`) and `actions`; empty state with `salutation` and `InitialSuggestedMessage` items (guided mode sends immediately, otherwise fills the composer); the `fullpage` variant; loading and error states; `onOpen` on mount; children resolved with `getComponentFromMap` (contracts/ui-components.md §4)
- [X] T015 Add the message list and composer to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx — `GenAIMessage` items, auto-scroll while the user is at the bottom, "Scroll to latest message" button, accessible name and polite announcements; multiline MUI `TextField` with a hidden label, Enter sends and Shift+Enter inserts a newline, Stop replaces Send while an answer streams, send blocked while the latest answer loads, suggestions menu, guided mode "Ask {1}" menu, `draftMessage` and `conversationError`; the disclaimer `Verify AI-generated content for accuracy.` after the first completed answer (contracts/ui-components.md §4 and §7)
- [X] T016 Port the widget from REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.tsx to packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.tsx and re-export it from packages/react-sdk-components/src/components/widget/GenAICoach/index.tsx (the new UI only; `GenAICoachOld` is not ported) — render nothing unless `PCore.getEnvironmentInfo().isInfinityRuntime()` (research R18), the source's context ID rules (research R9), `useGenAICoachObj`, and `getComponentFromMap('GenAICoachContent')` with `variant={{ placement: 'fullpage' }}` and `allowFullScreen={!isPortalAgent}` (contracts/ui-components.md §2)
- [X] T017 Register `GenAICoach`, `GenAICoachContent`, `GenAIMessage`, `InitialSuggestedMessage` and `AgentRichTextViewer` in packages/react-sdk-components/src/sdk-pega-component-map.js (imports and keys, alphabetical) and map `GenAICoach` to `'widget'` and the others to `'designSystemExtension'` in scripts/override-constants.js (research R16)

### Foundational tests (developer-owned)

- [ ] T018 [P] (developer-owned) Port REF:packages/dx-components/test/unit/utils/message-stream-utils.test.ts to packages/react-sdk-components/tests/unit/components/helpers/message-stream-utils.test.ts, adding a case for questions delivered on a `metadata` ending
- [ ] T019 [P] (developer-owned) Port REF:packages/dx-components/test/unit/utils/hooks/useAgentStreamHandler.test.ts to packages/react-sdk-components/tests/unit/hooks/useAgentStreamHandler.test.ts, with localized system message expectations
- [ ] T020 [P] (developer-owned) Port the link and code cases of REF:packages/dx-components/test/unit/Analytics/ChatThinsight/agent-markdown-renderers.test.tsx to packages/react-sdk-components/tests/unit/components/helpers/agent-markdown-renderers.test.tsx, adding the case links of research R13 (portal case URL with the case key, `caseKey` query parameter, work-ID-only link matched to a conversation case, a link to another server, modified clicks), and port REF:packages/dx-components/test/unit/utils/components/agent-inline-edit-utils.test.ts to packages/react-sdk-components/tests/unit/components/helpers/agent-inline-edit-utils.test.ts; add safety tests (no script execution, unsafe links not clickable, control blocks hidden) in packages/react-sdk-components/tests/unit/components/designSystemExtension/AgentRichTextViewer.test.tsx
- [ ] T021 [P] (developer-owned) Port the base suites of REF:packages/dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx (with `GenAICoach.mock.js`) to packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.test.tsx — rendering, send, agent visibility and switching, starter question, context IDs, "Conversation creation failure (deferred path)" — expecting the message shown during creation and withdrawn on failure (research R6 step 2) — and add no conversation on open, streamed text, Stop, guided mode and any `text/event-stream` content type; also add: switching agent while an answer streams and back restores a sealed answer with Send available (research R6 step 9), a stream ending with a `metadata` frame keeps the answer's ID, a guided agent with Dynamic suggestions offers the "Ask" menu in the empty state, and a case view without agents makes no `updateState` call; the attachment, questionnaire and history suites go to T055, T044 and T049, and the tracing case is not ported
- [ ] T022 [P] (developer-owned) Port REF:packages/cosmos-work/src/components/GenAICoach/mocks/{GenAIMessage,InitialSuggestedMessage,GenAICoach}.test.tsx to packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAIMessage.test.tsx, InitialSuggestedMessage.test.tsx and GenAICoachContent.test.tsx, adapted to the MUI DOM

**Checkpoint**: Shared chat core ready — US1 and US2 can start

---

## Phase 3: User Story 1 - Chat with an AI agent while working on a case (Priority: P1) 🎯 MVP

**Goal**: An agent panel in the case view's utilities column for case types with agents configured

**Independent Test**: Configure an agent on a case type's case view, open a case of that type, expand the panel, ask a question and receive a progressively displayed answer; a case type without agents looks unchanged (quickstart V1–V5, G1)

### Tests for User Story 1 (developer-owned)

- [ ] T023 [P] [US1] (developer-owned) Host tests (renders only with agents; nothing for `[]`, all-hidden, `displayOnlyFA` or a non-Infinity runtime; minimized by default; conversation starts on first maximize; fullscreen dialog; a Tabs region with a `DeferLoad` tab and a `GenAICoach` widget tab without a view `name` renders `DeferLoad` for the first and the widget's own component for the second, research R11) in packages/react-sdk-components/tests/unit/components/template/CaseView/CaseView.test.tsx, adapting the "Test GenAICoach component behavior" cases of REF:packages/cosmos-work/src/components/CaseView/mocks/CaseView.test.tsx; and `TabContent` tests (renders region A's widget, two regions side by side when at least 620px wide and stacked below, label through `FieldGroup` only when `showLabel`, "No items" when all regions are empty, `dynamic` shows region A only) in packages/react-sdk-components/tests/unit/components/template/TabContent/TabContent.test.tsx
- [ ] T024 [P] [US1] (developer-owned) E2E for maximize, ask, stream and Stop on a case with an agent, the agent placed as a case tab, and no change on a case without agents, in packages/react-sdk-components/tests/e2e/Agent/case-view-agent.spec.js

### Implementation for User Story 1

- [X] T025 [US1] Add the `utilities` variant to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx — card with `state` `minimized`/`maximized`, Maximize/Minimize actions with `aria-expanded` calling `onStateChange`, bounded height with internal scrolling (contracts/ui-components.md §4)
- [X] T026 [US1] Add the Fullscreen action (`allowFullScreen`) and the `dialog` variant to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx — MUI `Dialog` showing the same conversation, full screen below the `md` breakpoint, Exit fullscreen, focus returned to the trigger on close (FR-029)
- [X] T027 [US1] Port the case view hosting into packages/react-sdk-components/src/components/template/CaseView/CaseView.tsx from REF:packages/dx-components/src/components/Templates/CaseView/index.jsx (L186–L198, L264–L276) and REF:packages/cosmos-work/src/components/CaseView/CaseView.tsx (L537–L549) — optional `coaches` prop; context ID (data object → `"<pxObjClass> <pyGUID>"`, else the full case ID); `useGenAICoachObj(<coaches only when isInfinityRuntime() and the list is non-empty, else undefined>, contextID, getPConnect(), true, true)`; unless `displayOnlyFA` or no hook result, `getComponentFromMap('GenAICoachContent')` with the hook props, `allowFullScreen` and `variant={{ placement: 'utilities', state, onStateChange }}` (state starting `minimized`) in the right `Grid2` column after the utilities region, as the source places it after the utilities; no other change (contracts/ui-components.md §5.1). Case tabs (research R11): a tab without a view `name` renders its own component; and the tab views App Studio creates need the `TabContent` template, ported to packages/react-sdk-components/src/components/template/TabContent/ from REF:packages/dx-components/src/components/Templates/Tab/TabContent/TabContent.tsx, registered in sdk-pega-component-map.js and scripts/override-constants.js (`'template'`) and added to the View's templates without a header

**Checkpoint**: US1 complete — case view agent works on its own

---

## Phase 4: User Story 2 - Use the application-wide AI assistant (Priority: P1)

**Goal**: An "AI Assistant" navigation entry opening an agent panel beside the page, keeping the conversation across navigation

**Independent Test**: Enable the AI assistant on the portal, open it from the navigation, chat, navigate to another page and confirm the conversation is preserved; hide/show and full/split keep it (quickstart V6–V7, G2, G4)

### Tests for User Story 2 (developer-owned)

- [ ] T028 [P] [US2] (developer-owned) Port the portal-agent cases of REF:packages/dx-components/test/unit/Templates/AppShell/AppShell.test.jsx to packages/react-sdk-components/tests/unit/components/template/AppShell/AppShell.test.tsx (entry only when enabled with agents, initial modes from `aiAssistantWidth`, navigation entry, toggle and hide, page-shown/case-opened/case-created events, startup navigation, WSS branch unchanged) and add the narrow-screen rule; where the source reads `showPageContent` from the context, assert `pagePanel.visible`
- [ ] T029 [P] [US2] (developer-owned) Port REF:packages/cosmos-work/src/components/GenAICoach/mocks/PortalAgentSplitView.test.tsx without the resize cases to packages/react-sdk-components/tests/unit/components/designSystemExtension/PortalAgentSplitView.test.tsx, and add portal-mode cases for the widget (Full width/Split width call `onAgentToggle`, Hide calls `onAgentClick`, the content is wrapped in `PortalAgentSplitView` when `pagePanel` is set) in packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.portal.test.tsx
- [ ] T030 [P] [US2] (developer-owned) E2E for open from navigation, chat, navigate, hide/show and full/split in packages/react-sdk-components/tests/e2e/Agent/app-assistant.spec.js

### Implementation for User Story 2

- [X] T031 [P] [US2] Port REF:packages/dx-components/src/components/Templates/AppShell/PortalAgentContext.ts to packages/react-sdk-components/src/components/helpers/PortalAgentContext.ts (moved there from template/AppShell/ so overrides share one context object), keeping only the members the SDK reads (`showAgentPanel`, `agentExpanded`, `pagePanel`, `onAgentToggle`, `onAgentClick`) with the source's default values (research R12)
- [X] T032 [P] [US2] Implement packages/react-sdk-components/src/components/designSystemExtension/PortalAgentSplitView/PortalAgentSplitView.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/PortalAgentSplitView.tsx without the resize handle — agent region 31.25rem by default and never below 20rem, full width when `agentExpanded`, content rendered from the first show and kept mounted, `aria-hidden`/`inert` when hidden; page region always rendered and hidden when `pagePanel.visible` is false; no side-by-side layout below the `md` breakpoint (contracts/ui-components.md §5.4, FR-029)
- [X] T033 [P] [US2] Add the optional `agent` prop (`{ id, name, icon, active, onClick }`, the Cosmos `AppShell` `agent` shape) to packages/react-sdk-components/src/components/infra/NavBar/NavBar.tsx, rendering one `ListItemButton` after the page list; unchanged when absent; one-line comment explaining the prop (Constitution IV)
- [X] T034 [US2] Port the portal-agent mode into packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.tsx from REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.tsx (L18–L53, L101–L129, L171–L183) — read `PortalAgentContext`, the portal context ID, Full width/Split width (`onAgentToggle`) and Hide (`onAgentClick`) actions with MUI icons, and `getComponentFromMap('PortalAgentSplitView')` around the content when `pagePanel` is set; the reset-width action is not ported
- [X] T035 [US2] Port the portal agent construction into packages/react-sdk-components/src/components/template/AppShell/AppShell.tsx from REF:packages/dx-components/src/components/Templates/AppShell/index.jsx (L133–L143, L218–L251) — widen the `navDisplayOptions` type (`enableAIAgent`, `selectedAgents`, `aiAssistantWidth`) and, in the default (non-WSS) branch only, build the memoised `portalAgentElement` with `PCore.createPConnect({ meta: { type: 'GenAICoach', config: { coaches, isPortalAgent: true } }, options: { context: getPConnect().getContextName(), pageReference: 'pyPortal' } })` rendered with `createPConnectComponent()` (contracts/configuration-inputs.md §2)
- [X] T036 [US2] Port the display state into packages/react-sdk-components/src/components/template/AppShell/AppShell.tsx from REF:packages/dx-components/src/components/Templates/AppShell/index.jsx (L53–L85, L259–L272, L1629–L1681, L1737–L1788) — `getAIAssistantMode`, `getPortalAgentInitialState`, `showAgentPanel`/`showPageContent`/`agentExpanded`, `onAgentClick`, `onAgentToggle`, the `PortalAgentContext` provider with `pagePanel` holding the page content, `portalAgentElement` in the content area, and the `agent` entry passed to `NavBar` (name `localizedVal('AI Assistant', 'AppShell')`, active while shown); the narrow-screen rule; `goToHome` and panel resizing are not ported (data-model.md §10, contracts/ui-components.md §5.2)
- [X] T037 [US2] Port the event handling into packages/react-sdk-components/src/components/template/AppShell/AppShell.tsx from REF:packages/dx-components/src/components/Templates/AppShell/index.jsx (L393–L452) — `SHOW_PAGE_DONE` on `app/primary` (except the startup navigation to the home page: `isAgentInStartupMode`, `homePageRuleName`), `CASE_OPENED` and `CREATE_STAGE_DONE` from `PCore.getConstants().PUB_SUB_EVENTS` via `PCore.getPubSubUtils()` show the page and leave full width (hide instead on narrow screens); unsubscribe on unmount
- [X] T038 [US2] Register `PortalAgentSplitView` in packages/react-sdk-components/src/sdk-pega-component-map.js and map it to `'designSystemExtension'` in scripts/override-constants.js (research R16)

**Checkpoint**: US1 and US2 complete — agreed MVP (case view + application assistant)

---

## Phase 5: User Story 3 - Follow the agent's actions on cases (Priority: P2)

**Goal**: Progress and confirmations for case creation, case opening and assignment work inside the conversation

**Independent Test**: Ask an agent allowed to create cases to create one; watch the progress item, its steps and the confirmation (quickstart V8)

**FR-019** (agent changes to the open case appear without refresh) needs no client code: the engine applies the updates (contracts/engine-genai-assistant.md §7). It is validated by quickstart V8 in T070. The action events themselves are handled by the ported useAgentStreamHandler.ts (T006); this story adds their presentation.

### Tests for User Story 3 (developer-owned)

- [ ] T039 [P] [US3] (developer-owned) Tests for progress rendering (heading, per-step spinner or check with accessible status), the case-created, case-opened and action-failed system messages, and the read-only approval notice in packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAIMessageProgress.test.tsx

### Implementation for User Story 3

- [X] T040 [P] [US3] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessageProgress/GenAIMessageProgress.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessageProgress.tsx — heading "Working on request", per-step spinner or check with accessible status (data-model.md §6)
- [X] T041 [US3] Render progress steps (`progressSteps`, `progressStepsCompleted`) through `getComponentFromMap('GenAIMessageProgress')` and the case-created, case-opened and action-failed system message variants (`caseInfo` label and ID shown as text, as in the source) in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx (data-model.md §5–§6)
- [X] T042 [US3] In place of the source's tool-confirmation flow (left out in T010), add to packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx a read-only coach message carrying the confirmation text and `Action approval is not available in this application.` when a complete or final streamed response contains `toolsNeedConfirmation` (research R7)
- [X] T043 [US3] Register `GenAIMessageProgress` in packages/react-sdk-components/src/sdk-pega-component-map.js and map it to `'designSystemExtension'` in scripts/override-constants.js

**Checkpoint**: US3 works in either host

---

## Phase 6: User Story 4 - Answer questions the agent asks (Priority: P2)

**Goal**: Inline quick choices and a step-by-step form for the agent's structured questions

**Independent Test**: Use an agent that asks a clarifying question, answer it, and confirm the agent continues (quickstart V9)

### Tests for User Story 4 (developer-owned)

- [ ] T044 [P] [US4] (developer-owned) Port REF:packages/cosmos-work/src/components/GenAICoach/mocks/Questionnaire.test.tsx to packages/react-sdk-components/tests/unit/components/designSystemExtension/Questionnaire.test.tsx, and the "Questionnaire submission" and "Questionnaire from conversation history API" suites of REF:packages/dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx (inline choices, answer payload, restore from history) to packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.questionnaire.test.tsx

### Implementation for User Story 4

- [X] T045 [US4] Port the questionnaire logic in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — `questionnaireData` from `questionnaireProvided` at stream end with `applyQuestionnaireDefaults` and the `inline` rule (one single-choice question with three or fewer options), `pendingQuestionnaire` cached with the conversation, `onQuestionnaireDismiss`, clearing on send and Stop, answers sent as `questionnaire.questions[{ field, type, questionText, selectedItems[{ key, label }] }]` on the streamed path, restore with `parseQuestionnaireFromHistory` (research R8; contracts/engine-genai-assistant.md §2.1)
- [X] T046 [P] [US4] Implement packages/react-sdk-components/src/components/designSystemExtension/Questionnaire/Questionnaire.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/Questionnaire.tsx — card with Dismiss, one question per step with Previous/Next and "{1} of {2}", radios for single and checkboxes for multiple choice, up to five options listed, otherwise four plus a searchable "Other" `Autocomplete`, answers reported through `onChange`
- [X] T047 [US4] Show `getComponentFromMap('Questionnaire')` above the composer for non-inline question sets and include the form answers on send in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx, with inline choices as follow-up suggestions on the latest message in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx; focus returns to the composer on dismiss
- [X] T048 [US4] Register `Questionnaire` in packages/react-sdk-components/src/sdk-pega-component-map.js and map it to `'designSystemExtension'` in scripts/override-constants.js

**Checkpoint**: US4 works in either host

---

## Phase 7: User Story 5 - Revisit past conversations and start new ones (Priority: P3)

**Goal**: History grouped by recency, reopening a conversation, and New chat

**Independent Test**: Hold two conversations, open history, reopen the first and continue it; start a new chat (quickstart V10)

### Tests for User Story 5 (developer-owned)

- [ ] T049 [P] [US5] (developer-owned) Port the history cases of REF:packages/dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx ("GenAICoach messages history", "Render coach history", "Render coach history with attachments") to packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.history.test.tsx and add `groupByUpdatedOn` grouping, paging (size 20, end detection), New chat and the history layout (side by side in `fullpage`/`dialog` when wide, otherwise replacing the conversation); also start from an empty `history` in the engine-store mock and expect the fetched conversations on the first open and page 2 after load more (the source's mock pre-fills `history`, so it does not cover research R6 step 6), and a failed history request that shows an error; also cover opening another conversation while an answer streams (the stream is cancelled and nothing is added to the opened conversation) and New chat after only reopening past conversations (the configuration is fetched again, research R6 step 4); test the list in packages/react-sdk-components/tests/unit/components/designSystemExtension/ConversationHistory.test.tsx

### Implementation for User Story 5

- [X] T050 [US5] Port history in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — `groupByUpdatedOn` (Today, Previous 7 Days, Previous 30 Days via `getLocalizationService().getLocalizedText`; month name in the current year; year otherwise), `getConversationsForAgent`/`getConversations` with page size 20 from index 1, the `conversationHistory` props (`data`, `loading`, `error`, `loadMore`, `onItemClick`, `selectedItemId`, `onDismiss`), the Your chats action, refetch after a send or rating (data-model.md §4)
- [X] T051 [US5] Port loading a past conversation in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — cache first, otherwise `getMessagesForAgent`/`getMessages`; message mapping per contracts/engine-genai-assistant.md §5 (USER including `ANSWER` labels, ASSISTANT with `messageID`, `isLiked`, `aiGuidedQuestions`, SYSTEM case events, `UI_INSIGHT` as agent text, attachments, last-message questionnaire and approval notice); it becomes the current conversation, and a failure shows the response's error (or the fallback text) while keeping the current conversation (FR-016)
- [X] T052 [US5] Port `onNewChat` in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx, resetting to the configured empty state from cached configuration and creating the conversation on the next send instead of immediately (deviation, research R6 step 4)
- [X] T053 [P] [US5] Implement packages/react-sdk-components/src/components/designSystemExtension/ConversationHistory/ConversationHistory.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/ConversationHistory.tsx — "Your chats" header with Back, grouped sections, selected item, loading/empty/error states, `IntersectionObserver` load more, Enter selects, focus moved to Back when opened
- [X] T054 [US5] Add New chat and the history layout to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx — `getComponentFromMap('ConversationHistory')` side by side when wide in `fullpage` or `dialog`, otherwise replacing the conversation and closing on select; register `ConversationHistory` in packages/react-sdk-components/src/sdk-pega-component-map.js and scripts/override-constants.js (`'designSystemExtension'`)

**Checkpoint**: US5 works in either host

---

## Phase 8: User Story 6 - Attach files to a message (Priority: P3)

**Goal**: Attach, upload, preview and send files with messages (agents only)

**Independent Test**: Attach a file, send a message, and confirm the message lists the attachment; try a file over the limit (quickstart V10)

### Tests for User Story 6 (developer-owned)

- [ ] T055 [P] [US6] (developer-owned) Port the "Upload attachment in agent" suite and the "should send message with attachment" case of REF:packages/dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx to packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.attachments.test.tsx and add the size limit (default 3 MB), replacement on new selection, progress capped at 99, send blocked while uploading or in error, payload items, removal, preview of a pending file, and sent attachments with preview and download

### Implementation for User Story 6

- [X] T056 [US6] Port attachments in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — `onAddAttachment` with `validateMaxSize` from packages/react-sdk-components/src/components/helpers/attachmentShared.ts and `getMaxAttachmentSize()` (default 3), replacement of the previous selection, `PCore.getAttachmentUtils().uploadAttachment` with progress capped at 99, `File is too big. Max allowed size is {1}MB.`, removal, the `Please wait for the attachments to finish uploading.` send guard, `{ type: 'File', category: 'File', fileName, ID }` payload items, cleared after send; agents only; the Cosmos lightbox is not ported (previews in T057 and T058)
- [X] T057 [US6] Add the attach button with a visually hidden file input (same pattern as packages/react-sdk-components/src/components/widget/Attachment/Attachment.tsx) and the pending attachment list (name, progress, error, remove, and a preview that opens the local file through an object URL revoked on removal; data-model.md §8) to the composer in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx
- [X] T058 [US6] Show sent attachments on user messages in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx with preview and download through `PCore.getAttachmentUtils().downloadAttachment` and `fileDownload` from packages/react-sdk-components/src/components/widget/Attachment/AttachmentUtils.ts

**Checkpoint**: US6 works in either host

---

## Phase 9: User Story 7 - Rate agent answers (Priority: P3)

**Goal**: Like or dislike answers with an optional comment

**Independent Test**: Like one answer and dislike another with a comment; reopen the conversation and see both ratings (quickstart V10)

### Tests for User Story 7 (developer-owned)

- [ ] T059 [P] [US7] (developer-owned) Tests for like/dislike calls, comment submission, revert on failure, hidden for coaches and `turnOffFeedback`, last completed answer only in packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAIMessageFeedback.test.tsx

### Implementation for User Story 7

- [X] T060 [US7] Port feedback in packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx — `feedback` on the last completed coach message of each answer for agents without `turnOffFeedback` (`reaction`, `onReaction` via `likeAgentMessage`/`unLikeAgentMessage`, `onFeedbackComplete` with the optional comment), revert on failure, history refetch
- [X] T061 [P] [US7] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessageFeedback/GenAIMessageFeedback.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessageFeedback.tsx — Good/Bad response toggles with `aria-pressed`, optional comment dialog on dislike (Enter submits), selected status after rating, focus returned to the control
- [X] T062 [US7] Render `getComponentFromMap('GenAIMessageFeedback')` in the actions row of completed coach messages in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx and register `GenAIMessageFeedback` in packages/react-sdk-components/src/sdk-pega-component-map.js and scripts/override-constants.js (`'designSystemExtension'`)

**Checkpoint**: All user stories independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Quality passes across all stories

- [X] T063 [P] Accessibility pass over the agent component folders in packages/react-sdk-components/src/components/designSystemExtension/ (icon button labels, `aria-expanded`/`aria-pressed`, polite announcements, focus return after send/Stop/dismiss/history, reduced motion) per contracts/ui-components.md §7
- [X] T064 Localization pass over packages/react-sdk-components/src/components/widget/GenAICoach/, the agent components in packages/react-sdk-components/src/components/designSystemExtension/, packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx and packages/react-sdk-components/src/hooks/useAgentStreamHandler.ts: every UI string goes through `localizedVal(text, localeCategory)` or the source's `getLocalizationService().getLocalizedText`, with Cosmos keys replaced by their English values from REF:packages/cosmos-core/src/i18n/default.ts (contracts/ui-components.md §6)
- [X] T065 [P] Security review of packages/react-sdk-components/src/components/designSystemExtension/AgentRichTextViewer/AgentRichTextViewer.tsx and packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx against contracts/ui-components.md §8 (no HTML strings, protocol allowlist, `rel="noopener noreferrer"`)
- [X] T066 Port-fidelity review: compare each ported file with its REF source (research.md Port map) and confirm that only the adaptations of research R15 and the commented deviations differ, with no `@pega/cosmos-*` imports and no copyright header
- [X] T067 Performance pass in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx and packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx (memoise completed messages, one state update per network chunk)
- [X] T068 Run `npm run build-sdk` and `npm run lint` from the repository root and fix issues in the files touched by this feature (the widget folder, the agent design-system components, the two hooks, the two helpers, CaseView.tsx, AppShell.tsx, PortalAgentContext.ts, NavBar.tsx)
- [X] T069 Run `npm run build-overrides` and confirm the generated overrides package includes `GenAICoach` and its registered sub-components via the mappings in scripts/override-constants.js, and that rewritten imports resolve: the Cosmos types and utils in `lib/components/designSystemExtension/GenAICoachContent/`, the widget types in `lib/components/widget/GenAICoach/`, helpers in `lib/components/helpers/`, `PortalAgentContext` and `StreamingContext` in `lib/components/helpers/`, hooks in `lib/hooks/` (do not edit generated output)
- [ ] T070 (developer-owned) Run specs/001-ai-agent-assistant/quickstart.md (pre-checks, V1–V14, G1–G4, S1, A1–A2, L1, N1, and the parity and timing checks PT1–PT2 for SC-002 and SC-003) and record verification outcomes U1–U6 in specs/001-ai-agent-assistant/research.md
- [ ] T071 (developer-owned) Run the existing portal and embedded E2E suites packages/react-sdk-components/tests/e2e/MediaCo/portal.spec.js and packages/react-sdk-components/tests/e2e/MediaCo/embedded.spec.js to confirm no regressions (Constitution IV)
- [ ] T072 (developer-owned) Run Jest with coverage (`npx jest --coverage --watchAll=false` with jest.config.js) on the feature branch and on `main`, and confirm coverage does not drop below `main` (Constitution VI); record the numbers in specs/001-ai-agent-assistant/research.md

---

## Phase 11: User Story 8 - Use an agent on an application page (Priority: P2, added later)

**Goal**: Agents configured on landing pages (dashboards, lists and other pages) are offered from the page's utilities strip, as in the standard portal (spec FR-030, research R21)

**Independent Test**: Quickstart V14

### Tests for User Story 8 (developer-owned)

- [ ] T073 [P] [US8] (developer-owned) `UtilitiesLayout` tests in packages/react-sdk-components/tests/unit/components/designSystemExtension/UtilitiesLayout.test.tsx (collapsed strip with the "Chat with AI" button; the button opens the agent in the `dialog` placement without blocking the page (the page scrolls and receives clicks), Escape and Close close it and return focus, Tab stays within it, an outside click closes it but a click in the agent's own menus or fullscreen dialog does not; expanded column at lg with `isInLandingPageUtilities`; drawer between md and lg; agent full page below md) and page template tests in packages/react-sdk-components/tests/unit/components/template/LandingPageAgents.test.tsx (each page template is unchanged without `coaches` or outside the Infinity runtime, and with agents calls `useGenAICoachObj` with the page's `localeReference` and `isLandingPage`, rendering the utilities column after the page)
- [ ] T074 [P] [US8] (developer-owned) E2E for a landing page with an agent (open from the button, ask, close and reopen with the conversation kept, expand the utilities) in packages/react-sdk-components/tests/e2e/Agent/landing-page-agent.spec.js

### Implementation for User Story 8

- [X] T075 [US8] Port the `isLandingPage` parameter of REF:packages/dx-components/src/utils/hooks/useGenAICoachObj.tsx (the `landingpage` cache namespace) to packages/react-sdk-components/src/hooks/useGenAICoachObj.tsx
- [X] T076 [P] [US8] Port REF:packages/cosmos-work/src/components/UtilitiesLayout/UtilitiesLayout.tsx (with the anchored `UtilitySummaryItemDialog` of REF:packages/cosmos-work/src/components/CaseView/) to packages/react-sdk-components/src/components/designSystemExtension/UtilitiesLayout/ (MUI `Fab`, a non-modal `Popper` and persistent `Drawer`; strings per contracts/ui-components.md §6) and register it in sdk-pega-component-map.js and scripts/override-constants.js (`'designSystemExtension'`)
- [X] T077 [US8] In packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx and GenAICoach.types.ts, add the Close button of the `dialog` placement, mark the panel's fullscreen copy with `isFullscreenView` (Exit fullscreen and side-by-side history only there), and add `isInLandingPageUtilities` (the agent fills the utilities column)
- [X] T078 [US8] Add `usePageGenAICoach` and `withPageUtilities` to packages/react-sdk-components/src/components/template/utils.tsx and use them in the DefaultPage (grid and banner), InlineDashboardPage, ListPage, BannerPage, OneColumnPage, TwoColumnPage, NarrowWidePage and WideNarrowPage templates, ported from the agent hosting of REF:packages/dx-components/src/components/Templates/PageLayout/DefaultPage/index.tsx, PageLayout/InlineDashboardPage/index.jsx and ListPage/index.jsx (contracts/ui-components.md §5.5)

**Checkpoint**: Agents configured on landing pages are available in the SDK application

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–9)**: Depend on Foundational
  - US1 and US2 (both P1, the agreed MVP) can proceed in parallel; US1 edits GenAICoachContent.tsx and CaseView.tsx, US2 edits GenAICoach.tsx, AppShell.tsx and NavBar.tsx, and both touch the registration files, so coordinate if two people work at once
  - US3–US7 need a host to be visible, so start them after US1 or US2; each is otherwise independent
- **Polish (Phase 10)**: After the desired stories are complete

### User Story Dependencies

- **US1 (P1)**: Foundational only
- **US2 (P1)**: Foundational only
- **US3 (P2)**: Foundational; validated through US1 or US2
- **US4 (P2)**: Foundational; validated through US1 or US2
- **US5 (P3)**: Foundational; its history mapping also restores fields used by US3/US4/US6/US7, which stay inert if those stories are not implemented
- **US6 (P3)**: Foundational; validated through US1 or US2
- **US7 (P3)**: Foundational; validated through US1 or US2
- **US8 (P2, added later)**: Foundational; independent of the other hosts (its own page templates and `UtilitiesLayout`)

### Within Each Story

- Hook ports (useGenAICoachObj.tsx, useAgentStreamHandler.ts) before the components that consume them
- Tasks editing the same file (useGenAICoachObj.tsx, GenAIMessage.tsx, GenAICoachContent.tsx, GenAICoach.tsx, AppShell.tsx) run in ID order
- Tasks that register a component (T017, T038, T043, T048, T054, T062) edit sdk-pega-component-map.js and scripts/override-constants.js; coordinate when stories run in parallel
- Developer-owned test tasks can be written at any point in the story

### Parallel Opportunities

- Foundational: T004–T008 in parallel after T003; T012 and T013 in parallel; T018–T022 in parallel
- US1: T023 and T024 in parallel
- US2: T031, T032 and T033 in parallel; T028–T030 in parallel
- US3: T040 alongside T042
- US4: T046 alongside T045
- US5: T053 alongside T050–T052
- US7: T061 alongside T060
- Polish: T063 and T065 in parallel; T064 after T063 (same files)

---

## Parallel Example: Foundational

```bash
# After T003 (types):
Task: "Port GenAICoach.utils.ts to .../designSystemExtension/GenAICoachContent/GenAICoach.utils.ts"                    # T004
Task: "Port message-stream-utils.ts to .../components/helpers/message-stream-utils.ts"            # T005
Task: "Port useAgentStreamHandler.ts to .../hooks/useAgentStreamHandler.ts"                       # T006
Task: "Port agent-markdown-renderers.tsx to .../components/helpers/agent-markdown-renderers.tsx"  # T007
Task: "AgentRichTextViewer/AgentRichTextViewer.tsx"                                               # T008

# UI pieces in parallel:
Task: "InitialSuggestedMessage/InitialSuggestedMessage.tsx"   # T012
Task: "GenAIMessage/GenAIMessage.tsx"                         # T013
```

## Parallel Example: User Story 1

```bash
Task: "CaseView host tests in .../tests/unit/components/template/CaseView/CaseView.test.tsx"   # T023
Task: "Case view agent E2E in .../tests/e2e/Agent/case-view-agent.spec.js"                     # T024
```

## Parallel Example: User Story 2

```bash
Task: "Port PortalAgentContext.ts to .../helpers/PortalAgentContext.ts"   # T031
Task: "PortalAgentSplitView/PortalAgentSplitView.tsx"                                # T032
Task: "agent prop in .../infra/NavBar/NavBar.tsx"                                    # T033
```

## Parallel Example: User Stories 3–7

```bash
Task: "GenAIMessageProgress/GenAIMessageProgress.tsx"   # T040 (US3)
Task: "Questionnaire/Questionnaire.tsx"                 # T046 (US4)
Task: "ConversationHistory/ConversationHistory.tsx"     # T053 (US5)
Task: "GenAIMessageFeedback/GenAIMessageFeedback.tsx"   # T061 (US7)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1 → validate with quickstart V1–V5 and G1
4. Phase 4 US2 → validate with quickstart V6–V7, G2 and G4
5. Stop and demo: case view agent and application assistant

### Incremental Delivery

1. Setup + Foundational → ported chat core ready
2. US1 → demo (case view)
3. US2 → demo (application assistant) — agreed MVP complete
4. US3 and US4 (P2) → agent actions and questions
5. US5, US6, US7 (P3) → history, attachments, ratings
6. Polish → quickstart run and regression suites

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Developer A: US1 then US3; Developer B: US2 then US4
3. US5–US7 split afterwards; coordinate edits to useGenAICoachObj.tsx, GenAIMessage.tsx, GenAICoachContent.tsx, sdk-pega-component-map.js and scripts/override-constants.js

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks
- Port from the REF source file named in each task and keep its names and comments (research R15)
- `/speckit-implement` must skip tasks tagged (developer-owned)
- Do not edit generated output (`lib/`, `dist/`, the overrides package)
- Keep host changes inert when no agent is configured (Constitution III)
- Stop at any checkpoint to validate a story independently
