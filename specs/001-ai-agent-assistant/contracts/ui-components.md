# Contract: SDK Components and Host Integration

**Feature**: `001-ai-agent-assistant` | **Status**: Interfaces this feature adds or changes in `@pega/react-sdk-components`. All changes are additive; with no agents configured every existing component renders exactly as before (Constitution III).

Paths are relative to `packages/react-sdk-components/src/`.

## 1. Registration and packaging

| Item | Contract |
|---|---|
| Component map | `sdk-pega-component-map.js` exports key `GenAICoach` → `components/widget/GenAICoach` |
| Sub-components | Design system extension components, each registered under its own key and folder, named after the Constellation component it ports: `GenAICoachContent`, `GenAIMessage`, `GenAIMessageProgress`, `GenAIMessageFeedback`, `ConversationHistory`, `Questionnaire`, `InitialSuggestedMessage`, `PortalAgentSplitView`, `AgentRichTextViewer`, `UtilitiesLayout` → `components/designSystemExtension/<Name>` (`<Name>.tsx` plus `index.tsx`); the Cosmos types and utils are in `components/designSystemExtension/GenAICoachContent/` |
| Overrides | `scripts/override-constants.js` (repository root) maps `GenAICoach` to `'widget'` and each design system component to `'designSystemExtension'` (research R16) |
| Hooks and helpers | `hooks/useGenAICoachObj.tsx`, `hooks/useAgentStreamHandler.ts`, `components/helpers/message-stream-utils.ts`, `components/helpers/agent-markdown-renderers.tsx`; the hooks are not exported from `hooks/index.ts`, like `useStatus` |
| Metadata | `components/widget/GenAICoach/config-ext.json`: `name: "GenAICoach"`, `label: "Agent"`, `description: "Agent"`, `type: "Widget"`, `subtype: "CASE"`, `properties: []` |
| Not registered | `AIAgentObject`, `GenAICoachObject` (configuration items only) |

## 2. `GenAICoach` widget

Port of `REF:packages/dx-components/src/components/Widgets/GenAICoach/GenAICoach.tsx`. Resolved by the bridge for view metadata of type `GenAICoach` and for the application assistant's synthetic node.

| Prop | Type | Contract |
|---|---|---|
| `getPConnect` | `() => PConnect` | Standard `PConnProps` |
| `coaches` | see [configuration-inputs.md](./configuration-inputs.md) §1 | Agents to offer |
| `isPortalAgent` | `boolean` (default `false`) | Application assistant mode: portal context ID rule, header actions and split view from `PortalAgentContext` (§5.2) |
| `simplifiedAgent` | `boolean` | Ignored in this release |

Behaviour, as in the source:
- Computes the context ID (research R9) and calls `useGenAICoachObj(coaches, contextID, getPConnect(), false, false)`.
- Renders `GenAICoachContent` with the hook's props, `variant={{ placement: 'fullpage' }}` and `allowFullScreen={!isPortalAgent}`.
- When `isPortalAgent` and `PortalAgentContext.pagePanel` is set, adds the Full width/Split width and Hide actions and wraps the content in `PortalAgentSplitView`.
- Renders nothing when the runtime is not Infinity or the hook returns nothing.

## 3. `useGenAICoachObj` (logic ↔ UI boundary)

Port of `REF:packages/dx-components/src/utils/hooks/useGenAICoachObj.tsx`: `useGenAICoachObj(coaches, caseID, pConnect, isCaseView = false, utilitiesExpanded = false, isLandingPage = false)`; the source's `isPortalAgent` (read only by out-of-scope case tracking) and `simplifiedAgent` parameters are not ported, and `isLandingPage` selects the `landingpage` cache (research R21). Returns `undefined` when there are no agents. Otherwise it returns the in-scope subset of the source's `UtilitiesGenAICoachProps`, passed unchanged to `GenAICoachContent`. Field semantics follow [data-model.md](../data-model.md); calls follow [engine-genai-assistant.md](./engine-genai-assistant.md).

| Props | Meaning |
|---|---|
| `loading`, `error` | Panel loading and error, including "configuration incomplete" |
| `coachOptions`, `onCoachChange` | Agent switcher |
| `salutation`, `initialSuggestedMessages`, `suggestions`, `guidedMode` | Empty state (up to 4 initial suggestions), suggestions menu, guided mode |
| `messages` | `GenAIMessageProps[]` for the active conversation; coach messages carry `markdownMap`, follow-up `suggestions`, progress steps and `feedback` |
| `onSend(SendMessageProps)`, `onStop`, `draftMessage`, `conversationError`, `isCreatingConversation` | Create-on-first-send then send (the message shows while the conversation is created, research R6 step 2), Stop, restored text and creation errors (FR-016) |
| `onOpen`, `onStateChange` | Lazy start: on mount outside the case view; on first maximize in the case view |
| `actions` | Header actions from the hook (Your chats); tracing is not ported |
| `onNewChat` | Reset to an empty conversation; creation is deferred to the next send (research R6) |
| `conversationHistory` | `ConversationHistoryProps`: `data`, `loading`, `error`, `loadMore`, `onItemClick`, `selectedItemId`, `onDismiss` |
| `onLayoutChange` | Fullscreen or full-page layout notification |
| `onAddAttachment`, `attachments`, `attachmentsError` | Agents only |
| `questionnaireData`, `onQuestionnaireDismiss` | Pending question set |

Not produced (out of scope): `caseWorkflow`, `activeCases`, `suggestionCardsView`, `voiceToTextProps`, `lightboxPreviewProps`, tool candidates and confirmations, image choices.

## 4. `GenAICoachContent` layout

MUI port of the Cosmos `GenAICoach` UI (`REF:packages/cosmos-work/src/components/GenAICoach/GenAICoach.tsx`). Placement comes from `variant`, as in the source:

| `variant` | Behaviour |
|---|---|
| `{ placement: 'utilities', state, onStateChange }` | Case view card: header (agent name with Maximize when minimized; when maximized the agent switcher, New chat and an "Actions" menu with Your chats, Fullscreen and Minimize), bounded-height message list with internal scrolling, composer. `state` starts `minimized`; maximizing calls `onStateChange('maximized')`. The Maximize button exposes `aria-expanded` |
| `{ placement: 'fullpage' }` | Full-height panel used by the widget; for the application assistant it sits inside `PortalAgentSplitView` and its "Actions" menu holds the host `actions` (Full width/Split width, Hide) |
| `{ placement: 'dialog', onClose }` | Fullscreen view opened by the Fullscreen action when `allowFullScreen`: the same conversation in an MUI `Dialog`, full screen below the `md` breakpoint (FR-029); Exit fullscreen (in its "Actions" menu) closes it and focus returns to the menu button |

As in the source, all header actions are in one "Actions" menu (the Cosmos `Actions` component with `menuAt={1}`), labelled "Actions - <agent name>".

Shared rules (from the source UI behaviour):
- Sub-components are always resolved with `getComponentFromMap` (never imported directly), so each one can be overridden.
- Empty state: salutation (`welcomeMessage` or default) and up to 4 `InitialSuggestedMessage` items; in guided mode a suggestion sends immediately, otherwise it fills the composer.
- Composer: Enter sends, Shift+Enter inserts a newline; send is blocked while the latest agent answer is loading, an attachment is uploading or has an error; when an answer is streaming, Stop replaces Send (agents only).
- Guided mode: the free-text box is replaced by a single "Ask <agent>" suggestions menu. It appears once the conversation has messages, or from the start when there are no initial suggestions to pick (agents with Dynamic suggestions, whose suggestion cards are not ported).
- Follow-up suggestions are shown only on the latest message; selecting one sends it. A question set with `inline: true` is answered through these choices; otherwise `Questionnaire` shows above the composer.
- Ratings (`GenAIMessageFeedback`) appear on the last completed agent message of each answer; a dislike opens an optional comment dialog; after rating, the selection is shown as status.
- Disclaimer (`Verify AI-generated content for accuracy.`) appears below the composer once at least one completed agent answer exists (FR-017).
- History (`ConversationHistory`): shown side by side in `fullpage`/`dialog` when wide enough, otherwise replaces the conversation; in the utilities column it scrolls within the same height limit as the conversation (28rem); scrolling to the last item loads more; selecting closes it in replace mode.
- System messages render as centred, de-emphasised lines; progress items (`GenAIMessageProgress`) show a heading and a spinner or check per step.
- Auto-scroll follows streaming text while the user is at the bottom; scrolling up shows a "Scroll to latest message" button.

## 5. Host integration

### 5.1 `CaseView` (`components/template/CaseView/CaseView.tsx`)

Port of the agent parts of `REF:packages/dx-components/src/components/Templates/CaseView/index.jsx` (L186–L198, L264–L276) and `REF:packages/cosmos-work/src/components/CaseView/CaseView.tsx` (L537–L549).
- New optional prop `coaches` (from config props).
- Context ID: data object → `"<pxObjClass> <pyGUID>"`, else the full case ID (research R9).
- Calls `useGenAICoachObj(<coaches when the runtime is Infinity and the list is non-empty, else undefined>, contextID, getPConnect(), true, true)`.
- When the hook returns props and the view is not in assignment-only mode (`displayOnlyFA`), renders `getComponentFromMap('GenAICoachContent')` with those props, `allowFullScreen` and `variant={{ placement: 'utilities', state, onStateChange }}` (state starts `minimized`) in the right column (`Grid2 size={{ xs: 3 }}`), after the utilities region as in the source.
- Tabs: a tab with a view `name` loads through `DeferLoad` as before; a tab without one (a widget in the Tabs region, such as the agent widget) renders `tab.getPConnect().getComponent()` inside a `Card` keyed by the tab, as the source renders all tabs (research R11).
- Tab views created in App Studio use the `TabContent` template (`components/template/TabContent/`, registered in the component map and as `'template'` in the overrides map, and listed in the View's templates without a header); it lays out the view's regions and renders their widgets, such as the agent (research R11).
- Otherwise: no change.

### 5.2 `AppShell` (`components/template/AppShell/AppShell.tsx`) and `PortalAgentContext`

Port of the portal agent parts of `REF:packages/dx-components/src/components/Templates/AppShell/index.jsx` and of `PortalAgentContext.ts` (research R12).
- `navDisplayOptions` type widened with optional `enableAIAgent`, `selectedAgents`, `aiAssistantWidth` ([configuration-inputs.md](./configuration-inputs.md) §2).
- Default (non-WSS) branch only: `portalAgentElement`, one memoised synthetic `GenAICoach` node (`isPortalAgent: true`, context = shell context name, `pageReference: 'pyPortal'`) rendered with `createPConnectComponent()`.
- `PortalAgentContext` (`components/helpers/PortalAgentContext.ts`, shared by overrides like `NavContext`) value: `{ showAgentPanel, agentExpanded, pagePanel: { content: <page content>, visible: showPageContent && !agentExpanded }, onAgentToggle, onAgentClick }`. The source's `isPortalAgent`, `showPageContent`, `agentPanelWidth` and `onAgentPanelResize` members have no reader in the SDK and are not ported (research R12).
- When the assistant exists, the content area renders `portalAgentElement` inside the provider instead of the page content; the widget renders the page through `pagePanel`.
- Display state machine: [data-model.md](../data-model.md) §10. A page shown on `app/primary` (except the startup navigation to the home page), a case opened and a case created leave full width and show the page.
- Narrow screens (FR-029): below the `md` breakpoint the assistant is shown full width only, and the events that would switch it beside the page hide it instead.
- WSS branch and all behaviour when the assistant is not enabled: unchanged.

### 5.3 `NavBar` (`components/infra/NavBar/NavBar.tsx`)

- New optional prop `agent?: { id: string; name: string; icon: ReactNode; active: boolean; onClick: () => void }`, the shape of the Cosmos `AppShell` `agent` prop the source passes.
- When present, render one additional navigation entry after the page list with `icon`, `name` (`localizedVal('AI Assistant', 'AppShell')`, supplied by `AppShell`) and selected state from `active`.
- When absent: no change. A short comment states why the prop exists (Constitution IV).

### 5.4 `PortalAgentSplitView` (`components/designSystemExtension/PortalAgentSplitView/`)

MUI port of `REF:packages/cosmos-work/src/components/GenAICoach/PortalAgentSplitView.tsx` without the resize handle. Props: `children` (agent panel), `pagePanel: { content, visible }`, `showAgentPanel`, `agentExpanded`.
- Agent region: default width 31.25rem, never below 20rem, full width when `agentExpanded`; its content renders from the first time `showAgentPanel` is true and stays mounted; hidden with `aria-hidden` and `inert`.
- Page region: always rendered; hidden with `aria-hidden` and `inert` when `pagePanel.visible` is false.
- Below the `md` breakpoint the regions are never side by side (FR-029).

### 5.5 Landing pages and `UtilitiesLayout` (research R21)

- Page templates `DefaultPage` (grid and banner layouts), `InlineDashboardPage`, `ListPage`, `BannerPage`, `OneColumnPage`, `TwoColumnPage`, `NarrowWidePage` and `WideNarrowPage` accept the optional `coaches` and `localeReference` props, call `usePageGenAICoach(getPConnect, coaches, localeReference)` and return `withPageUtilities(page, genAICoachProps)` (both in `components/template/utils.tsx`). Without agents (or outside the Infinity runtime) the page is returned unchanged.
- `UtilitiesLayout` (`components/designSystemExtension/UtilitiesLayout/`, no `getPConnect`) props: `genAICoachProps` (the hook result without `variant`), `defaultExpandUtilities`, `disabled`, `onToggleUtilities`.
  - Collapsed (default): a 3rem strip with an Expand button (`aria-expanded`) and a fixed "Chat with AI" button at the page's bottom end (`aria-haspopup="dialog"`, `aria-expanded`). The button toggles `GenAICoachContent` with `variant={{ placement: 'dialog', onClose }}` in a non-modal 25rem `Popper` anchored to it (`role="dialog"`), so the page stays scrollable and usable; it takes the focus when opened, Tab cycles within it, Escape and the panel's Close button close it and return focus to the button, and a click outside closes it while still reaching the page (clicks in the menus and dialogs the agent opens count as inside).
  - Expanded: at lg and above, a 25rem sticky column with a "Utilities" heading, the Collapse button and `GenAICoachContent` with `variant={{ placement: 'fullpage' }}` and `isInLandingPageUtilities`; between md and lg, the same content in a persistent drawer at the end. Collapsing returns focus to the toggle.
  - Below md: `GenAICoachContent` full page after the page content.
- `GenAICoachContent` in the `dialog` placement shows a Close button (`aria-label` "Close - Chat with AI") after the actions menu, which still offers Fullscreen; the fullscreen copy (`isFullscreenView`) shows "Exit fullscreen" instead.

## 6. Localization

SDK pattern (research R14): `const localizedVal = PCore.getLocaleUtils().getLocaleValue;` with `localeCategory = 'GenAICoach'` in the widget and its sub-components and `'AppShell'` in `AppShell` and `NavBar`; English text is the key. Where the ported Cosmos code uses `t('<key>')`, the text is that key's English value in `REF:packages/cosmos-core/src/i18n/default.ts`, which takes precedence over the table below. The source's `getLocalizationService().getLocalizedText` calls are kept.

| Area | Texts |
|---|---|
| Panel | `Agent`, `How can I help you today?`, `Switch agent`, `New chat`, `Your chats`, `Back`, `No conversations found`, `Fullscreen`, `Exit fullscreen`, `Minimize`, `Maximize`, `Close`, `Actions`, `Actions - {1}` |
| Composer | `Write a message`, `Send`, `Stop`, `Attach file`, `Remove attachment`, `Preview`, `Ask {1}` |
| Status | `Generating response`, `Working on request`, `Response stopped`, `New message from agent`, `Scroll to latest message` |
| System messages | `Case "{1}" created`, `Case "{1}" opened` |
| Ratings | `Good response`, `Bad response`, `Share feedback`, `Add a comment (optional)`, `Submit`, `Cancel` |
| Questions | `Previous`, `Next`, `Other`, `Dismiss`, `{1} of {2}` |
| Notices | `Verify AI-generated content for accuracy.`, `Action approval is not available in this application.` |
| Application assistant | Widget actions `Full width`, `Split width`, `Hide`; navigation entry `AI Assistant` (category `AppShell`) |
| Via `getLocalizationService().getLocalizedText` (platform translations) | `Today`, `Previous 7 Days`, `Previous 30 Days`, `Agent configuration is incomplete. Kindly associate the required Agent rules.`, `Something went wrong. Try again.`, `Please wait for the attachments to finish uploading.`, `File is too big. Max allowed size is {1}MB.` |

## 7. Accessibility

- Message list has an accessible name; new agent messages and the generating status are announced politely.
- Every icon button has an accessible name; rating buttons expose `aria-pressed`; disclosure buttons expose `aria-expanded`.
- Keyboard: all controls reachable with Tab; Enter/Shift+Enter in the composer; Escape closes dialogs and menus.
- Focus returns to the composer after send, Stop, dismissing questions and closing history; dialogs return focus to their trigger.
- Animations respect reduced-motion preferences.

## 8. Security

- Answers are rendered without raw HTML; links limited to `http`, `https`, `mailto`, `tel`; external links open with `rel="noopener noreferrer"`; only links with case query parameters or to the configured Infinity server can open a case in the application (research R3, R13).
- No credentials, URLs or tokens in component code; all requests go through the engine.
