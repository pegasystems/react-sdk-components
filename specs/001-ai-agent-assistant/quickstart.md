# Quickstart: Validating the AI Agent Experience

**Feature**: `001-ai-agent-assistant` | **Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

A manual run-and-check guide that proves the feature end to end. Automated tests are listed in `tasks.md`; this guide does not contain test code.

## Prerequisites

1. **Server**: Pega Infinity 26.1.x reachable from the development machine, with:
   - an application whose case type's case view has at least one **Agent** configured (Agents setting of the case view), and a case type without agents for regression checks;
   - the default portal configured with the **AI assistant** enabled, at least one selected agent, and a known initial width (`Hidden`, `Split-width` or `Full-width`);
   - streaming enabled for the agent; an agent that can create a case, an agent that works on an assignment, and an agent that asks a clarifying question (can be the same agent);
   - an operator whose access group can use these agents, and an OAuth client configured for the React SDK;
   - a CORS policy for `/api/application/v2` that allows the SDK origin and the `user-locale` and `user-timezone` headers, which the engine adds to every agent call (the standard portal is same-origin, so it never needs them).
2. **Workspace**: `react-sdk-components` with dependencies installed (`npm install`) and `sdk-config.json` pointing at the server: `serverConfig.infinityRestServerUrl`, `serverConfig.appPortal` set to the portal that has the AI assistant, and `authConfig.portalClientId`. No secrets in source.
3. **Run**: `npm run start-dev` (port 3502), then open the portal URL of the SDK app in a desktop browser.

## Pre-checks (browser console, after signing in)

| ID | Check | Expected |
|---|---|---|
| P1 | `PCore.getEnvironmentInfo().isInfinityRuntime()` | `true` |
| P2 | `typeof PCore.getGenAIAssistantUtils().getAgent` | `'function'` |
| P3 | `PCore.getEnvironmentInfo().environmentInfoObject.pyExecutionRuntimeName` | `'Infinity'` |
| P4 | Network tab after opening an agent panel | A request for the agent configuration succeeds (no 404/403, no CORS error; a CORS-blocked call shows "Network Offline" in the panel) |

If P1 or P3 fails, the agent experience stays hidden by design (research R18); fix the environment first.

## Validation scenarios

| ID | Story / FR | Steps | Expected outcome |
|---|---|---|---|
| V1 | US1, FR-001 | Open a case of the type with an agent | Agent card in the right column after the utilities, collapsed, showing the agent name |
| V1b | US1, FR-001 | Open a case whose case page has an agent tab created in App Studio (a tab view with the agent, for example "AI Assistant"); select that tab, then another tab and back; chat until the answer is longer than the screen; also open a tab view with fields, and one with a two-column layout | The agent shows full page in the tab, as in the standard portal (no "Failed to display content"); other tabs show their own content; the conversation is kept when returning to the tab; the conversation scrolls inside the panel; fields show read-only; two-column regions sit side by side when the tab is wide enough |
| V2 | US1, FR-008/009 | Expand the card; check Network | Configuration loads; welcome text and up to 4 suggestions; **no** conversation created yet |
| V3 | US1, FR-010/014 | In a new conversation, send a question that produces a formatted answer (list, table, link, and a link to a case in the application); ask the agent to create a case and select the case link in its answer; Ctrl/Cmd-click a case link | User message appears at once, also the first message while the conversation is created; working indicator; answer appears progressively, formatted; tables scroll horizontally; links open in a new tab; case links, including the link to the case just created, open that case in the SDK app; a Ctrl/Cmd-click opens the link in a new tab |
| V4 | US1, FR-011 | Ask a long question and choose Stop while streaming | Generation stops within 2 s; partial text kept; "Response stopped" line; a new message can be sent |
| V5 | US1, FR-006 | With two agents configured, switch agent and back; then switch agent while an answer is streaming, and switch back | Each agent keeps its own conversation; the interrupted answer is kept as far as it got, and Send is available again (no endless "Generating response") |
| V6 | US2, FR-002/003 | Open the portal | "AI Assistant" entry in the navigation; assistant starts in the configured width |
| V7 | US2, FR-003/004 | Open the assistant, chat, navigate to another page, open a case, hide and reopen, switch full width and back; with the assistant at full width, open a page that fails to load | Assistant beside the page; conversation preserved through navigation, hide/show and width changes; opening a case while full width switches to beside-the-page; the error banner is shown above the assistant even when the page is hidden |
| V8 | US3, FR-018/019 | Ask the agent to create a case; ask it to work on an assignment on the open case | Progress items with steps; "Case "…" created" confirmation; assignment steps complete one by one; case fields updated by the agent appear without refresh |
| V9 | US4, FR-020/021 | Trigger a clarifying question with ≤3 options; then one with several questions or many options | Inline quick choices for the first; a step-by-step form (searchable "Other" when >5 options) for the second; the agent continues after answers; Dismiss closes the questions |
| V10 | US5–US7 | Open history (right after loading the page, before any other action), scroll to load more, reopen a past conversation, then start a new chat; open another conversation from history while an answer is streaming; attach a file, preview it before sending, then send (also try one over the size limit); like one answer, dislike another with a comment | History lists the conversations on the first open, grouped by recency; past conversation restored with ratings and attachments; new chat shows the agent's welcome text and suggestions (and, for a guided agent, a way to start); the streaming answer stops and does not appear in the other conversation; upload progress, preview and size error shown; ratings shown as selected and present after reopening |
| V11 | R7 (verification U4) | Use an agent whose actions normally need approval | Actions run without an approval step, **or** a read-only notice says approval is not available; record which, to confirm server behaviour |
| V12 | R16 (verification U5) | Browser console while opening agent-enabled cases | No "component not found" errors for `AIAgentObject`/`GenAICoachObject` |
| V13 | R10 (verification U6) | Chat with the agent, then submit the case's assignment; inspect the submit request | The request body contains no `genAICoach` data |
| V14 | US8, FR-030 | Open a landing page with an agent configured on it (for example an Inline Dashboard, a list page and a default page); select the "Chat with AI" button at the bottom end, ask a question, scroll the page while the agent is open, close the agent with Close, with Escape and by clicking on the page, and reopen it; use Fullscreen and exit it; expand the utilities and collapse them; open a page without agents; repeat at a narrow width | The agent opens next to the button with its welcome message and suggestions; the page stays scrollable while it is open, and a click on the page closes it and still acts on the page; the conversation is kept when reopened on the same page; Fullscreen works and returns to the panel; expanded, the agent is shown beside the page (a drawer on medium screens); pages without agents are unchanged; at narrow widths the agent follows the page content |

## Regression checks

| ID | Steps | Expected |
|---|---|---|
| G1 | Open a case of a type with no agents | Case view identical to before (layout, regions, actions) |
| G2 | Open a portal without the AI assistant enabled | Navigation and layout unchanged |
| G3 | Run the embedded (assignment-only) sample | No agent UI; behaviour unchanged |
| G4 | Open the self-service (WSS) portal | No assistant; unchanged |

## Security and accessibility checks

| ID | Steps | Expected |
|---|---|---|
| S1 | Ask the agent to repeat text containing a script tag, an embedded frame, and a `javascript:` link (SC-006) | Shown as plain text; nothing executes; the unsafe link is not clickable |
| A1 | Use only the keyboard: open the agent, send, Stop, open history, rate, answer questions (SC-007); with a guided agent, maximize the case agent and pick a prompt from the Ask menu; type a message, open Fullscreen and exit it | Every control reachable and operable; focus returns to the message box after send/Stop/dismiss; for the guided agent, focus moves into the panel on maximize, to the progress indicator while answering and back to the Ask button afterwards (never to the page body); the typed text is kept in and after fullscreen |
| A2 | Use a screen reader while an answer arrives | "Generating response" and the new agent message are announced |
| L1 | Switch the operator's locale to another supported language | Panel labels and history group names appear in that language |
| N1 | Narrow the browser to 320 pixels wide; on a case use "Fullscreen" in the agent card; then open the AI Assistant from the navigation | The case agent dialog is full screen; the assistant opens full width over the page and hiding it shows the page again; nothing needs horizontal scrolling (FR-029) |

## Parity and timing checks

| ID | Steps | Expected |
|---|---|---|
| PT1 | Run V1–V10 with the same operator, agents and prompts in the standard Pega portal and in the SDK app; record each outcome side by side | Every outcome matches (SC-002), except that a link to a case opens the case in the SDK app instead of a new tab (accepted deviation, research R13), and the first message of a conversation shows while the conversation is created rather than after (research R6 step 2) |
| PT2 | For three prompts, measure the time from Send to the first visible answer text in both applications (browser performance timeline or a screen recording) | The SDK app's median is no more than 1 s later than the standard portal's (SC-003) |

## Done when

All V, G, S, A, L, N and PT checks pass, and the outcomes of V11–V13 are recorded in `research.md` (verification items U4–U6).
