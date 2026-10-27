# Research: AI Agent Experience in Case View and Application Assistant

**Feature**: `001-ai-agent-assistant` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Source implementation**: `constellation-frontend` at `release/26.1.2`, commit `85044c98fb`. This feature ports that implementation to the SDK the same way existing SDK components were ported from Constellation (R15): file and function names, logic and comments are kept, the Cosmos UI is rebuilt with MUI, and out-of-scope features are left out. Paths prefixed with `REF:` are in that repository; all other paths are relative to the `react-sdk-components` repository root.

## Port map

SDK targets are relative to `packages/react-sdk-components/src/`.

| Constellation source (`REF:packages/…`) | SDK target | Adaptation |
|---|---|---|
| `dx-components/src/components/Widgets/GenAICoach/GenAICoach.tsx`, `index.tsx`, `config.json` | `components/widget/GenAICoach/GenAICoach.tsx`, `index.tsx`, `config-ext.json` | Renders `GenAICoachContent` and, for the application assistant, `PortalAgentSplitView` through `getComponentFromMap`; Cosmos icons become MUI icons; the legacy `GenAICoachOld` UI is not ported |
| `dx-components/src/components/Widgets/GenAICoach/GenAICoach.types.ts` | `components/widget/GenAICoach/GenAICoach.types.ts` | Engine types the source imports from `constellation-corejs-library` are declared locally; `GenAICoachProps` moves into `GenAICoach.tsx` as the usual `PConnProps` interface |
| In-scope types of `cosmos-work/src/components/GenAICoach/GenAICoach.types.ts` | `components/designSystemExtension/GenAICoachContent/GenAICoach.types.ts` | The Cosmos core prop types they use are declared locally; the Cosmos `GenAICoachProps` is `GenAICoachContentProps` |
| `dx-components/src/utils/hooks/useGenAICoachObj.tsx` | `hooks/useGenAICoachObj.tsx` | Infinity path only (R18); deviations R4, R6 steps 2 and 4, R7; out-of-scope features removed (below) |
| `dx-components/src/utils/hooks/useAgentStreamHandler.ts` | `hooks/useAgentStreamHandler.ts` | System messages localized (R5); image choices ignored |
| `dx-components/src/utils/message-stream-utils.ts` | `components/helpers/message-stream-utils.ts` | Questions delivered on metadata endings (R8) |
| `dx-components/src/utils/components/agent-markdown-renderers.tsx` | `components/helpers/agent-markdown-renderers.tsx` | `link`, `code` and `text` renderers; case-link handling added (deviation, R13); chart, insight and case-preview renderers not ported |
| `dx-components/src/utils/components/agent-inline-edit-utils.ts` | `components/helpers/agent-inline-edit-utils.ts` | Case-link parsing used by the link renderer (R13); `isRemoteCaseVersionDifferent`, missing from the 4.1 typings and from older servers, is called when present |
| `cosmos-work/src/components/GenAICoach/GenAICoach.tsx` (`GenAICoachContent`, `HeaderActions`) | `components/designSystemExtension/GenAICoachContent/` | MUI; registered as `GenAICoachContent` because `GenAICoach` is the widget's key; the header actions stay in one "Actions" menu as the Cosmos `Actions` component renders them (`menuAt={1}`) |
| `cosmos-work/src/components/GenAICoach/GenAIMessage.tsx`, `GenAIMessageProgress.tsx`, `GenAIMessageFeedback.tsx`, `ConversationHistory.tsx`, `Questionnaire.tsx`, `InitialSuggestedMessage.tsx`, `PortalAgentSplitView.tsx`, `GenAICoach.utils.ts` | `components/designSystemExtension/<Name>/`, `components/designSystemExtension/GenAICoachContent/GenAICoach.utils.ts` | MUI design system extension components, the SDK's place for Cosmos clones (as `WssQuickCreate` is for the `QuickCreate` widget); the split view has no resize handle. `StreamingContext`, defined in the source `GenAIMessage.tsx` (L62–L70), moves to `components/helpers/StreamingContext.ts` so the markdown helpers can import it and an overridden `GenAIMessage` still shares the one context object |
| `AgentRichTextViewer` in `cosmos-work/…/GenAIMessage.tsx`, with the markdown mode of `cosmos-rte/src/components/RichTextEditor/utils/markdownConverter.tsx` | `components/designSystemExtension/AgentRichTextViewer/` | Same parser (`marked`); tokens rendered as MUI elements instead of Slate nodes (R3) |
| `dx-components/src/components/Templates/CaseView/index.jsx` (L186–L198, L264–L276) and `cosmos-work/src/components/CaseView/CaseView.tsx` (L537–L549) | `components/template/CaseView/CaseView.tsx` | The SDK case view always shows its utilities column (R11) |
| `dx-components/src/components/Templates/Tab/TabContent/TabContent.tsx` | `components/template/TabContent/TabContent.tsx` | Template of the tab views App Studio creates (R11); no wrapping card (the tab container draws it), dynamic layout not ported |
| `dx-components/src/components/Templates/AppShell/index.jsx` (L53–L85, L133–L143, L218–L271, L393–L452, L1629–L1681, L1737–L1788) and `PortalAgentContext.ts` | `components/template/AppShell/AppShell.tsx`, `components/helpers/PortalAgentContext.ts`, `components/infra/NavBar/NavBar.tsx` | The Cosmos `AppShell` `agent` entry becomes a `NavBar` prop; `PortalAgentContext` keeps only the members the SDK reads and lives in `helpers/` beside `NavContext`, so overridden components share one context object; the portal banners render above the split view, as the Cosmos `AppShell` renders them before its main content; no home-logo action, no panel resizing (R12) |
| Agent hosting in `dx-components/src/components/Templates/PageLayout/DefaultPage/index.tsx` (also used by its `OneColumnPage`, `TwoColumnPage`, `NarrowWidePage`, `WideNarrowPage` and `BannerPage` wrappers), `PageLayout/InlineDashboardPage/index.jsx` and `ListPage/index.jsx` | `components/template/{DefaultPage,InlineDashboardPage,ListPage,BannerPage}/`, `components/template/{OneColumn/OneColumnPage,TwoColumn/TwoColumnPage,NarrowWide/NarrowWidePage,WideNarrow/WideNarrowPage}/`, shared helpers in `components/template/utils.tsx` | Landing-page agents (R21) |
| `cosmos-work/src/components/UtilitiesLayout/UtilitiesLayout.tsx` (with `UtilitySummaryItemDialog` from `cosmos-work/src/components/CaseView/`) | `components/designSystemExtension/UtilitiesLayout/` | MUI; the anchored dialog is a non-modal MUI `Popper`, the coach button an MUI `Fab` (R21) |
| `corejs/src/genai-assistant/index.ts` | — | Engine API shipped in `@pega/constellationjs`; consumed, not ported |
| Tests: `dx-components/test/unit/utils/message-stream-utils.test.ts`, `dx-components/test/unit/utils/hooks/useAgentStreamHandler.test.ts`, `dx-components/test/unit/Widgets/GenAICoach/GenAICoach.test.tsx` (with `GenAICoach.mock.js`), the portal-agent cases of `dx-components/test/unit/Templates/AppShell/AppShell.test.jsx`, the link and code cases of `dx-components/test/unit/Analytics/ChatThinsight/agent-markdown-renderers.test.tsx`, `cosmos-work/src/components/GenAICoach/mocks/{GenAICoach,GenAIMessage,InitialSuggestedMessage,Questionnaire,PortalAgentSplitView}.test.tsx` | `packages/react-sdk-components/tests/unit/…` | Developer-owned (R20) |

**Not ported** (out of scope in spec.md): `GenAICoachOld.tsx`, `GenAICoachCasePreview.tsx`, `GenAICoachCasePreviewLauncher.ts`, `GenAICoachInlineCaseView.ts`, `GenAICoachRemoteCase.tsx`, `useAgentCaseTracking.ts`, `genai-utils.tsx`, `ToolDetails.tsx`, `ToolCandidates.tsx`, `ToolConfirmationMessage.tsx`, `CaseWorkflow.tsx`, `ActiveCases.tsx`; inside the hook: tracing, filtered-tools display, voice input, the lightbox preview, suggestion cards, the simplified agent, and the non-Infinity transport (the landing-page agent was added later, R21). The Dashboard, Tabbed, Three-column and Dynamic-layout page templates have no SDK counterpart, so their agents stay unsupported.

---

## R1. Engine boundary

**Decision**: All agent operations go through engine-provided APIs: `PCore.getGenAIAssistantUtils()` (conversations, messages, history, feedback, agent/coach configuration), `PCore.getAttachmentUtils()` (upload/download), `PCore.getRestClient()` (cancellation helpers) and PConnect (`getValue`, `updateState`, `getContextName`, `getActionsApi`). No HTTP calls, no new store.

**Rationale**: Constitution I. The bundled engine (`@pega/constellationjs` 26.1.0, the newest published) contains all 12 assistant methods, including `getAgent`/`getCoach`, the configuration argument with streaming, cancellation and questionnaire, and the `user-timezone`/`user-locale` headers. The engine's genai-assistant, messaging-service and assignment-event modules have no changes between `release/26.1.0` and `release/26.1.2`, so the bundled engine matches a 26.1.x server for this feature. Agent-driven case field updates (`COACH_UPDATE`) are handled entirely by the engine on assignment load; the UI must not subscribe or write fields itself. Calls to engine utilities (`PCore.get…Utils()`) count as engine-provided access, as in the existing `CaseHistory`, `ListView` and `DataReference` (`getDataApiUtils().getData`) and `Attachment` and `FileUtility` (`getAttachmentUtils()`) components; this is how the plan reads the constitution's "not through independent data fetching" (maintainers to confirm).

**Alternatives considered**: Calling the DX API routes directly — rejected (violates Constitution I; route URLs and verbs come from server routing metadata, not from client code).

## R2. Typings for the assistant API

**Decision**: Keep `@pega/pcore-pconnect-typedefs ~4.1.0` unchanged in this feature. The ported hook calls `PCore.getGenAIAssistantUtils()` directly, as the source does. Where the 4.1 typings lack a method or an argument (`getAgent`, `getCoach`, the configuration argument of `sendMessage[ForAgent]`), the call is cast at the call site (`(PCore.getGenAIAssistantUtils() as any)`). Existing SDK code handles typing gaps the same way (`template/AdvancedSearch/SearchGroup/persistUtils.ts`, `infra/RootContainer/RootContainer.tsx`, `infra/Containers/ModalViewContainer/ModalViewContainer.tsx`, `template/SelfServiceCaseView/SelfServiceCaseView.tsx`). Request and response shapes are typed with the declarations in the ported `GenAICoach.types.ts`. A separate change can later move the repository to the 26.1 typings (`5.1.x`, npm dist-tag `release-26.1`) and remove the casts.

**Rationale**: Keeps the ported code comparable line by line with the source and follows the repository's practice. 4.1.0 lacks `getAgent`, `getCoach` and the configuration arguments. 5.1.1 has them, but compared with 4.1.0 it changes 164 declaration files and adds 26, which is a repository-wide typing change outside this feature's scope (Constitution VIII). 5.1.1 also declares `getEnvironmentInfo().isOfflineEnabled()`, which engine 26.1.0 does not provide (not used by this feature).

**Alternatives considered**: Upgrade typings now — deferred to its own change. A local typed adapter (`utils/agentApi.ts`, the previous plan) — rejected: a layer the source does not have, unlike other ported components, and it makes later re-syncs with Constellation harder.

## R3. Rendering formatted answers

**Decision**: Render answers the way the source does. Parse them with the `marked` lexer (`^15.0.6`, the range Constellation's rich text viewer uses) and render the tokens as MUI/React elements in `AgentRichTextViewer`, with per-token-type overrides from the ported `createAgentMarkdownMap` (links, code blocks and text). Add `marked` as a runtime dependency of `packages/react-sdk-components` and of the root `package.json`. Rendering rules:
- No HTML string is produced or injected; `html` tokens render as plain text.
- Links are limited to `http`, `https`, `mailto` and `tel`; case links open the case in the application (R13); other allowed links open in a new tab with `rel="noopener noreferrer"`.
- Headings are capped at a small visual level, tables sit in a horizontally scrollable container, code blocks scroll.
- Complete `###JSON_STARTS_HERE … ###JSON_ENDS_HERE` control blocks are removed, and any trailing partial `###…` marker is hidden while a message is still streaming. As in the source, this is the `text` override of `createAgentMarkdownMap`, which reads the streaming state from `StreamingContext`.

**Rationale**: Same parser as the standard portal, so tables, lists and partially streamed text are tokenised the same way (SC-002), and the source's token-type extension point (`markdownMap`) ports directly. Only React elements are produced (no `innerHTML`), so no sanitizer is needed (FR-014, FR-015, SC-006). `marked` 15 ships a CommonJS build with types, so the existing ts-jest configuration loads it unchanged. The SDK already reuses Constellation's libraries where it can (`dayjs`, `downloadjs` and `fast-deep-equal` at the same ranges as `dx-components`).

**Alternatives considered**: `react-markdown` + `remark-gfm` (the previous plan) — rejected: a different parser than the portal, ESM-only (Jest transform changes), two packages and a larger dependency tree. `marked` to HTML plus a sanitizer — rejected: needs `dangerouslySetInnerHTML`. The tiptap rich text editor in read-only mode — rejected: heavy and not built for streaming. A hand-written parser — rejected: correctness and security risk.

**Consequences**: One new runtime dependency. No Jest configuration change.

## R4. Detecting and reading streamed responses

**Decision**: A send response is treated as streamed when its `content-type` header starts with `text/event-stream` (case-insensitive) and `response.data.getReader` is a function; otherwise it is treated as a complete JSON response. The reader decodes with `TextDecoder` in stream mode and follows the framing rules in [contracts/stream-events.md](./contracts/stream-events.md).

**Rationale**: The reference requires the exact value `text/event-stream;charset=UTF-8`, which silently disables streaming if a proxy or server changes casing or spacing; the 25.1 reference used a prefix match. `EventSource` cannot be used because the engine owns the authenticated POST request.

**Alternatives considered**: Exact header match — rejected (fragile). `EventSource` — rejected (GET only, no engine-managed auth).

## R5. Stream events to chat messages

**Decision**: Port `useAgentStreamHandler` (to `hooks/useAgentStreamHandler.ts`), which produces the message behaviour documented in [contracts/stream-events.md](./contracts/stream-events.md) §4: text appends to the active (or orphan loading) agent message; case creation/opening shows a progress item that becomes a localized system confirmation; assignment work shows one progress item with steps (minimum 750 ms per step completion), retry de-duplication and a failure system message at finalization; insight tool output is appended as text; image-choice events are ignored without interrupting the stream (out of scope). System message templates are localized (the reference hard-codes English).

**Rationale**: These are the behaviours users see in the standard portal (US3). The source's tests for this hook are ported with it (R20).

**Alternatives considered**: Render only text — rejected (loses US3). Render raw events — rejected (not user-facing).

## R6. Conversation lifecycle

**Decision**:
1. **Open** (first expand in the case view, first show of the assistant): restore from the engine-store cache if the agent's configuration is cached; otherwise call `getAgent` (or `getCoach`) with the agent name, context name and context ID. No conversation is created (FR-008). If the configuration contains `initialInstruction`, it is shown as the user's first message and sent through create-then-send.
2. **First send**: `createConversationForAgent` (or `createConversation`) with the context ID, then send. The user's message and the loader are added while the conversation is created; the reference adds them after creation succeeds, so the message left the composer without showing in the conversation for the whole creation request, which in the SDK also includes the CORS preflight of each new endpoint (deviation, US1-2). If creation fails, the message is withdrawn (with the starter prompts it hid), the typed text is restored and a conversation error is shown (FR-016); a first message that does not come from the composer (`initialInstruction`, questionnaire answers) keeps its message and only its loader is removed, so a new message can be sent.
3. **Later sends**: `sendMessageForAgent` with `enableStreaming` from the configuration, `additionalInstruction` when the text matches a suggested prompt, `questionnaire` answers when present, uploaded attachments, and a cancel token when streaming.
4. **New chat**: reset to the "configured, no conversation" state using the cached configuration; the conversation is created on the next send. (The reference creates immediately; deferring keeps FR-008 consistent and is invisible to users.) The configuration is cached once a conversation is created; if none was created in this session (the user only reopened past conversations), it is fetched again with `getAgent`.
5. **Switch agent**: cancel any in-flight stream, keep each agent's cache, restore or load the other agent.
6. **History**: `getConversationsForAgent`, page size 20, page index from 1, exhausted when a page has fewer than 20 items; refetch after a send or a rating. The panel renders the list held in the hook's state. The reference renders the engine-store copy that an effect writes after the render; that only shows under React's legacy root, which Constellation uses, because the SDK's `createRoot` batches the page and loading updates into one render that nothing repeats (the first open showed "No conversations found" and later pages did not appear). The next page index is derived from the number of conversations loaded, so a repeated load request cannot skip a page, and a failed load without error details (for example a network error) shows a message instead of the empty list (FR-016).
7. **Open past conversation**: from cache when present, else `getMessagesForAgent`; map history messages per [contracts/engine-genai-assistant.md](./contracts/engine-genai-assistant.md) §5. Opening a different conversation cancels the stream of the current one, as switching agents does (the reference only drops the stream's cancel token, so the answer kept streaming into the newly opened conversation).
8. **Coach kind**: the same flow with the coach methods; agent-only features (Stop, ratings, attachments, case actions, questions) are hidden for coaches, matching the reference.
9. **Leaving the host** (case closed, page left, component unmounted): cancel any in-flight stream and ignore late responses. Leaving a conversation (steps 4, 5, 7 and 9) also cancels a conversation still being created and an agent configuration still loading, so neither can apply to the view the user moved to; the configuration request has its own cancel list, so loading it again (maximize, reopen) cannot cancel the creation of the first conversation, as the shared list of the reference does (deviation). Messages are never resent automatically, so a failure (including an expired session) cannot send a message twice. Whenever a conversation is left with an answer still loading (steps 4, 5, 7 and 9), its cached copy is sealed: the partial answer is kept and an empty loader is removed. In the reference the late response clears the cache instead, but the port cancels that response, and an unsealed copy would reopen with an endless "Generating response" and no way to send.

**Rationale**: Ported from the source's Infinity path. Steps 2 (US1-2), 4 (FR-008), 6 (React 18+ batching, FR-016), 7 and 9 (cancelled streams) contain deliberate deviations, each marked with a one-line comment in code.

## R7. Action approval (tool confirmation) is out of scope

**Decision**: Do not advertise `isManualConfirmationSupported` when creating conversations or sending messages. If a response nevertheless contains `toolsNeedConfirmation`, show its confirmation text as a read-only agent message with a localized notice that approval is not available here; no approve/modify/reject controls. The source's approval UI (`ToolDetails`, `ToolConfirmationMessage`, `ToolCandidates`) is not ported.

**Rationale**: The only client capabilities in requests are `stream` and `tools.isManualConfirmationSupported`, so approval is opt-in. Server behaviour when the capability is not advertised must be confirmed against the target server (quickstart V11).

**Alternatives considered**: Implement the review dialog now — deferred (spec out of scope).

## R8. Questions from the agent

**Decision**: Handle `questionnaireProvided` (accumulated and delivered at stream end). A single single-choice question with three or fewer options renders as inline quick choices in the latest agent message; anything else renders as a form card above the composer, one question per step with previous/next. Five or fewer options are listed; otherwise four are listed plus a searchable "Other" list (MUI `Autocomplete`). Multiple-choice uses checkboxes. Answers are sent on the streamed path as `questionnaire.questions[{field, type, questionText, selectedItems[{key, label}]}]` with the optional typed text as the message. The pending question set is stored with the conversation in the engine-store cache and restored from the last history message (`questionnaire` JSON string with `component: 'questionnaire'`). Dismiss clears it.

**Rationale**: Without answers, agents that ask questions stall (US4). There is no client capability flag for questionnaires, so the server can send them at any time. The source drops accumulated questions when a stream ends with a `metadata` frame instead of a final JSON; the port delivers them in both cases (deviation, commented in code).

## R9. Conversation context ID

**Decision**: Context ID rules per host (they scope history on the server, so they must match the standard portal for users to see the same history):
- **Case view**: data object present (`dataInfo.content`) → `"<pxObjClass> <pyGUID>"`; otherwise the full case ID (`caseInfo.ID`).
- **Widget elsewhere and the application assistant**: case summary has an ID → full case ID; data object → `dataInfo.contextKey`; otherwise read `pyPortal.classID`, strip a leading `<namespace>__` when namespaces are enabled (`PCore.isNamespaceEnabled()`, `getFeatureMap().namespaceList`); application assistant → upper-cased class ID; page → upper-cased `"<classID>!PAGE!<viewName>"`.
- **Landing page (agents configured on the page itself, R21)**: the page's resolved `localeReference` (for example `DXIL-DIGV2-UIPAGES!PAGE!INLINEDASHBOARD`), as the source's page templates pass it.

## R10. Session cache in the engine store

**Decision**: Use `pConnect.updateState({ genAICoach: { [instanceId]: … } })` and `pConnect.getValue('genAICoach.<instanceId>…')`. Instance IDs follow the source hook: `caseview` for the case view; `landingpage` for agents configured on a landing page (R21); otherwise the agents' `insName` values joined with `_` (fallback `coaches`), which is what the application assistant uses. Each instance holds `coaches[]` agent records and `currentCoach`. Record shape is in [data-model.md](./data-model.md). Records are seeded only if missing and never overwritten wholesale.

**Rationale**: Constitution I (no custom store). The cache survives panel remounts; the application assistant's node lives in the portal context (`pageReference: 'pyPortal'`), so its conversation survives page navigation (FR-004). The reference uses the same storage approach in its case view; quickstart V13 verifies that agent data is not included in assignment submissions.

## R11. Case view hosting

**Decision**: Port the source's case view hosting (`REF:packages/dx-components/src/components/Templates/CaseView/index.jsx` L186–L198 and L264–L276; `REF:packages/cosmos-work/src/components/CaseView/CaseView.tsx` L537–L549). `CaseView` computes the context ID (R9), calls `useGenAICoachObj(coaches.length ? coaches : undefined, contextID, getPConnect(), true, true)` and renders `GenAICoachContent` through `getComponentFromMap` in the utilities column (`Grid2 size={{ xs: 3 }}`) after the utilities region, the order of the source's `utilitiesAndGenAI`, with the hook's props and `variant={{ placement: 'utilities', state, onStateChange }}`.
- `utilitiesExpanded` is `true` because the SDK case view always shows its utilities column.
- The card starts `minimized` (collapsed, showing the agent name). Maximizing it calls the hook's `onStateChange`, which starts the conversation, so configuration loads on first expand.
- The Fullscreen action (`allowFullScreen`) shows the same conversation in an MUI `Dialog` (`placement: 'dialog'`), full screen below the `md` breakpoint (FR-029).
- Nothing renders when the hook returns nothing (no agents), in assignment-only mode (`displayOnlyFA`) or outside the Infinity runtime (R18; `coaches` is then passed as `undefined`).
- **Agent as a case tab** (two placements):
  - **In a tab view (what App Studio creates).** A tab added in App Studio is a `DeferLoad` of a view using the `TabContent` template, with the agent widget in region A (seen on the lab: view `AIAssistant`, template `TabContent`). The SDK had no `TabContent` template, so the view rendered "Failed to display content" and the agent was never reached; this affects any App Studio-created tab, not only agents. `TabContent` is ported (Port map): display-only inherited props, regions side by side when the template is at least 620px wide (one-column, two-column, narrow-wide, wide-narrow), its own label through `FieldGroup` when `showLabel`, and "No items" when all regions are empty. Deviations: no wrapping card, because the SDK case view's tab container already draws it, as for `OneColumnTab`/`TwoColumnTab`; the `dynamic` layout (drag-and-resize grid) is not ported and shows region A in one column; the insight and label-alignment contexts are not ported. `TabContent` is added to the View's templates without a header, as it renders its own label.
  - **Directly in the Tabs region.** App Studio can also place the widget there (`{ type: 'GenAICoach', config: { label, coaches } }`, no view `name`; Constellation's authoring treats `GenAICoach` and `Pulse` there as widgets). The source renders every tab with `tab.getPConnect().getComponent()`; the SDK case view loaded every tab through `DeferLoad` by view name. Tabs with a view `name` still load through `DeferLoad` unchanged; a tab without one renders its own component in a card, keyed by tab so switching between two widget tabs remounts it.
  - In both cases the widget shows the agent full page (`placement: 'fullpage'`); as in the source, the panel fits its content until the first message and is then as tall as the view (`var(--content-height-in-view, 100vh)`), so the conversation scrolls inside it. The portal assistant keeps filling its panel.

**Rationale**: Same structure as the source: the case view owns the hook and the presentational component renders in the utilities region. One additive block in `CaseView`, overridable through the component map, backward compatible (Constitution III).

**Alternatives considered**: Rendering the `GenAICoach` widget from the case view (previous plan) — rejected: the source does not, so the port would drift from it. Floating bottom-right panel — rejected (the SDK case view has no floating layer). Separate tab — rejected (hides case details while chatting).

## R12. Application-wide assistant hosting

**Decision**: Port the source's portal agent (`REF:packages/dx-components/src/components/Templates/AppShell/index.jsx` L53–L85, L133–L143, L218–L271, L393–L452, L1629–L1681, L1737–L1788, and `PortalAgentContext.ts`) into the default branch of `AppShell`; the self-service (WSS) branch is unchanged, as in the source:
- Widen the `navDisplayOptions` prop type with optional `enableAIAgent`, `selectedAgents`, `aiAssistantWidth`.
- `portalAgentElement`: when `enableAIAgent` is true and `selectedAgents` is non-empty, map the agents to `coaches` (`type` from `pyComponentName` — `AIAgentObject` → agent, otherwise coach; `insName` from `pxInsName`; label from `pyDisplayLabel` or `pyLabel`; `classID`) and create one memoised node with `PCore.createPConnect({ meta: { type: 'GenAICoach', config: { coaches, isPortalAgent: true } }, options: { context: <shell context name>, pageReference: 'pyPortal' } })`, rendered with `createPConnectComponent()`.
- Display state `showAgentPanel`, `showPageContent` and `agentExpanded`, initialised with `getPortalAgentInitialState(getAIAssistantMode(aiAssistantWidth))`: `Hidden` → hidden, `Split-width` → beside the page, `Full-width` → full width, unknown values → `Hidden`. Actions and startup handling as in the source: `onAgentClick`, `onAgentToggle`, `isAgentInStartupMode` and `homePageRuleName`.
- `PortalAgentContext`, ported to `components/helpers/PortalAgentContext.ts` (beside `NavContext`, so an overridden `AppShell` or widget still shares the one context object), carries only what the widget reads: `showAgentPanel`, `agentExpanded`, `onAgentToggle`, `onAgentClick` and `pagePanel: { content: <page content>, visible: showPageContent && !agentExpanded }`. The source's `isPortalAgent`, `showPageContent`, `agentPanelWidth` and `onAgentPanelResize` members have no reader in the SDK and are not ported (Constitution VIII). When the assistant exists, the content area renders `portalAgentElement`, and the widget renders `PortalAgentSplitView` with the agent panel and the page panel, as the source does. The agent panel mounts on first show and stays mounted; the page panel stays mounted while hidden (FR-004).
- Header actions in the widget (source `GenAICoach.tsx` L101–L129): Full width / Split width (`onAgentToggle`) and Hide (`onAgentClick`).
- Navigation entry: the Cosmos `AppShell` `agent` prop becomes an optional `agent` prop on `NavBar` with the same shape (`{ id, name, icon, active, onClick }`): name `localizedVal('AI Assistant', 'AppShell')`, active while the panel is shown, click → `onAgentClick`.
- Events (source L397–L452): a page shown on `app/primary` (except the startup navigation to the home page), a case opened and a case created show the page and leave full width.
- Not ported: the home action on the application logo (`goToHome`; the SDK `NavBar` has none) and panel resizing with a remembered width (`agentPanelWidth`, `onAgentPanelResize`, user settings), which spec.md puts out of scope. The panel's default width is 31.25rem and it never goes below 20rem.
- Narrow screens (FR-029; SDK-specific, because the Cosmos shell handles this itself): below the `md` breakpoint there is no beside-the-page mode. Showing the assistant means full width, and events that would switch it beside the page hide it instead.

**Rationale**: Same construction and state logic as the standard portal (SC-002); `NavBar` and `AppShell` changes are additive and inert when the assistant is not configured (Constitution III, IV).

**Alternatives considered**: A layout owned by `AppShell` with a custom context (previous plan) — rejected: drifts from the source's `PortalAgentContext` and `PortalAgentSplitView` design. Rendering the assistant inside the navigation drawer — rejected (too narrow). A separate route — rejected (loses the page beside the conversation).

## R13. Links in answers

**Decision**: A link to a case of the application opens the case in the application through `getActionsApi().openWorkByHandle(caseKey, className)`. A link is a case link when it carries `caseKey`/`caseTypeID` query parameters or points to the Infinity server the SDK uses (`infinityRestServerUrl` origin), and its case key resolves:
- from the link, with the source's `agent-inline-edit-utils` (`parseCaseLink`, `resolveCaseKeysFromLink`), ported to `components/helpers/agent-inline-edit-utils.ts`: `caseKey` query parameter, or the `<class> <work ID>` key in the path of the portal case URL (`…/app/<application>/<case type or "cases">/<class>%20<work ID>`); the class comes from `caseTypeID`, the key's prefix or the path;
- or, when the link carries only the work ID (for example `…/app/<application>/<case type path>/A-8001`), from the cases created or opened in the conversation (the `caseInfo` of its system messages, which holds the case key and case type).

The case must open natively (`resolveCaseOpenStrategy`: not a remote case of a different version). Ctrl/Cmd/Shift/Alt and middle clicks keep the browser behavior. Other `http`/`https`/`mailto`/`tel` links, and case links that do not resolve, open in a new tab with `rel="noopener noreferrer"`. Any other protocol renders as plain text.

**Rationale**: FR-014 and the spec edge case; keeps users inside the application for case links. The agent builds its case links from the server's portal URL, so in the SDK they point to the Pega portal.

**Deviation**: In the source, the standard agent opens every link in a new tab (`createCoachLinkRenderer` returns `ExternalLink`); only the simplified agent, which is out of scope, handles case links, and it opens a case preview, only for links with case query parameters. In the SDK application, opening the portal's case URL in a new tab would open the Pega portal rather than the SDK application, so the port adds case-link handling to the link renderer, marked with a one-line comment. Quickstart PT1 records this as the one accepted difference from the standard portal.

## R14. Localization

**Decision**: Follow the SDK pattern: `const localizedVal = PCore.getLocaleUtils().getLocaleValue;` with a `localeCategory` constant and English text as the key. The category is `GenAICoach` in the widget and its sub-components and `AppShell` in `AppShell` and `NavBar` (the source uses `AppShell` for `AI Assistant`). Where the ported Cosmos code calls `t('<key>')`, the key's English value in `REF:packages/cosmos-core/src/i18n/default.ts` becomes the text (for example `split_width` → `Split width`, `your_chats` → `Your chats`, `ai_disclaimer` → `Verify AI-generated content for accuracy.`). Calls the source already makes through `pConnect.getLocalizationService().getLocalizedText(...)` (`Today`, `Previous 7 Days`, `Previous 30 Days`, attachment and error texts) are kept. System message templates (`Case "{1}" created`, `Case "{1}" opened`, `Response stopped`) are localized; the source hard-codes them in English (deviation). Catalogue in [contracts/ui-components.md](./contracts/ui-components.md) §6.

## R15. Porting approach

**Decision**: Port the in-scope Constellation code the way existing SDK components were ported from Constellation (team direction, 2026-10-13). This replaces the clean-room approach of the previous plan and settles the licensing question noted in the spec input. Rules for every ported file:
1. Keep file names, exported and internal names, logic and comments. `index.jsx` becomes `<Name>.tsx` plus an `index.tsx` re-export; `config.json` becomes `config-ext.json`.
2. Locations: `dx-components/src/utils/hooks/*` → `src/hooks/*`; `dx-components/src/utils/*` → `src/components/helpers/*`; `components/Widgets/*` → `components/widget/*`; `components/Templates/*` → `components/template/*`. Cosmos presentational components become MUI design system extension components in `components/designSystemExtension/<Name>/`, registered under their Cosmos names (R16), as the SDK does for its other Cosmos clones (`WssQuickCreate` for the `QuickCreate` widget, `CaseSummaryFields`, `FieldGroup`).
3. Cosmos components → MUI v6 with `makeStyles` (R19). Cosmos styles and test-id helpers are not ported.
4. Strings follow R14. Typing gaps use call-site casts (R2); types from `constellation-corejs-library` are declared locally in the widget's `GenAICoach.types.ts`, and the Cosmos types in `designSystemExtension/GenAICoachContent/GenAICoach.types.ts`, keeping the source's split.
5. Imports become SDK equivalents: `createPConnectComponent` for `PConnectHOC`, `Utils.getMappedKey` for `getMappedKey`, `getComponentFromMap` for sibling components, `helpers/attachmentShared.ts` and `widget/Attachment/AttachmentUtils.ts` for attachment utilities; no `lodash-es`.
6. Out-of-scope features are removed (Port map), including members and props that nothing in the SDK reads. Deliberate deviations (R4, R5 system messages, R6 steps 2, 4, 6, 7 and 9, R8, R13 case links) carry a one-line comment.
7. The source's copyright header is not copied (SDK source files carry none).

**Evidence** (existing ports):
- `template/AdvancedSearch/` (#467) mirrors `REF:packages/dx-components/src/components/Templates/AdvancedSearch/` file for file. `SearchGroup/persistUtils.ts` and `SearchGroups/hooks.ts` keep the source's names, JSDoc and logic (`getMappedKey` → `Utils.getMappedKey`, one `as any` cast). `SearchGroups/SearchGroups.tsx` keeps `initializeSearchFields` with MUI in place of Cosmos, and `SearchGroups` is registered and rendered with `getComponentFromMap`.
- `field/SelectableCard/utils.tsx` keeps `prepareComponentInCaseSummary` from `REF:packages/dx-components/src/components/Templates/utils.jsx` with its JSDoc and comments; only the Cosmos `NoValue` component is replaced.
- `hooks/useStatus.ts`, `useIsMount.js`, `useCollapsibleState.ts`, `useGetTabsCount.ts` and `components/helpers/instructions-utils.ts`, `event-utils.ts`, `state-utils.tsx`, `case-utils.tsx`, `object-utils.ts` carry the names of their `dx-components/src/utils/` sources.
- The SDK reuses Constellation's libraries at the same ranges (`dayjs`, `downloadjs`, `fast-deep-equal`).

**Rationale**: The established practice of this repository. Ported code stays comparable with the source, so later Constellation fixes can be re-applied and the source's unit tests can be ported (R20).

## R16. Registration and packaging

**Decision**: Register `GenAICoach` and its sub-components `GenAICoachContent`, `GenAIMessage`, `GenAIMessageProgress`, `GenAIMessageFeedback`, `ConversationHistory`, `Questionnaire`, `InitialSuggestedMessage`, `PortalAgentSplitView`, `AgentRichTextViewer` and `UtilitiesLayout` in `packages/react-sdk-components/src/sdk-pega-component-map.js` (import plus key, alphabetical), and render each through `getComponentFromMap`, as `QuickCreate` does with `WssQuickCreate` and `AdvancedSearch` with `SearchGroups` (Constitution II). Names are those of the Constellation components they port; `GenAICoachContent` is the Cosmos `GenAICoach` UI under its internal name, because `GenAICoach` is the widget's key. If a future platform component type takes one of these names, the SDK key must be renamed then. The widget keeps the widget layout (`widget/GenAICoach/GenAICoach.tsx`, `index.tsx`, `config-ext.json`, the `PConnProps` props interface); each Cosmos port is a design system extension component in its own folder (`designSystemExtension/<Name>/<Name>.tsx` plus `index.tsx`, no `PConnProps`, no `config-ext.json`), like `WssQuickCreate` for the `QuickCreate` widget. In `scripts/override-constants.js`, `GenAICoach` maps to `'widget'` and each design system component to `'designSystemExtension'`, as for the existing ones: `scripts/build-overrides.js` rewrites a relative import that starts with a registered name (`../<Name>…`) to `@pega/react-sdk-components/lib/components/<mapped dir>/<Name>…`, so `../GenAICoachContent/GenAICoach.types` and `../GenAICoachContent/GenAICoach.utils` imports between design system components resolve, and `../../designSystemExtension/…`, `../template/…` and `../hooks…` imports are rewritten through the folder rules. Only single-line relative imports are rewritten, so these imports stay on one line. Add `config-ext.json` (`name: GenAICoach`, `label: Agent`, `type: Widget`, `subtype: CASE`, `properties: []`). Do not register `AIAgentObject`/`GenAICoachObject`: they are configuration items inside `coaches`, never rendered. If validation shows "component not found" for them (quickstart V12), add null-rendering entries.

## R17. Accessibility

**Decision**: Message list labelled and announced politely for new agent messages and the "generating response" status; composer labelled; every icon button labelled; Enter sends and Shift+Enter inserts a newline; focus returns to the composer after send, Stop, dismissing questions and closing history; rating toggles expose `aria-pressed`; a scroll-to-latest button appears when the user has scrolled up during streaming. Arrow-key roving focus between messages (present in the standard portal) is deferred.

## R18. Runtime scope

**Decision**: Render the agent experience only when `PCore.getEnvironmentInfo().isInfinityRuntime()` returns true; otherwise render nothing.

**Rationale**: The spec covers Infinity only. The source falls back to a different transport whenever the runtime name is not exactly `Infinity` (`isLaunchpadRuntime`); that branch is not ported.

## R19. Styling

**Decision**: Follow sibling widgets: `makeStyles` from `@mui/styles` with theme palette and spacing, MUI v6 components (`Card`, `IconButton`, `TextField`, `Menu`, `Dialog`, `Chip`, `CircularProgress`, `Tooltip`, `Snackbar`, `Autocomplete`, `Radio`, `Checkbox`), `Grid2` for layout. No new styling libraries. The Cosmos styles (`GenAICoach.styles.ts`) are not ported.

## R20. Test approach (developer-owned)

**Decision**: Port the source's unit tests listed in the Port map, adapting imports, engine mocks and DOM queries to the SDK's MUI components, with expectations for the deliberate deviations (R4, R5, R6 steps 2 and 4, R8, R13). Add tests where the source has none: the `CaseView` host conditions, `GenAIMessageProgress`, `GenAIMessageFeedback`, attachments and history paging. End-to-end (Playwright) for the case view and assistant flows against a 26.1.x server with agents configured. No Jest configuration change is needed (R3). Execution is owned by the developer; the plan lists the work to satisfy Constitution VI.

## R21. Landing-page agents (added after the first release candidate)

**Decision**: Port the agent hosting of the source's landing-page templates (User Story 8, FR-030). In the source, `DefaultPage` (which its `OneColumnPage`, `TwoColumnPage`, `NarrowWidePage`, `WideNarrowPage` and `BannerPage` wrappers render), `InlineDashboardPage` and `ListPage` call `useGenAICoachObj(coaches.length ? coaches : undefined, localeReference, getPConnect(), false, false, false, true)` (the last argument is `isLandingPage`) and pass `<UtilitiesLayout genAICoachProps={…} />` to the Cosmos page template's `utilities` slot.
- **Hook**: `isLandingPage` is ported as the 6th parameter (the source's unused `isPortalAgent` was not ported); it selects the `landingpage` cache namespace (R10). The context is the page's `localeReference` (R9).
- **Templates**: the SDK has no Cosmos page shells with a `utilities` slot, so two helpers in `components/template/utils.tsx` keep each template's change to a few lines: `usePageGenAICoach(getPConnect, coaches, localeReference)` makes the source's hook call (Infinity runtime only, R18), and `withPageUtilities(page, genAICoachProps)` returns the page unchanged without agents, otherwise the page with `getComponentFromMap('UtilitiesLayout')` at its end (below the md breakpoint, after it). The SDK's `DefaultPage`, `InlineDashboardPage`, `ListPage`, `BannerPage`, `OneColumnPage`, `TwoColumnPage`, `NarrowWidePage` and `WideNarrowPage` use them; `DefaultPage` uses them for both the banner and the grid layouts, as the source does.
- **`UtilitiesLayout`** (design system extension, port of the Cosmos component): a 3rem utilities strip with an Expand/Collapse button and the fixed "Chat with AI" button at the page's bottom end (the Cosmos `AIButton` becomes an MUI `Fab`). The button opens the agent anchored to it (`placement: 'dialog'`, a non-modal MUI `Popper` of 25rem by `calc(0.85 * 95vh)` that opens towards the page; the source's `UtilitySummaryItemDialog`). As in the source, the page stays scrollable and usable while it is open (no backdrop or scroll lock; an MUI `Popover` blocked the page): Escape and Close close it and return focus to the button, Tab cycles within it, and a click outside closes it while still reaching the page (`ClickAwayListener`, which treats the menus and dialogs the agent opens as inside). Expanded, the strip is a 25rem sticky column showing the agent with `isInLandingPageUtilities`, or a persistent drawer below the lg breakpoint; below md the agent is shown in the page. The hook stays in the page template, so closing the anchored agent keeps its conversation, and a stream continues while it is closed, as in the source.
- **`GenAICoachContent`**: as in the source, the `dialog` placement shows a Close button, and the Fullscreen action is offered there too. The panel's own fullscreen copy is marked with `isFullscreenView` (the Cosmos component reads this from its fullscreen context), which alone shows "Exit fullscreen" and the side-by-side history. `isInLandingPageUtilities` keeps the agent filling the utilities column instead of the view height.

**Not covered**: the source's `DashboardPage`, `TabbedPage`, `ThreeColumnPage` and `DynamicLayoutPage` have no SDK template; an agent placed in a page banner (`simplifiedAgent`) stays out of scope.

**Rationale**: Agents configured on pages were silently dropped by the SDK (no template read `coaches`). Reusing the hook and panel keeps one agent implementation for all placements.

## Verification items (not blockers; covered by quickstart)

| ID | Item | Quickstart |
|---|---|---|
| U1 | `pyExecutionRuntimeName` is `Infinity` on the target server | Pre-check P3 |
| U2 | `coaches` reaches the SDK `CaseView` through config props | V1 |
| U3 | Server routing metadata includes `getAgent`/`createConversationForAgent`/`sendMessageForAgent` | Pre-check P4, V2 |
| U4 | Server behaviour when manual confirmation is not advertised | V11 |
| U5 | Metadata-only items (`AIAgentObject`, `GenAICoachObject`) are not rendered | V12 |
| U6 | Agent data in the engine store is not submitted with assignments | V13 |
