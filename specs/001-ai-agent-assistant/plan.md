# Implementation Plan: AI Agent Experience in Case View and Application Assistant

**Branch**: `001-ai-agent-assistant` (feature directory name; no git branch created) | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-agent-assistant/spec.md`

## Summary

Applications built with the React SDK ignore the AI agents configured in Pega Infinity '26. This feature adds the agent experience in three places: an agent panel in the case view's utilities column, an application-wide AI Assistant opened from the navigation and shown beside the current page, and the agents configured on landing pages (dashboards, lists and other pages), opened from a button in the page's utilities strip (added later; research R21).

Technical approach ([research.md](./research.md)):
- Port the Constellation 26.1.2 agent implementation the way existing SDK components were ported from Constellation: names, logic and comments kept, Cosmos UI rebuilt with MUI, out-of-scope features left out (R15; port map in research.md). This covers the `GenAICoach` widget, the `useGenAICoachObj` and `useAgentStreamHandler` hooks, the stream and markdown helpers, and MUI versions of the Cosmos agent components, each registered so it can be overridden (Constitution II, R16).
- The engine's GenAI assistant API (`PCore.getGenAIAssistantUtils()` in the bundled engine 26.1.0; no engine work) is called directly, as the source does, with call-site casts where the 4.1 typings lag (R1, R2). The stream protocol, case-action progress and agent questions follow [contracts/stream-events.md](./contracts/stream-events.md) (R4, R5, R8).
- Formatted answers are parsed with `marked`, the parser the standard portal uses, and rendered as MUI elements, never as raw HTML (R3, R13).
- Session cache in the engine store through PConnect (R10).
- Host changes ported from the Constellation `CaseView` and `AppShell` (R11, R12; [contracts/ui-components.md](./contracts/ui-components.md)): the case view calls the hook and shows the agent in its utilities column; the application assistant uses `PortalAgentContext` and `PortalAgentSplitView`, with a new optional `NavBar` entry. On narrow screens the application assistant opens full width (FR-029).

## Terminology

| Spec (user-facing) | Plan, contracts and code |
|---|---|
| Agent (agent or coach kind) | `GenAICoach` widget; coach option `type: 'agent' \| 'coach'`; answers are `from: 'coach'` messages |
| Application-wide assistant, AI Assistant | Portal agent; `isPortalAgent`; `PortalAgentContext`; `PortalAgentSplitView` |
| Agent panel in the case view | `GenAICoachContent` with `variant.placement: 'utilities'`; cache instance `caseview` |
| Expand / collapse the case view panel | Maximize / Minimize (`variant.state` `maximized` / `minimized`) |
| Ratings (like/dislike) | Feedback (`GenAIMessageFeedback`, `feedback`, `likeAgentMessage`/`unLikeAgentMessage`) |
| Agent questions | Questionnaire (`questionnaireProvided`, `Questionnaire`, `questionnaireData`) |
| Agent actions on cases | Tool calls (`toolCallStart`/`toolCallEnd`), progress steps (`GenAIMessageProgress`) |

## Technical Context

**Language/Version**: TypeScript (repository `tsconfig.json`); React 19.2 in the workspace, package peer range `^18 || ^19`

**Primary Dependencies**: MUI v6 (`@mui/material`, `@mui/icons-material`, `@mui/styles` `makeStyles` as in sibling widgets); engine `@pega/constellationjs` 26.1.0 (global `PCore`/`PConnect`); `@pega/pcore-pconnect-typedefs ~4.1.0` unchanged, with call-site casts where it lacks the 26.1 assistant signatures (R2); new: `marked ^15.0.6` (R3). Source ported: `constellation-frontend` `release/26.1.2` (R15)

**Storage**: No client persistence. Conversations, messages, ratings and attachments are stored by the platform; session cache in the engine store via `pConnect.updateState` under `genAICoach` (R10)

**Testing**: Jest + Testing Library (jsdom, ts-jest) for units and components; Playwright for end-to-end flows against a 26.1.x server. The source's unit tests are ported (R20). Developer-owned. No Jest configuration change (`marked` ships a CommonJS build)

**Target Platform**: Evergreen desktop and mobile browsers (Fetch streams, `TextDecoder`); Pega Infinity 26.1.x server; React SDK default portal (not WSS); embedded mode unaffected

**Project Type**: Component library (`packages/react-sdk-components`, published as `@pega/react-sdk-components`; the overrides package is generated from it)

**Performance Goals**: First streamed text no later than 1 s after the standard portal (SC-003); Stop to next send within 2 s (SC-004); UI updates batched per network chunk while streaming

**Constraints**: Engine APIs only, no HTTP (Constitution I); no changes outside `react-sdk-components`; ported code follows the repository's adaptation rules (R15); backward compatible when no agents are configured (Constitution III); Infinity runtime only (R18); answers never rendered as raw HTML (R3)

**Scale/Scope**: One new widget folder (`GenAICoach`) and 9 registered design system extension components (each with a folder and `index.tsx`), two hooks in `src/hooks/`, two helpers in `src/components/helpers/`, `PortalAgentContext.ts`, three modified components (`CaseView`, `AppShell`, `NavBar`), registration and package files. About 6,000–7,000 lines, mostly ported logic (the in-scope source is about 10,700 lines, including 1,700 lines of Cosmos styles that are not ported). 7 user stories (P1 × 2, P2 × 2, P3 × 3)

All unknowns are resolved in research.md (R1–R20). Runtime verification items U1–U6 are covered by [quickstart.md](./quickstart.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-research gate

| Principle | Gate | Status | Evidence |
|---|---|---|---|
| I. Platform Boundary | No direct HTTP, no custom store, engine APIs only | PASS | R1, R10: calls go through `PCore.getGenAIAssistantUtils()` and `getAttachmentUtils()`; cache via `pConnect.updateState`; agent case updates left to the engine. Engine-utility calls are treated as engine-provided access, as in the existing `CaseHistory`, `ListView` and `DataReference` (`PCore.getDataApiUtils()`) and `Attachment` and `FileUtility` (`PCore.getAttachmentUtils()`) components; maintainers to confirm this reading of "independent data fetching" |
| II. Component Contracts | Standard props interface; every new component registered in the master registry | PASS | `GenAICoach` and its 9 sub-components (`GenAICoachContent`, `GenAIMessage`, `GenAIMessageProgress`, `GenAIMessageFeedback`, `ConversationHistory`, `Questionnaire`, `InitialSuggestedMessage`, `PortalAgentSplitView`, `AgentRichTextViewer`), named after the Constellation components they port, are registered in `sdk-pega-component-map.js` and `override-constants.js` and resolved with `getComponentFromMap` (R16). Not a field component, so value propagation and display-mode delegation do not apply |
| III. Backward Compatibility | No prop removed or renamed; portal and embedded flows unchanged | PASS | Only optional additions (`CaseView` `coaches`, widened `navDisplayOptions`, `NavBar` `agent`); nothing renders without agents (quickstart G1–G4) |
| IV. Infrastructure Protection | Bridge and containers unchanged; infra edits commented and validated in both modes | PASS with obligations | Bridge and containers untouched. `NavBar` (infra) gains one optional prop with an explanatory comment; validate portal and embedded modes (G2, G3) |
| V. Security | No secrets or URLs in source; no custom auth | PASS | Engine-managed auth and routing; configuration via `sdk-config.json`; safe rendering (R3, R13) |
| VI. Testing Standards | Unit and E2E tests planned; no coverage regression | PASS (planned, developer-executed) | R20; coverage compared with `main` in a dedicated developer-owned task. The display-mode clause does not apply; see Complexity Tracking |
| VII. Spec and Plan Separation | spec.md technology-agnostic; plan has Complexity Tracking | PASS | Spec checklist confirms no tool, library or file names; Complexity Tracking below |
| VIII. Minimal Change | Smallest effective change; existing subtype patterns | PASS | Typings upgrade deferred (R2); ported files keep the source's structure and the repository's existing port conventions (R15); one widget plus three additive host edits; one new dependency, justified (R3) |
| IX. UX Consistency | Design-system controls; functional components only | PASS with one justified exception | MUI v6 throughout (R19); hidden native file input, see Complexity Tracking |

### Post-design re-check (after Phase 1)

All gates still PASS. The design keeps the engine boundary (no URLs or HTTP in [contracts/engine-genai-assistant.md](./contracts/engine-genai-assistant.md) §2.2), keeps host changes additive and inert without agents ([contracts/ui-components.md](./contracts/ui-components.md) §5), defines safe rendering ([contracts/ui-components.md](./contracts/ui-components.md) §8) and keeps tests in scope for the developer (quickstart plus R20). No new violations were introduced.

Re-checked after `/speckit-analyze` (2026-10-09): sub-component registration (II) and the coverage gate (VI) were added; the narrow-screen rule for the application assistant now covers FR-029; the override mapping now points `GenAICoach` at its own folder so relative imports resolve in the generated overrides package (R16).

Re-checked on 2026-10-13 after aligning the plan with the repository's practice of porting components from Constellation (R15): all gates still PASS. The sub-component names now follow the Constellation components (II), the hooks moved to the package-level `src/hooks/` like other ported hooks, and the new-dependency count drops to one (VIII).

Re-checked on 2026-10-13 after aligning the code with the standards of the existing SDK components (VIII: "New code follows existing patterns for its component subtype"): the widget keeps the widget pattern (`PConnProps` interface, `config-ext.json`), and the Cosmos ports moved to `designSystemExtension/` with the design system extension pattern (no `PConnProps`, no `config-ext.json`, resolved with `getComponentFromMap`), as `WssQuickCreate` is for the `QuickCreate` widget. The header actions follow the source's single "Actions" menu, and the case view renders the agent after the utilities region, as the source does. All gates still PASS.

Re-checked after the second `/speckit-analyze` (2026-10-13): `PortalAgentContext` keeps only the members the SDK reads (VIII), test tasks now cover the portal actions, the history layout and the attachment UI (VI), and the case-link handling is recorded as a deviation (R13).

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-agent-assistant/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── engine-genai-assistant.md
│   ├── stream-events.md
│   ├── configuration-inputs.md
│   └── ui-components.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
package.json                                        # + marked
scripts/override-constants.js                       # + GenAICoach: 'widget'; agent components: 'designSystemExtension' (R16)
packages/react-sdk-components/
├── package.json                                    # + marked
├── src/
│   ├── sdk-pega-component-map.js                   # + GenAICoach, its 10 design system components and TabContent
│   ├── hooks/
│   │   ├── useGenAICoachObj.tsx                    # NEW: port of dx utils/hooks/useGenAICoachObj.tsx
│   │   └── useAgentStreamHandler.ts                # NEW: port of dx utils/hooks/useAgentStreamHandler.ts
│   └── components/
│       ├── helpers/
│       │   ├── message-stream-utils.ts             # NEW: port of dx utils/message-stream-utils.ts
│       │   ├── PortalAgentContext.ts               # NEW: port of dx Templates/AppShell/PortalAgentContext.ts (in helpers so overrides share it, like NavContext)
│       │   ├── StreamingContext.ts                 # NEW: from Cosmos GenAIMessage.tsx; read by the markdown renderers (in helpers for the same reason)
│       │   ├── agent-markdown-renderers.tsx        # NEW: port of dx utils/components/agent-markdown-renderers.tsx (links, code)
│       │   └── agent-inline-edit-utils.ts          # NEW: port of dx utils/components/agent-inline-edit-utils.ts (case links, research R13)
│       ├── widget/GenAICoach/                      # NEW: port of dx Widgets/GenAICoach
│       │   ├── index.tsx
│       │   ├── GenAICoach.tsx                      # widget: runtime gate, context ID, hook, portal actions and split view
│       │   ├── GenAICoach.types.ts                 # dx types; local engine type declarations
│       │   └── config-ext.json
│       ├── designSystemExtension/                  # NEW: the Cosmos GenAICoach components (MUI), like WssQuickCreate for QuickCreate
│       │   ├── GenAICoachContent/                  # Cosmos GenAICoach.tsx: header actions, empty state, messages, composer, history and question slots
│       │   │   ├── GenAICoach.types.ts             # Cosmos types; local Cosmos core type declarations
│       │   │   └── GenAICoach.utils.ts             # Cosmos GenAICoach.utils.ts
│       │   ├── GenAIMessage/                       # user, coach and system messages; suggestions
│       │   ├── GenAIMessageProgress/
│       │   ├── GenAIMessageFeedback/
│       │   ├── AgentRichTextViewer/                # marked tokens rendered as MUI elements
│       │   ├── InitialSuggestedMessage/
│       │   ├── ConversationHistory/
│       │   ├── Questionnaire/
│       │   ├── PortalAgentSplitView/               # without the resize handle
│       │   └── UtilitiesLayout/                    # Cosmos UtilitiesLayout: landing-page utilities strip, "Chat with AI" button (R21)
│       ├── template/CaseView/CaseView.tsx          # MODIFIED: hook and GenAICoachContent after the utilities region; widget tabs
│       ├── template/TabContent/                    # NEW: port of dx Templates/Tab/TabContent (tab views App Studio creates)
│       ├── template/utils.tsx                      # MODIFIED: usePageGenAICoach and withPageUtilities for landing pages (R21)
│       ├── template/{DefaultPage,InlineDashboardPage,ListPage,BannerPage}/ and the One/Two-column, Narrow-wide and Wide-narrow page templates  # MODIFIED: page agents (R21)
│       ├── template/AppShell/AppShell.tsx          # MODIFIED: portal agent, display state, events
│       └── infra/NavBar/NavBar.tsx                 # MODIFIED: optional `agent` navigation entry
└── tests/
    ├── unit/hooks/                                 # developer-owned: ported hook tests
    ├── unit/components/helpers/                    # developer-owned: ported helper tests
    ├── unit/components/widget/GenAICoach/          # developer-owned: ported widget tests
    ├── unit/components/designSystemExtension/      # developer-owned: ported and new agent component tests
    ├── unit/components/template/                   # developer-owned: host tests (CaseView, AppShell)
    └── e2e/Agent/                                  # developer-owned: E2E suite for agent flows
```

**Structure Decision**: Single component-library structure, laid out the way existing SDK components were ported from Constellation (R15): `dx-components` hooks go to `src/hooks/`, its utilities to `src/components/helpers/`, the widget to `components/widget/GenAICoach/`, and each Cosmos agent component becomes an MUI design system extension component in its own registered folder named after its source (`components/designSystemExtension/<Name>/`), as the SDK's other Cosmos clones are (`WssQuickCreate`, rendered by the `QuickCreate` widget). Hosts change additively, ported from the Constellation templates: `CaseView`, `AppShell` with the ported `PortalAgentContext.ts`, and the infra `NavBar`. No bridge or container changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| VI: "Unit tests MUST validate component rendering in both edit and display modes" does not apply | The agent widget has no read-only display mode; tests cover its interactive states instead (empty, loading, streaming, stopped, failed, history, questions, ratings, attachments) | Adding an artificial display mode would introduce behaviour the platform does not have |
| IX: "No raw HTML form controls" — a visually hidden native file input behind an MUI button | MUI has no file-picker control, and the browser file dialog requires an input element | The same pattern is already used by the Attachment and FileUtility widgets; an upload library would add a dependency without user value |
