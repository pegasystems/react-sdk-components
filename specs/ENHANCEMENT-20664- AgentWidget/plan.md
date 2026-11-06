# Implementation Plan: AI Agent Experience in Case View and Application Pages (Infinity '25)

**Branch**: `001-ai-agent-assistant` (feature directory name; the work is on `agent-poc-25`, created from `release/25`) | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-agent-assistant/spec.md`

## Summary

Applications built with the React SDK's `release/25` line ignore the AI agents configured in Pega Infinity '25. This feature adds the agent experience where the '25 standard portal offers it: an agent panel in the case view's utilities column, agent widgets placed in a case's tabs or on a page, and the agents configured on landing pages (dashboards, lists and other pages), opened from a "Chat with AI" button in the page's utilities strip.

Technical approach:
- Port the Constellation 25.1.5 agent implementation the way existing SDK components were ported from Constellation: names, logic and comments kept, Cosmos UI rebuilt with MUI, out-of-scope features left out (voice input, the AI tracer, the lightbox preview and the legacy `GenAICoachOld` widget). The MUI components built for the Infinity '26 port are reused and aligned with the '25 component contract.
- The engine's GenAI assistant API (`PCore.getGenAIAssistantUtils()` in the bundled engine 25.1.3; no engine work) is called directly, as the source does, with call-site casts where the 4.1 typings lag. Conversations are created when an agent opens, as in the '25 portal. Streamed answers are read as in the '25 source: `message` and `toolReasonEnd` events, then the final JSON with the message ID and follow-up questions.
- Formatted answers are parsed with `marked`, the parser the standard portal uses, and rendered as MUI elements, never as raw HTML. Links to cases of the application open inside the application.
- Session cache in the engine store through PConnect, as in the source.
- Host changes ported from the Constellation `CaseView` and page templates.

## Terminology

| Spec (user-facing) | Plan and code |
|---|---|
| Agent (agent or coach kind) | `GenAICoach` widget; coach option `type: 'agent' \| 'coach'`; answers are `from: 'coach'` messages |
| Agent panel in the case view | `GenAICoachContent` with `variant.placement: 'utilities'` |
| Expand / collapse the case view panel | Maximize / Minimize (`variant.state` `maximized` / `minimized`) |
| Agent placed on a page or in a case's tabs | `GenAICoach` widget with `variant.placement: 'fullpage'` |
| Page agent, "Chat with AI" | `UtilitiesLayout` with `genAICoachProps`; `usePageGenAICoach`, `withPageUtilities` |
| Ratings (like/dislike) | Feedback (`GenAIMessageFeedback`, `feedback`, `likeAgentMessage`/`unLikeAgentMessage`) |
| Copy an answer | Message action `copy-response` (`messageActions`); confirmation `toastMessage` |

## Technical Context

**Language/Version**: TypeScript (repository `tsconfig.json`); React 18.3 in the workspace (`release/25`), package peer range `^17.0 || ^18.0`

**Primary Dependencies**: MUI v6 (`@mui/material` `^6.5.0`, `@mui/icons-material`, `@mui/styles` `makeStyles` as in sibling components); engine `@pega/constellationjs` 25.1.3 (`~25.1.3`, global `PCore`/`PConnect`); `@pega/pcore-pconnect-typedefs` 4.1.0 unchanged, with call-site casts where it lacks the assistant API; `@pega/auth` (`SdkConfigAccess`, already used by `helpers/utils.ts`); new: `marked ^15.0.6`. Source ported: `constellation-frontend` `release/25.1.5`, commit `59ee8ec177`

**Storage**: No client persistence. Conversations, messages, ratings and attachments are stored by the platform; session cache in the engine store via `pConnect.updateState` under `genAICoach`

**Testing**: Jest + Testing Library for units and components; Playwright for end-to-end flows against a 25.1.x server. The source's unit tests are to be ported; test tasks are developer-owned

**Target Platform**: Evergreen desktop and mobile browsers (Fetch streams, `TextDecoder`); Pega Infinity 25.1.x server; React SDK default portal; embedded mode unaffected

**Project Type**: Component library (`packages/react-sdk-components`, published as `@pega/react-sdk-components`; the overrides package is generated from it)

**Performance Goals**: First streamed text no later than 1 s after the standard portal (SC-003); UI updates per network chunk while streaming

**Constraints**: Engine APIs only, no HTTP (Constitution I); no changes outside `react-sdk-components`; ported code follows the repository's adaptation rules; backward compatible when no agents are configured (Constitution III); answers never rendered as raw HTML; the `release/25` dependency set (React 18) is kept

**Scale/Scope**: One widget folder (`GenAICoach`), 8 registered design system extension components, one hook, four helpers, ten modified templates and two registration files: 27 new files (about 5,000 lines, mostly ported logic) and 14 changed files (+209/−25), including the `marked` dependency. The in-scope source is about 5,600 lines, of which about 730 are Cosmos styles that are not ported. 5 user stories (P1 × 1, P2 × 1, P3 × 3)

### Deviations from Constellation

Each is marked in the code with a `Deviation from Constellation:` comment.

- Links to cases in answers open the case in the SDK application (`openWorkByHandle`) instead of the Pega portal. The case key comes from the link, or, for '25 links that carry only the work ID (`…/<case type route>/<work ID>`), from the routing table and case types through public engine APIs; a key in a link counts only if its class belongs to the application's case types. Other links, and modified clicks, open in a new tab.
- Link text keeps its formatting (`[**N-1001**](…)`), where the Cosmos viewer shows the raw markdown.
- Hosts without agents make no engine-store writes, and the cached conversation is reused only with its conversation ID.
- History renders from hook state, its next page follows from what is loaded, and failed loads without error details still show a message.
- The "file too big" error is always shown.
- Only a complete last answer stops loading: the SDK panel remounts its messages (fullscreen, minimize and maximize, history), which Cosmos never does.
- Attachments: sent files are downloaded (the lightbox is not ported); a pending file can be previewed in a new tab only if its type cannot run scripts (not HTML or SVG).
- MUI equivalents of Cosmos features: the Copy confirmation in a snackbar, the agent avatar and colors in both SDK themes, agents as cards like the other SDK widgets, and the '25 layout.

### Open items

- T027: an agent panel and an agent tab on the same case share one cached conversation slot in the engine store.
- T028: all header actions are in one Actions menu, where the '25 portal shows separate Minimize and Fullscreen buttons.
- T045: ratings on streamed answers that end without a final response cannot be sent (no message ID).

## Constitution Check

*GATE: Checked before the design and re-checked after it. The principles are those of the repository constitution (`.specify/memory/constitution.md` on `master`).*

### Initial gate

| Principle | Gate | Status | Evidence |
|---|---|---|---|
| I. Platform Boundary | No direct HTTP, no custom store, engine APIs only | PASS | Calls go through `PCore.getGenAIAssistantUtils()`, `getAttachmentUtils()` and `getSemanticUrlUtils()`; cache via `pConnect.updateState`. Engine-utility calls are treated as engine-provided access, as in the existing `CaseHistory`, `ListView`, `DataReference` and `Attachment` components; maintainers to confirm this reading of "independent data fetching" |
| II. Component Contracts | Standard props interface; every new component registered | PASS | `GenAICoach` and its 8 sub-components, named after the Constellation components they port, are registered in `sdk-pega-component-map.js` and `override-constants.js` and resolved with `getComponentFromMap`. Not a field component, so value propagation and display-mode delegation do not apply |
| III. Backward Compatibility | No prop removed or renamed; portal and embedded flows unchanged | PASS | Only optional additions (`CaseView` and page-template `coaches`/`localeReference`); nothing renders and nothing is written to the store without agents |
| IV. Infrastructure Protection | Bridge and containers unchanged | PASS | No bridge, container or infra component changes |
| V. Security | No secrets or URLs in source; no custom auth | PASS | Engine-managed auth and routing; the Infinity server URL is read from `sdk-config.json` at runtime; safe rendering |
| VI. Testing Standards | Unit and E2E tests planned; no coverage regression | PASS (planned, developer-executed) | Test tasks are developer-owned and open in tasks.md. The display-mode clause does not apply; see Complexity Tracking |
| VII. Spec and Plan Separation | spec.md technology-agnostic; plan has Complexity Tracking | PASS | spec.md names no tools, libraries or files; Complexity Tracking below |
| VIII. Minimal Change | Smallest effective change; existing patterns; no dead code | PASS | Only the in-scope source is ported; one new dependency; widget and design system extension patterns as in existing ports; review on 2026-11-02 found no unused code |
| IX. UX Consistency | Design-system controls; functional components only | PASS with one justified exception | MUI v6 throughout; hidden native file input, see Complexity Tracking |

### Re-check after design

All gates still PASS. The design keeps the engine boundary (no URLs or HTTP in the agent code), keeps host changes additive and inert without agents, and renders answers safely (no HTML is injected). No new violations were introduced.

Re-checked on 2026-11-02 and 2026-11-04 after the code reviews of the implementation: the fixes (cache reuse only with its conversation, the guided Ask menu as in the '25 source, and the five findings of the 2026-11-04 review) do not affect a gate, nor do the open items. T027 is a behaviour gap inherited from the source and is planned as a fix.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-agent-assistant/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task list
```

### Source Code (repository root)

```text
package.json                                        # + marked
scripts/override-constants.js                       # + GenAICoach: 'widget'; agent components: 'designSystemExtension'
packages/react-sdk-components/
├── package.json                                    # + marked
├── src/
│   ├── sdk-pega-component-map.js                   # + GenAICoach and its 8 design system components
│   ├── hooks/
│   │   └── useGenAICoachObj.ts                     # NEW: port of dx utils/hooks/useGenAICoachObj.ts
│   └── components/
│       ├── helpers/
│       │   ├── message-stream-utils.ts             # NEW: port of dx utils/message-stream-utils.ts
│       │   ├── StreamingContext.ts                 # NEW: from Cosmos GenAIMessage.tsx; read by the markdown renderers (in helpers so overrides share it)
│       │   ├── agent-markdown-renderers.tsx        # NEW: port of dx utils/components/agent-markdown-renderers.tsx, plus the link renderer
│       │   └── agent-inline-edit-utils.ts          # NEW: port of the 26.1.2 case-link utilities
│       ├── widget/GenAICoach/                      # NEW: port of dx Widgets/GenAICoach
│       │   ├── index.tsx
│       │   ├── GenAICoach.tsx                      # widget: context ID, hook, full-page panel
│       │   ├── GenAICoach.types.ts                 # dx types; local engine type declarations
│       │   └── config-ext.json
│       ├── designSystemExtension/                  # NEW: the Cosmos GenAICoach components (MUI), like WssQuickCreate for QuickCreate
│       │   ├── GenAICoachContent/                  # Cosmos GenAICoach.tsx: header actions, empty state, messages, message box, history, fullscreen, toast
│       │   │   ├── GenAICoach.types.ts             # Cosmos types; local Cosmos core type declarations
│       │   │   └── GenAICoach.utils.ts             # Cosmos GenAICoach.utils.ts (with copyToClipboard)
│       │   ├── GenAIMessage/                       # user and agent messages; suggestions; Copy action
│       │   ├── GenAIMessageProgress/               # cycling progress text
│       │   ├── GenAIMessageFeedback/
│       │   ├── AgentRichTextViewer/                # marked tokens rendered as MUI elements
│       │   ├── InitialSuggestedMessage/
│       │   ├── ConversationHistory/                # Back + "History" header
│       │   └── UtilitiesLayout/                    # Cosmos UtilitiesLayout: landing-page utilities strip, "Chat with AI" button
│       └── template/
│           ├── CaseView/CaseView.tsx               # MODIFIED: hook and GenAICoachContent after the utilities region; widget tabs
│           ├── utils.tsx                           # MODIFIED: usePageGenAICoach and withPageUtilities
│           └── {DefaultPage,InlineDashboardPage,ListPage,BannerPage}/ and the One/Two-column, Narrow-wide and Wide-narrow page templates  # MODIFIED: page agents
└── tests/
    ├── unit/hooks/                                 # developer-owned: hook tests
    ├── unit/components/helpers/                    # developer-owned: ported helper tests, case-link tests
    ├── unit/components/widget/GenAICoach/          # developer-owned: ported widget tests
    ├── unit/components/designSystemExtension/      # developer-owned: ported component tests
    ├── unit/components/template/                   # developer-owned: CaseView and page template tests
    └── e2e/Agent/                                  # developer-owned: E2E suite for agent flows
```

**Structure Decision**: Single component-library structure, laid out the way existing SDK components were ported from Constellation: `dx-components` hooks go to `src/hooks/`, its utilities to `src/components/helpers/`, the widget to `components/widget/GenAICoach/`, and each Cosmos agent component becomes an MUI design system extension component in its own registered folder named after its source (`components/designSystemExtension/<Name>/`), as the SDK's other Cosmos clones are (`WssQuickCreate`, rendered by the `QuickCreate` widget). Hosts change additively, ported from the Constellation templates: `CaseView` and the landing-page templates. No bridge, container or infra changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| VI: "Unit tests MUST validate component rendering in both edit and display modes" does not apply | The agent widget has no read-only display mode; tests cover its interactive states instead (empty, loading, streaming, failed, history, ratings, attachments, copy) | Adding an artificial display mode would introduce behaviour the platform does not have |
| IX: "No raw HTML form controls" — a visually hidden native file input behind an MUI button | MUI has no file-picker control, and the browser file dialog requires an input element | The same pattern is already used by the Attachment and FileUtility widgets; an upload library would add a dependency without user value |
