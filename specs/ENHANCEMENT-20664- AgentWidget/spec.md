# Feature Specification: AI Agent Experience in Case View and Application Pages (Infinity '25)

**Feature Branch**: `001-ai-agent-assistant` (feature directory name; branches are managed manually, and this work is on `agent-poc-25`)

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Bring the platform's AI agent experience to applications built with this SDK on the Pega Infinity '25 release line: agent conversations on cases, on application pages and in agent widgets, matching the agent experience of the standard portal for the same platform release."

## Clarifications

### Session 2026-10-28

- Q: Which platform release does this feature target? → A: Pega Infinity '25 (25.1.x). The reference experience is the standard portal of that release line; capabilities the '25 standard portal does not offer are not part of this feature.

### Session 2026-11-02

- Q: Agent answers link to cases through the platform's own portal, which takes users out of the application. What should happen when such a link is selected? → A: The case opens inside the application. Other links still open in a new tab, and a modified click (for example to open a new tab) keeps the browser's behaviour.

### Session 2026-11-03

- Q: The standard portal starts every agent reply with the agent's avatar, also while the reply is being generated. Should the application show it, and how should it look in the application's themes? → A: Yes. Every agent reply starts with the agent avatar, also while it is being generated and when it failed, and the avatar stays clearly visible in both the light and the dark theme of the application.
- Q: On pages the agent has no box around it, while the application's other widgets (such as announcements and the worklist) are shown in boxes. How should the agent appear? → A: Wherever it is placed on a page or in a case, the agent appears in the same kind of box as the application's other widgets, in both the light and the dark theme.
- Q: Side by side with the standard portal, the agent's spacing on pages looks off: it touches the utilities column, leaves empty space above the message box, and its welcome content sits at the top of tall panels. How should it be laid out? → A: As in the standard portal: before the first message, an agent on a page is only as tall as its content, with the message box right below the suggested prompts; in tall panels the welcome content is centered with the message box at the bottom; the utilities column is set apart from the page; the welcome heading is prominent and the suggested prompts are centered buttons in the application's accent color, where that color is readable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat with an AI agent while working on a case (Priority: P1)

A case worker opens a case whose case type has one or more AI agents configured. A collapsed agent panel is shown next to the case details. When the user expands it, the conversation starts and the panel shows the agent's welcome message and suggested prompts. The user types a question (or picks a suggestion), sees the answer appear progressively, can copy an answer, and can switch between agents when more than one is configured.

**Why this priority**: The case view is where most agent configurations live and where users do their work. Without it, configured agents are invisible in SDK applications. This story alone is a usable MVP.

**Independent Test**: Configure an agent on a case type's case view, open a case of that type in the SDK application, expand the panel, ask a question, and receive a progressively displayed answer.

**Acceptance Scenarios**:

1. **Given** a case type with a visible agent configured, **When** the user opens a case of that type, **Then** a collapsed agent panel showing the agent's name is available alongside the case details.
2. **Given** the collapsed panel, **When** the user expands it, **Then** a conversation starts for the case and the agent's welcome message and up to four suggested prompts are shown; if the agent has an initial instruction, it is sent as the user's first message.
3. **Given** the panel is open, **When** the user sends a message, **Then** the message appears immediately, a working indicator with changing status text is shown, and the answer appears progressively until it is complete (or all at once for agents that do not answer progressively).
4. **Given** an answer contains headings, lists, tables, code and links, **When** it is displayed, **Then** it is formatted for reading, nothing in the answer runs as active content, a link to a case of the application opens that case inside the application, and other links open in a new browser tab.
5. **Given** an answer is complete, **When** the user copies it, **Then** its text is copied and a short confirmation (or a failure note) is shown.
6. **Given** several agents are configured, **When** the user switches to another agent and later back, **Then** each agent shows its own conversation, and an answer still being generated for one agent never appears in another agent's conversation.
7. **Given** an agent configured for guided use, **When** the panel is shown, **Then** the user starts from the agent's predefined prompts and continues through an "Ask" menu of those prompts, without typing free text.
8. **Given** the agent has a disclaimer configured, **When** the conversation has messages, **Then** the disclaimer is shown above them; a notice that answers are AI-generated is always shown with the message input.
9. **Given** the panel is open, **When** the user chooses Fullscreen, **Then** the same conversation is shown full screen, and exiting returns to the panel with the conversation and any typed text unchanged.
10. **Given** an agent placed in the case's tabs, **When** the user selects that tab, **Then** the agent fills the tab and its conversation starts.
11. **Given** a case type with no agent configured, **When** the user opens a case of that type, **Then** the case screen looks and behaves exactly as before.
12. **Given** the application is set to another supported language, **When** the panel is shown, **Then** all labels around the conversation appear in that language.

---

### User Story 2 - Use an agent on an application page (Priority: P2)

Application pages such as dashboards, lists and other landing pages can have their own agents. On such a page, a "Chat with AI" button at the page's edge opens the agent next to it, so the user can ask about what the page shows while the page stays usable. The user can also expand the page's utilities area to keep the agent open beside the page. An agent can also be placed directly on a page, where it fills the space it is placed in.

**Why this priority**: Pages are where users start their work, and page agents are configured the same way as case agents. Without this, agents configured on pages are silently missing from SDK applications.

**Independent Test**: Configure an agent on a landing page (for example a dashboard), open the page in the SDK application, open the agent from the button and ask a question.

**Acceptance Scenarios**:

1. **Given** a page with a visible agent configured, **When** the user opens the page, **Then** a "Chat with AI" button is shown at the page's edge, and selecting it opens the agent next to the button with its welcome message and suggestions, while the page can still be scrolled and used.
2. **Given** the page agent is open, **When** the user closes it and opens it again while staying on the page, **Then** the conversation is still there.
3. **Given** the page agent is available, **When** the user expands the page's utilities area, **Then** the agent is shown beside the page and stays open while the user works on the page.
4. **Given** an agent placed directly on a page, **When** the page is shown, **Then** the agent fills its space and its conversation starts.
5. **Given** a page with no agent configured, **When** the user opens the page, **Then** it looks and behaves exactly as before.

---

### User Story 3 - Revisit past conversations and start new ones (Priority: P3)

Users can open a history of their previous conversations with the agent for the same case or page, grouped by recency, reopen one to continue, and start a new chat at any time.

**Why this priority**: Valuable for continuity, but each conversation is useful on its own.

**Independent Test**: Hold two conversations, open history, reopen the first one and continue it.

**Acceptance Scenarios**:

1. **Given** the user has past conversations, **When** they open history, **Then** past conversations for the current agent and context are listed newest first, grouped as Today, Previous 7 Days, Previous 30 Days, and then by month or year.
2. **Given** history is open, **When** the user reaches the end of the list, **Then** older conversations load.
3. **Given** history is open, **When** the user selects a past conversation, **Then** its messages, ratings and attachments are shown and the user can continue it.
4. **Given** history is open, **When** the user goes back, **Then** the current conversation is shown again.
5. **Given** a conversation is in progress, **When** the user starts a new chat, **Then** a new conversation with the welcome message and suggestions is shown and the previous conversation is available in history.

---

### User Story 4 - Attach files to a message (Priority: P3)

Users can attach a file to a message so the agent can use it, see its upload progress, preview it, and remove it before sending.

**Why this priority**: Useful for document-driven tasks, but not needed for most conversations.

**Independent Test**: Attach a file, send a message referencing it, and confirm the message shows the attachment.

**Acceptance Scenarios**:

1. **Given** the user attaches a file, **When** the upload is in progress, **Then** its progress is shown and the message cannot be sent until the upload completes, with a note explaining why.
2. **Given** a file is larger than the application allows, **When** the user attaches it, **Then** an error states the size limit and the file is not sent.
3. **Given** a file is attached, **When** the user previews or removes it before sending, **Then** the file opens for viewing, or is removed and not sent.
4. **Given** a sent message has attachments, **When** the user views the conversation, **Then** the attachments are listed with the message and can be downloaded.

---

### User Story 5 - Rate agent answers (Priority: P3)

Users can like or dislike an answer and, for a dislike, add an optional comment, helping administrators improve the agent.

**Why this priority**: Improves agent quality over time but does not affect completing the user's task.

**Independent Test**: Like one answer and dislike another with a comment, then reopen the conversation and see both ratings.

**Acceptance Scenarios**:

1. **Given** an answer is complete, **When** the user likes it, **Then** the like is recorded and shown as selected.
2. **Given** an answer is complete, **When** the user dislikes it, **Then** they can add an optional comment, and submitting or skipping the comment records the dislike.
3. **Given** a rated conversation, **When** the user reopens it from history, **Then** the ratings are shown.

---

### Edge Cases

- An agent widget is placed without any agent: it explains that the agent configuration is incomplete. Agents hidden through their visibility setting, and agents that cannot be resolved, are simply not shown.
- Starting a conversation fails, including when the platform cannot be reached or returns no details: the panel shows an understandable error instead of an empty conversation.
- An answer fails part-way: the partial answer stays with an error indicator and the user can send again.
- The agent does not support progressive answers: the complete answer appears when ready, with a working indicator in the meantime.
- The user switches agent while an answer is being generated: the answer never appears in another conversation, and the original conversation is loaded again from the platform when the user returns to it.
- Answers contain control content meant for the application (for example follow-up question data): it is never shown to the user, and any follow-up suggestions are offered as suggestions.
- Answers contain wide tables or long code: they scroll inside the message and the panel stays usable.
- Links in answers point to a case of the application: they open that case in the application. If the case cannot be opened there, the link opens in a new tab as in the standard portal. Other links open in a new tab. Unsafe link types are not clickable.
- An agent is shown again in the same context (for example the user returns to a case tab that holds an agent): a new conversation starts, and earlier conversations remain available in history.
- Two agent placements are on the same case or page (for example the case's agent panel and an agent placed in one of its tabs): each keeps its own conversation.
- The user's session expires during a conversation: the application's normal session-expiry handling applies and no message is sent twice.
- Narrow screens: the page agent follows the page content, and the fullscreen view covers the whole screen.
- Embedded (assignment-only) mode: no agent experience is shown and behaviour is unchanged.

## Requirements *(mandatory)*

### Functional Requirements

**Availability and placement**

- **FR-001**: System MUST show a collapsed agent panel in the case view when the case type has at least one visible agent configured, and MUST start the conversation when the user first expands it.
- **FR-002**: System MUST show an agent placed on a page or in a case's tabs in the space it is placed in, and MUST start its conversation when it is shown.
- **FR-003**: System MUST offer the agents configured on an application page (dashboards, lists and other landing pages) from a button at the page's edge that opens the agent next to it without blocking the page, MUST let users show the agent beside the page instead, and MUST keep the page's conversation while the user stays on the page.
- **FR-004**: System MUST show only agents configured as visible, and MUST leave screens unchanged when no agent is configured, in both full-portal and embedded modes.
- **FR-005**: Users MUST be able to switch between configured agents, and each agent MUST keep its own conversation for the session.

**Conversations**

- **FR-006**: System MUST link each conversation to its context (the open case, data record or page) so history and answers relate to the user's current work.
- **FR-007**: System MUST start a new conversation when an agent is first opened in a context, as the standard portal of this release does, and MUST send the agent's initial instruction, when it has one, as the user's first message.
- **FR-008**: System MUST show the agent's welcome message and up to four suggested prompts in an empty conversation, and the agent's disclaimer, when configured, above the messages.
- **FR-009**: System MUST display answers progressively as they are generated when the agent supports it, and as a whole otherwise, with a working indicator while the user waits.
- **FR-010**: System MUST offer the follow-up suggestions provided with the latest answer and MUST send a suggestion when it is selected.
- **FR-011**: For agents configured for guided use, System MUST limit input to the agent's predefined prompts.
- **FR-012**: System MUST display formatted answers (headings, emphasis, lists, tables, code, links), MUST NOT run or render active content contained in answers, MUST open links that point to a case of the application inside the application, and MUST open other links in a new tab.
- **FR-013**: System MUST hide control content embedded in answers from the user.
- **FR-014**: System MUST show understandable error messages when starting a conversation, sending a message, loading history or loading a conversation fails, including when the platform provides no error details.
- **FR-015**: System MUST show a notice that answers are AI-generated with the message input.
- **FR-016**: Users MUST be able to copy the text of an answer, and System MUST confirm whether copying succeeded.
- **FR-017**: Users MUST be able to show the conversation full screen and return to the panel without losing the conversation or the text they typed.

**History**

- **FR-018**: Users MUST be able to view past conversations for the current agent and context grouped by recency, load older ones on demand, and reopen one to continue it.
- **FR-019**: Users MUST be able to start a new chat at any time.

**Attachments**

- **FR-020**: Users MUST be able to attach a file to a message, see its upload progress, preview or remove it before sending, and download it from the sent message; a message MUST NOT be sent while an attachment is still uploading.
- **FR-021**: System MUST apply the application's maximum attachment size and MUST explain the limit when a file exceeds it.

**Feedback**

- **FR-022**: Users MUST be able to like or dislike an agent's answer, with an optional comment for a dislike.

**Accessibility, language, layout and themes**

- **FR-023**: All agent controls MUST be usable with a keyboard alone and labelled for assistive technologies, and new answers MUST be announced to screen-reader users.
- **FR-024**: All text the application shows around the conversation MUST follow the application's language settings.
- **FR-025**: The agent experience MUST remain usable on screens as narrow as a typical phone (320 pixels wide): the page agent follows the page content, and the fullscreen view covers the screen.
- **FR-026**: Each agent reply MUST start with the agent's avatar, as in the standard portal, also while the reply is being generated and when it failed, and the avatar MUST stay clearly visible in the application's light and dark themes.
- **FR-027**: Wherever an agent is shown on a page or in a case, it MUST appear in the same kind of box as the application's other widgets, spaced like them, in the application's light and dark themes.
- **FR-028**: The agent's layout MUST follow the standard portal's: before the first message an agent on a page MUST be only as tall as its content with the message box directly below the suggested prompts; in panels taller than their content the welcome content MUST be centered; the utilities column MUST be visibly separated from the page; and the suggested prompts MUST stay readable in the light and dark themes.

### Key Entities *(include if feature involves data)*

- **Agent**: An AI assistant configured in the application, with a display name, a kind (agent or coach) and visibility. When a conversation starts it also provides its welcome message, disclaimer, suggested prompts, whether it is guided, whether it answers progressively, and an optional initial instruction.
- **Context**: What the user is working on (a case, a data record or a page), to which conversations belong.
- **Conversation**: A dialogue between a user and an agent for one context, with a title, a last-updated time and ordered messages.
- **Message**: An entry in a conversation from the user or the agent, with formatted content, optional attachments, follow-up suggestions, a rating and a status (in progress, complete, failed).
- **Attachment**: A file attached to a message, with its name, size and upload status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing against a platform server of the target release, 100% of in-scope placements (every configured case-view agent, page agent and placed agent widget) are available to users in the SDK application.
- **SC-002**: For a reference set of at least 10 scenarios covering chat, guided use, suggestions, links, copying, history, new chat, attachments and ratings, the SDK application reaches the same outcome as the standard portal in 100% of scenarios, apart from the differences this specification records (case links open inside the application).
- **SC-003**: Users see an answer begin to appear no more than 1 second later than the same answer begins to appear in the standard portal.
- **SC-004**: Screens without agents show no visible or behavioural change, with 0 regressions in the existing case and page acceptance checks.
- **SC-005**: A test set of answers containing scripts, embedded pages and unsafe links results in 0 executions and 0 clickable unsafe links.
- **SC-006**: For links in answers that point to cases of the application, 100% open the case inside the application.
- **SC-007**: An accessibility review finds every agent control operable by keyboard alone and new answers announced by a screen reader, with no critical issues.
- **SC-008**: In usability checks, at least 9 of 10 users can start a conversation, ask a question and reopen a past conversation without help.

## Assumptions

- The application connects to a Pega Infinity '25 (25.1.x) server where agents are configured on case types' case views, on application pages, or placed as agent widgets, and the platform's conversation services are enabled. The platform provides all agent intelligence, conversation storage, case actions and access control; this feature adds only the user-facing experience.
- Behaviour follows the agent experience of the standard portal for the same platform release, presented in the SDK's existing visual style.
- Users are already signed in; no new sign-in or permission model is introduced.
- The content and language of answers come from the platform; only the application's own labels are translated.
- Attachments follow the application's existing size limits and permissions.
- The case view keeps the SDK's existing layout; the agent panel uses the space of its side column.
- Out of scope for this release line, because the '25 standard portal does not offer them: an application-wide assistant, questions asked by the agent, stopping an answer, progress of agent actions on cases, and approving agent actions.
- Also out of scope: recommendations that some agents show when a conversation starts (they need a newer platform client than this release line ships); voice input; tracing; previewing sent attachments inside the application (they are downloaded instead); agents on page types the SDK does not provide; and the legacy coach experience for widgets without agent configuration.
