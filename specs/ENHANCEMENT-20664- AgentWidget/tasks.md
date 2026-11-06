---

description: "Task list for AI Agent Experience in Case View and Application Pages (Infinity '25)"
---

# Tasks: AI Agent Experience in Case View and Application Pages (Infinity '25)

**Input**: Design documents from `/specs/001-ai-agent-assistant/`

**Prerequisites**: plan.md, spec.md

**Tests**: Required by Constitution VI. Test tasks are tagged **(developer-owned)**: the developer writes and runs them. Git branches, commits and pull requests are also done by the developer.

**Approach**: Port from `constellation-frontend` at `release/25.1.5` (commit `59ee8ec177`) the way existing SDK components were ported. Keep file names, function names, logic and comments. Replace Cosmos components with MUI v6 (`makeStyles`), reusing the MUI components of the '26 port aligned with the '25 contract; turn Cosmos `t('<key>')` strings into `localizedVal(<English value>, localeCategory)`; cast at the call site where the 4.1 typings lack an API; leave out the features that are not ported (voice input, the AI tracer, the lightbox preview and the legacy `GenAICoachOld` widget); do not copy the source's copyright header. Mark each deliberate deviation with a one-line `Deviation from Constellation:` comment. Paths prefixed with `REF:` are in `constellation-frontend`.

**Status**: Implementation tasks are complete on `agent-poc-25`. Open tasks are the developer-owned tests and the open items T027, T028 and T045.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story from spec.md (US1–US5)
- Paths are relative to the repository root. The widget folder is `packages/react-sdk-components/src/components/widget/GenAICoach/`; the ported hook goes to `packages/react-sdk-components/src/hooks/` and ported utilities to `packages/react-sdk-components/src/components/helpers/`.
- Each ported Cosmos component is a design system extension component, like the SDK's other Cosmos clones (for example `WssQuickCreate`, used by the `QuickCreate` widget): its own folder `packages/react-sdk-components/src/components/designSystemExtension/<Name>/` with `<Name>.tsx` and an `index.tsx` re-export, named after the Constellation component it ports, registered in the component map, and rendered through `getComponentFromMap` (Constitution II and VIII).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency and folder skeleton

- [X] T001 Add `marked` (`^15.0.6`, the range of the '25 Cosmos rich text viewer) to `dependencies` in packages/react-sdk-components/package.json and in the root package.json, then run `npm install` from the repository root
- [X] T002 Create packages/react-sdk-components/src/components/widget/GenAICoach/config-ext.json with `name: "GenAICoach"`, `label: "Agent"`, `description: "Agent"`, `type: "Widget"`, `subtype: "CASE"`, `properties: []`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The ported chat core used by every placement — case view and agent tabs (US1) and pages (US2)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Port the types, keeping the source's split: REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.types.ts to packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.types.ts (engine types declared locally, `StreamResponse` for the Axios response, legacy-only types left out) and the in-scope types of REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.types.ts to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoach.types.ts (`GenAICoachContentProps` without lightbox and voice props, with `toastMessage`/`onToastClose`; local stand-ins for the Cosmos core prop types); move `StreamingContext` from REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessage.tsx (L38–L47) to packages/react-sdk-components/src/components/helpers/StreamingContext.ts
- [X] T004 [P] Port REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.utils.ts to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoach.utils.ts (`isCoachMessage`, `isUserMessage`, `isInUtilities`, `copyToClipboard`, plus local stand-ins for `createUID` and `isMenuGroupProps`)
- [X] T005 [P] Port REF:packages/dx-components/src/utils/message-stream-utils.ts unchanged to packages/react-sdk-components/src/components/helpers/message-stream-utils.ts (`handleMessageStream`, `isErrorResponse`), with a local `tryCatch` and the `StreamResponse` type
- [X] T006 [P] Port REF:packages/dx-components/src/utils/components/agent-markdown-renderers.tsx to packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx as `createAgentMarkdownMap({ getPConnect })` with the source's `text` renderer (hides `###` tokens while streaming and complete follow-up-question blocks afterwards), reading `StreamingContext` (T003)
- [X] T007 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/AgentRichTextViewer/AgentRichTextViewer.tsx (plus `index.tsx`): `marked` lexer tokens rendered as MUI elements (no HTML strings; `html` tokens as plain text), `markdownMap` overrides per token type, capped headings, scrollable tables and code blocks
- [X] T008 Port the foundation of REF:packages/dx-components/src/utils/hooks/useGenAICoachObj.ts to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — signature `(coaches, caseID, pConnect, isCaseView, utilitiesExpanded)`, coach options with the visibility filter and the "configuration incomplete" result, the `genAICoach` engine-store cache with no writes for hosts without agents (deviation), `startConversation` creating the conversation on open and `handleConversationResponse` (welcome message, disclaimer, guided mode, streaming flag, suggestions, initial instruction, recommendation messages), and the cache reused only with its conversation (deviation)
- [X] T009 Port sending to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — `onSend` (prompt instructions, attachments), `callSendMessage` for agents and coaches with `handleMessageStream`, `updateMessagesWithResponse` (stream chunks, final JSON, `metadata` endings, stale-response guard), `updateMessagesWithError` and `handleStreamingProgress`
- [X] T010 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessage.tsx — user messages with attachments; agent messages with streaming content inside `StreamingContext`, loading and error states, the feedback slot, message actions (icon buttons for known icons such as `copy`) and follow-up suggestions; sub-components through `getComponentFromMap`
- [X] T011 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessageProgress/GenAIMessageProgress.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessageProgress.tsx — "Thinking", "Analyzing data sources", "Generating response", "Double checking results" and "Finalizing response" with the source's timings
- [X] T012 [P] Implement packages/react-sdk-components/src/components/designSystemExtension/InitialSuggestedMessage/InitialSuggestedMessage.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/InitialSuggestedMessage.tsx
- [X] T013 Implement packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.tsx — header with the agent switcher and one "Actions" menu (hook actions, Fullscreen, Minimize), the `utilities`, `fullpage` and `dialog` placements, empty state, messages with the disclaimer message, message box (suggestions menu, attachments, Send or "Generating response"), the guided "Ask" menu after the first answer, the AI notice, scroll-to-latest, polite announcements, the fullscreen `Dialog` sharing the typed text, and the copy `Snackbar`
- [X] T014 Register `GenAICoach`, `AgentRichTextViewer`, `ConversationHistory`, `GenAICoachContent`, `GenAIMessage`, `GenAIMessageFeedback`, `GenAIMessageProgress`, `InitialSuggestedMessage` and `UtilitiesLayout` in packages/react-sdk-components/src/sdk-pega-component-map.js and scripts/override-constants.js

### Foundational tests (developer-owned)

- [ ] T015 [P] (developer-owned) Port REF:packages/dx-components/test/unit/utils/message-stream-utils.test.ts (8 cases) to packages/react-sdk-components/tests/unit/components/helpers/message-stream-utils.test.ts
- [ ] T016 [P] (developer-owned) Port REF:packages/cosmos-work/src/components/GenAICoach/mocks/GenAIMessage.test.tsx and InitialSuggestedMessage.test.tsx to packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAIMessage.test.tsx and InitialSuggestedMessage.test.tsx, adding the Copy action and the progress texts
- [ ] T017 [P] (developer-owned) Port REF:packages/cosmos-work/src/components/GenAICoach/mocks/GenAICoach.test.tsx (36 cases) to packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAICoachContent.test.tsx with expectations for the one "Actions" menu, the disclaimers and the copy Snackbar; add safety tests for answers with scripts, embedded pages and unsafe links in packages/react-sdk-components/tests/unit/components/designSystemExtension/AgentRichTextViewer.test.tsx

**Checkpoint**: Chat core ready — the case view, agent tabs and pages can host the agent.

---

## Phase 3: User Story 1 - Chat with an AI agent while working on a case (Priority: P1) 🎯 MVP

**Goal**: Agent panel in the case view and agents in the case's tabs: start on expand, progressive answers, formatted content, case links in the application, Copy, guided use, agent switching, fullscreen.

**Independent Test**: Configure an agent on a case type's case view, open a case of that type, expand the panel, ask a question and receive a progressively displayed answer.

### Tests for User Story 1 (developer-owned)

- [ ] T018 [P] [US1] (developer-owned) Port REF:packages/dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx (with `GenAICoach.mock.js`, 20 cases) to packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.test.tsx, covering the cache reuse deviation (a remounted host with a cached configuration but no conversation creates one); add `CaseView` host tests (panel only with visible agents, nothing for `[]` or all hidden, minimized by default, conversation on first maximize, agent tabs and `DeferLoad` tabs) in packages/react-sdk-components/tests/unit/components/template/CaseView/CaseView.agent.test.tsx
- [ ] T019 [P] [US1] (developer-owned) Case-link tests in packages/react-sdk-components/tests/unit/components/helpers/agent-markdown-renderers.test.tsx — case key in the link, `caseKey` query parameter, `+` for the key's space, semantic URLs resolved through a mocked `getResolvedSemanticURL` and `getCaseTypeList` for a route per case type, generic `cases/{workID}` routes and a single case route, the application's root URL, link to another server, relative link, a rejected `openWorkByHandle` (new tab), modified clicks, unsafe protocols
- [ ] T020 [P] [US1] (developer-owned) E2E for expand, ask, stream, Copy, case link and guided agent on a case with an agent, the agent tab, and no change on a case without agents, in packages/react-sdk-components/tests/e2e/Agent/case-view-agent.spec.js

### Implementation for User Story 1

- [X] T021 [US1] Port the case view hosting into packages/react-sdk-components/src/components/template/CaseView/CaseView.tsx from REF:packages/dx-components/src/components/Templates/CaseView/index.jsx (L146, L213–L219, L867): optional `coaches` prop, context ID, `useGenAICoachObj(coaches.length ? coaches : undefined, contextID, getPConnect(), true, true)`, `GenAICoachContent` after the utilities region with `allowFullScreen` and the `utilities` variant starting minimized
- [X] T022 [US1] Render tabs without a view name in packages/react-sdk-components/src/components/template/CaseView/CaseView.tsx with their own component in a card keyed by tab (tabs with a name keep `DeferLoad`), with the label falling back to `getTabLabel` from packages/react-sdk-components/src/components/template/SubTabs/tabUtils.ts
- [X] T023 [US1] Port REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.tsx and `index.tsx` to packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.tsx and `index.tsx`: context ID rule, `useGenAICoachObj(coaches, contextID, getPConnect())`, `GenAICoachContent` with `variant={{ placement: 'fullpage' }}`; the legacy `GenAICoachOld` branch is not ported
- [X] T024 [US1] Port `agent-inline-edit-utils.ts` from REF:packages/dx-components/src/utils/components/ at `release/26.1.2` to packages/react-sdk-components/src/components/helpers/agent-inline-edit-utils.ts and add the link renderer to packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx (deviation): safe protocols only; a plain left click on a link to a case of the application opens it with `openWorkByHandle`, with the case key taken from the link or resolved from the case's semantic URL through `getResolvedSemanticURL` over `getCaseTypeList()`; case links recognised by case query parameters, relative links or the Infinity server's host name; other links and modified clicks open a new tab
- [X] T025 [US1] Add the Copy action to agent messages in packages/react-sdk-components/src/hooks/useGenAICoachObj.ts (`buildMessageActions`, `handleCopyResponse`, `toastMessage`/`onToastClose` instead of the Cosmos toaster) and pass the toast props through packages/react-sdk-components/src/components/widget/GenAICoach/GenAICoach.tsx
- [X] T026 [US1] Port agent switching (`onCoachChange`), `onStateChange` and `onOpen` to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts
- [ ] T027 [US1] Give each agent placement its own session cache namespace in packages/react-sdk-components/src/hooks/useGenAICoachObj.ts (`genAICoach.<instanceId>`, as 26.1 does), so the case's agent panel and an agent in one of its tabs keep separate conversations
- [ ] T028 [US1] Decide the header actions layout of packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx: keep one "Actions" menu, or show Minimize and Fullscreen as buttons as the '25 portal does

**Checkpoint**: User Story 1 is usable on its own (MVP) once T027 is done; T028 is a layout decision.

---

## Phase 4: User Story 2 - Use an agent on an application page (Priority: P2)

**Goal**: Page agents from a "Chat with AI" button and the expanded utilities, and agent widgets placed on pages.

**Independent Test**: Configure an agent on a landing page, open the page, open the agent from the button and ask a question.

### Tests for User Story 2 (developer-owned)

- [ ] T029 [P] [US2] (developer-owned) Port REF:packages/cosmos-work/src/components/UtilitiesLayout/mocks/UtilitiesLayout.test.tsx (4 cases) to packages/react-sdk-components/tests/unit/components/designSystemExtension/UtilitiesLayout.test.tsx, adding the non-modal dialog (page stays usable, Escape, click outside); add page-template tests with and without agents in packages/react-sdk-components/tests/unit/components/template/PageAgents.test.tsx
- [ ] T030 [P] [US2] (developer-owned) E2E for "Chat with AI" on a landing page, the expanded utilities, an agent widget on a page, and pages without agents, in packages/react-sdk-components/tests/e2e/Agent/page-agent.spec.js

### Implementation for User Story 2

- [X] T031 [P] [US2] Add packages/react-sdk-components/src/components/designSystemExtension/UtilitiesLayout/UtilitiesLayout.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/UtilitiesLayout/UtilitiesLayout.tsx reused from the '26 port (the source is identical): strip, "Chat with AI" button, non-modal anchored dialog, expanded column and drawer, in-page agent below md (FR-025)
- [X] T032 [US2] Add `usePageGenAICoach` and `withPageUtilities` to packages/react-sdk-components/src/components/template/utils.tsx
- [X] T033 [US2] Host page agents in packages/react-sdk-components/src/components/template/DefaultPage/DefaultPage.tsx (grid and banner layouts), InlineDashboardPage/InlineDashboardPage.tsx, ListPage/ListPage.tsx, BannerPage/BannerPage.tsx, OneColumn/OneColumnPage/OneColumnPage.tsx, TwoColumn/TwoColumnPage/TwoColumnPage.tsx, NarrowWide/NarrowWidePage/NarrowWidePage.tsx and WideNarrow/WideNarrowPage/WideNarrowPage.tsx under packages/react-sdk-components/src/components/template/: optional `coaches` and `localeReference` props, `usePageGenAICoach`, `withPageUtilities` (REF:packages/dx-components/src/components/Templates/PageLayout/DefaultPage/index.tsx L84, L123, L135; PageLayout/InlineDashboardPage/index.jsx L76, L188; ListPage/index.jsx L40, L78)

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Revisit past conversations and start new ones (Priority: P3)

**Goal**: History grouped by recency with paging, reopening past conversations, New chat.

**Independent Test**: Hold two conversations, open history, reopen the first one and continue it.

### Tests for User Story 3 (developer-owned)

- [ ] T034 [P] [US3] (developer-owned) History tests in packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.history.test.tsx — `groupByUpdatedOn` grouping, paging (size 20, end detection, next page from the loaded count), the first open with an empty engine-store history, load errors without details, reopening from the cache and from the platform, Back, New chat — and the list in packages/react-sdk-components/tests/unit/components/designSystemExtension/ConversationHistory.test.tsx

### Implementation for User Story 3

- [X] T035 [US3] Port history to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — `updateHistoryData`, `handleHistoryData`, `groupByUpdatedOn`, the History action and the `conversationHistory` props, with the deviations (render from state, gate on state, next page from the loaded count, `handleLoadError`)
- [X] T036 [US3] Port opening past conversations to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — `fetchMessagesForConversation` and `handleFetchMessagesForConversation` with the history message mapping
- [X] T037 [US3] Port the New chat action to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts (a new conversation at once)
- [X] T038 [P] [US3] Implement packages/react-sdk-components/src/components/designSystemExtension/ConversationHistory/ConversationHistory.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/ConversationHistory.tsx — Back button and "History" title, grouped list, selected item, load-more sentinel, loading, empty and error states

**Checkpoint**: History works for every placement.

---

## Phase 6: User Story 4 - Attach files to a message (Priority: P3)

**Goal**: Upload with progress, size limit, preview and removal before sending, download after sending.

**Independent Test**: Attach a file, send a message referencing it, and confirm the message shows the attachment.

### Tests for User Story 4 (developer-owned)

- [ ] T039 [P] [US4] (developer-owned) Attachment tests in packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.attachments.test.tsx — upload progress, size error shown (deviation), send blocked while uploading, preview and removal before sending, download of sent attachments, send payload

### Implementation for User Story 4

- [X] T040 [US4] Port attachments to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — `onAddAttachment`, `onUploadProgress`, the size check with the error always set (deviation), the send payload, and downloads for sent and history attachments instead of the lightbox
- [X] T041 [US4] Add the attachment UI to packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx (Add attachment button with a hidden file input, pending list with progress, errors, Preview and Remove) and the sent attachment chips to packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx

**Checkpoint**: Attachments work on the agent path.

---

## Phase 7: User Story 5 - Rate agent answers (Priority: P3)

**Goal**: Like and dislike with an optional comment, kept when the conversation is reopened.

**Independent Test**: Like one answer and dislike another with a comment, then reopen the conversation and see both ratings.

### Tests for User Story 5 (developer-owned)

- [ ] T042 [P] [US5] (developer-owned) Rating tests in packages/react-sdk-components/tests/unit/components/designSystemExtension/GenAIMessageFeedback.test.tsx, and the hook's like and dislike calls in packages/react-sdk-components/tests/unit/components/widget/GenAICoach/GenAICoach.feedback.test.tsx

### Implementation for User Story 5

- [X] T043 [US5] Port ratings to packages/react-sdk-components/src/hooks/useGenAICoachObj.ts — `handleReaction`, `handleFeedback` and `updateMessageFeedback` (agents only)
- [X] T044 [P] [US5] Implement packages/react-sdk-components/src/components/designSystemExtension/GenAIMessageFeedback/GenAIMessageFeedback.tsx (plus `index.tsx`), the MUI port of REF:packages/cosmos-work/src/components/GenAICoach/GenAIMessageFeedback.tsx — like and dislike with `aria-pressed`, the comment dialog and the selection status
- [ ] T045 [US5] Once it is confirmed how '25 agent streams end (with or without a final response), fix ratings on streamed answers without a final response in packages/react-sdk-components/src/hooks/useGenAICoachObj.ts: unique local IDs for such answers, and ratings sent only with a server message ID

**Checkpoint**: All user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T046 [P] Localization pass over packages/react-sdk-components/src/components/designSystemExtension/ and packages/react-sdk-components/src/hooks/useGenAICoachObj.ts: every text through `localizedVal(…, 'GenAICoach')` or the source's `getLocalizedText`, with the English texts of the 25.1.5 source
- [X] T047 [P] Accessibility pass over packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx and its sub-components (FR-023): labelled controls, polite announcements of new answers, keyboard use and focus handling
- [X] T048 Strict type-check (also without unused locals in the agent files), ESLint and Prettier on the changed files under packages/react-sdk-components/src/, and `npm run lint` from the repository root
- [X] T049 Run `npm run build-overrides` and confirm every rewritten import of the agent files in packages/react-sdk-overrides/lib/ resolves
- [X] T050 Review the implementation against REF at `release/25.1.5` (2026-11-02) and fix the findings in packages/react-sdk-components/src/hooks/useGenAICoachObj.ts and packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx: cache reuse only with its conversation, the source's cache condition when opening a past conversation, and the guided "Ask" menu condition
- [ ] T051 (developer-owned) Compare unit-test coverage with `release/25` for packages/react-sdk-components/ (Constitution VI)
- [X] T052 (developer-owned) Test the acceptance scenarios of each user story in specs/001-ai-agent-assistant/spec.md against a 25.1.x server, including screens without agents and assignment submissions after a conversation (no `genAICoach` data); done by the developer on 2026-11-04
- [X] T053 [P] Add the agent avatar to agent messages in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx: the Cosmos `polaris-solid` icon in an MUI `Avatar` beside the message content on loading, streaming, completed and failed answers, colored from the MUI theme so the light and dark themes work, named after the agent (FR-026)
- [X] T054 Show the agent as a card like the SDK widgets (FR-027): the root of packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx is an MUI `Card` for the `fullpage` and `utilities` placements (8px top and bottom margins on pages and in case tabs; the utilities outline replaced by the card), the case view's tab wrapper in packages/react-sdk-components/src/components/template/CaseView/CaseView.tsx is no longer a card, and the history group headers in packages/react-sdk-components/src/components/designSystemExtension/ConversationHistory/ConversationHistory.tsx are not sticky and have no background
- [X] T055 Match the 25.1.5 layout and spacing (FR-028): in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx a compact page agent with the message box after the suggestions (rearranged with styles, keeping focus), centered empty, loading and error states, the 46rem column, the salutation group and the footer padding; in packages/react-sdk-components/src/components/designSystemExtension/InitialSuggestedMessage/InitialSuggestedMessage.tsx centered, primary-outlined suggestions with a readable fallback color; in packages/react-sdk-components/src/components/template/utils.tsx the gap before the utilities; and in packages/react-sdk-components/src/components/designSystemExtension/UtilitiesLayout/UtilitiesLayout.tsx no end margin
- [X] T056 Resolve case links of all routing table forms in packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx (FR-012): probe routes with a probe work ID, generic `cases/{workID}` routes confirmed by their `caseID` template, the class group of the case types for a single case route, `+` read as the key's space, and the link opened in a new tab when `openWorkByHandle` fails
- [X] T057 Harden case links for the reported 25.1.x link form (`…/prweb//<case type route>/<work ID>`) in packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx (FR-012): case types also from the portal's `pyCaseTypesAvailableToCreate`, the case type the route is named after when the routing table has no route for it, the class group as key prefix when no `caseID` template confirms one, no case for paths without a work ID, and no new tab when the user cancels the open; verified with the real 25.1.3 engine and the MediaCo `D_pxBootstrapConfig` response
- [X] T058 Render the inline formatting of link text (as in `[**N-97011**](…)`) in packages/react-sdk-components/src/components/designSystemExtension/AgentRichTextViewer/AgentRichTextViewer.tsx and pass a token's rendered inline content to markdown overrides as `children` (`MarkdownMap` in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoach.types.ts), shown by the link renderer in packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx
- [X] T059 Fix the findings of the pre-PR review (2026-11-04): in packages/react-sdk-components/src/hooks/useGenAICoachObj.ts only a complete last answer stops loading and an attachment sent in this session downloads the selected file; in packages/react-sdk-components/src/components/designSystemExtension/GenAIMessage/GenAIMessage.tsx an answer that no longer loads does not report completion again when it remounts; in packages/react-sdk-components/src/components/designSystemExtension/GenAICoachContent/GenAICoachContent.tsx Preview only for types that cannot run scripts in the application's origin, and the message box keeps the focus after Send and follow-up suggestions; in packages/react-sdk-components/src/components/helpers/agent-markdown-renderers.tsx a case key in a link counts only if its class belongs to the application's case types

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Stories (Phases 3–7)**: Depend on Foundational; can then proceed in parallel or in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on the user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational; no dependency on other stories
- **US2 (P2)**: After Foundational; reuses `GenAICoachContent` from Phase 2, independent of US1
- **US3 (P3)**, **US4 (P3)**, **US5 (P3)**: After Foundational; work in every placement, independent of each other

### Within Each Story

- Developer-owned tests are written alongside the implementation and must fail before it
- The hook changes come before the UI that uses them
- The open-item tasks (T027, T028, T045) follow the decisions or checks they reference

### Parallel Opportunities

- T004–T007 and T010–T012 touch different files and can run in parallel after T003
- Test tasks marked [P] can run in parallel with each other
- After Phase 2, US1 and US2 can be worked on in parallel (different host files); US3–US5 change the same hook file, so their hook tasks run in sequence

---

## Parallel Example: Foundational

```bash
# After T003 (types):
Task: "T004 Port GenAICoach.utils.ts"
Task: "T005 Port message-stream-utils.ts"
Task: "T006 Port agent-markdown-renderers.tsx"
Task: "T007 Implement AgentRichTextViewer"
```

## Parallel Example: User Story 1

```bash
# Developer-owned tests together:
Task: "T018 Widget and CaseView host tests"
Task: "T019 Case-link tests"
Task: "T020 Case view E2E"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: test the acceptance scenarios of User Story 1 (spec.md) against a 25.1.x server

### Incremental Delivery

1. Setup + Foundational → chat core ready
2. US1 → case view and agent tabs (MVP)
3. US2 → page agents and agent widgets on pages
4. US3–US5 → history, attachments, ratings
5. Polish → localization, accessibility, lint and overrides checks, review fixes

### Parallel Team Strategy

With multiple developers, after Phase 2 one developer takes US1 (case view host) and another US2 (page templates and `UtilitiesLayout`); the hook-centred stories US3–US5 follow in sequence.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Developer-owned tasks (tests, coverage, validation runs, git operations) are done by the developer
- Each deliberate deviation from the source carries a one-line `Deviation from Constellation:` comment in code
- `sdk-config.json` holds server settings and is not committed
