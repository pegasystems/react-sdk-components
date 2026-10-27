# Feature Specification: AI Agent Experience in Case View and Application Assistant

**Feature Branch**: `001-ai-agent-assistant` (suggested name; no branch created, branches are managed manually)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description (technical directions such as target release, reference implementation, rendering and typing decisions, and the licensing constraint are deferred to the implementation plan): "Bring the platform's AI agent experience to applications built with this SDK: agent conversations on cases and an application-wide assistant, matching the agent experience of the standard portal for the same platform release."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat with an AI agent while working on a case (Priority: P1)

A case worker opens a case whose case type has one or more AI agents configured. An agent panel is available next to the case details. The panel shows the agent's name, a welcome message and suggested prompts. The user types a question (or picks a suggestion), sees the answer appear progressively as the agent generates it, can stop it at any time, and can switch between agents when more than one is configured.

**Why this priority**: The case view is where most agent configurations live and where users do their work. Without it, configured agents are invisible in SDK applications. This story alone is a usable MVP.

**Independent Test**: Configure an agent on a case type's case view, open a case of that type in the SDK application, ask a question, and receive a progressively displayed answer.

**Acceptance Scenarios**:

1. **Given** a case type with a visible agent configured, **When** the user opens a case of that type, **Then** an agent panel is available alongside the case details showing the agent's name, and when the user expands it, it shows the agent's welcome message and up to four suggested prompts.
2. **Given** the agent panel is open, **When** the user sends a message, **Then** the message appears immediately, a working indicator is shown, and the agent's answer appears progressively until it is complete.
3. **Given** an answer is being generated, **When** the user chooses Stop, **Then** generation stops, the partial answer stays visible and is marked as stopped, and the user can send a new message.
4. **Given** several agents are configured, **When** the user switches to another agent and later back, **Then** each agent shows its own conversation and the earlier conversation is still there.
5. **Given** an answer contains headings, lists, tables, code and links, **When** it is displayed, **Then** it is formatted for reading, links open in a new browser tab, and nothing in the answer runs as active content.
6. **Given** a case type with no agent configured, **When** the user opens a case of that type, **Then** the case screen looks and behaves exactly as before.
7. **Given** an agent configured for guided use, **When** the panel is shown, **Then** the user chooses from the agent's predefined prompts and cannot type free text.
8. **Given** the user opens the agent panel, **When** they leave the case without sending a message, **Then** no new conversation appears in their history.
9. **Given** an answer has been displayed, **When** the user views the conversation, **Then** a notice states that answers are AI-generated.
10. **Given** the application is set to another supported language, **When** the panel is shown, **Then** all labels around the conversation appear in that language.

---

### User Story 2 - Use the application-wide AI assistant (Priority: P1)

When the application's portal is configured with an AI assistant, the navigation shows an assistant entry. Selecting it opens the assistant beside the current page, so the user can chat while still seeing the page. The user can hide the assistant, bring it back, or expand it to full width, and the conversation is kept while they move around the application.

**Why this priority**: The application-wide assistant is the headline agent experience of the platform release and is available from every page, independent of cases.

**Independent Test**: Enable the AI assistant on the portal, open the SDK application, open the assistant from the navigation, ask a question, navigate to another page and confirm the conversation is still there.

**Acceptance Scenarios**:

1. **Given** the portal has an AI assistant with at least one agent, **When** the user opens the application, **Then** the navigation includes an assistant entry and the assistant starts in the display state configured for the portal (hidden, beside the page, or full width).
2. **Given** the assistant is hidden, **When** the user selects the assistant entry, **Then** the assistant opens beside the current page content without replacing it.
3. **Given** the assistant is open, **When** the user navigates to another page or opens a case, **Then** the assistant stays available and the ongoing conversation is preserved.
4. **Given** the assistant is open, **When** the user hides it, **Then** the page uses the full width again, and reopening the assistant shows the same conversation.
5. **Given** the assistant is beside the page, **When** the user expands it to full width and then returns it to the side, **Then** the conversation is unchanged.
6. **Given** no AI assistant is configured on the portal, **When** the user opens the application, **Then** the navigation and page layout are unchanged.

---

### User Story 3 - Follow the agent's actions on cases (Priority: P2)

While answering, an agent may create a case, open a case or work on an assignment. The user sees each action as a progress item with its steps inside the conversation and then a confirmation or failure message, so they know what the agent did. When the agent changes values on the case the user has open, the user sees the new values without refreshing.

**Why this priority**: Acting on cases is the main reason to use agents in this release, but basic question-and-answer works without it.

**Independent Test**: Ask an agent that is allowed to create cases to create one, and watch the progress item, the confirmation and the new case reference.

**Acceptance Scenarios**:

1. **Given** the agent starts creating a case, **When** the action is in progress, **Then** a progress item shows the case type and its steps, each marked as it completes.
2. **Given** a case creation is in progress, **When** it succeeds, **Then** the progress item is replaced by a confirmation message identifying the new case.
3. **Given** an agent action is in progress, **When** it fails, **Then** the conversation states that it failed and keeps the rest of the answer.
4. **Given** the agent works on an assignment, **When** it advances, **Then** a single progress item shows the assignment's steps as they complete.
5. **Given** the user has a case open, **When** the agent updates fields on that case, **Then** the case shows the updated values without a manual refresh.

---

### User Story 4 - Answer questions the agent asks (Priority: P2)

When the agent needs more information, it asks one or more structured questions with single- or multiple-choice options. Simple questions appear as quick-choice buttons in the conversation; longer sets appear as a short form with one question at a time. The user's answers go back to the agent, which continues.

**Why this priority**: Agents that ask questions cannot continue without answers, so without this story such conversations stall.

**Independent Test**: Use an agent that asks a clarifying question, answer it, and confirm the agent continues with the answer.

**Acceptance Scenarios**:

1. **Given** the agent asks a single-choice question with three or fewer options, **When** the user selects an option, **Then** the answer is sent and the agent continues.
2. **Given** the agent asks several questions or a multiple-choice question, **When** the user works through them, **Then** a form shows one question at a time with previous/next navigation and the answers are sent with the user's next submission.
3. **Given** a question has many options, **When** it is shown, **Then** the first few options are visible directly and the rest can be found through a searchable list.
4. **Given** questions are shown, **When** the user dismisses them, **Then** they close and the user can keep chatting.

---

### User Story 5 - Revisit past conversations and start new ones (Priority: P3)

Users can open a history of their previous conversations with the agent for the same case or page, grouped by recency, reopen one to continue, and start a new chat at any time.

**Why this priority**: Valuable for continuity, but each conversation is useful on its own.

**Independent Test**: Hold two conversations, open history, reopen the first one and continue it.

**Acceptance Scenarios**:

1. **Given** the user has past conversations, **When** they open history, **Then** past conversations for the current agent and context are listed newest first, grouped as Today, Previous 7 days, Previous 30 days, and then by month or year.
2. **Given** history is open, **When** the user reaches the end of the list, **Then** older conversations load.
3. **Given** history is open, **When** the user selects a past conversation, **Then** its messages, ratings and attachments are shown and the user can continue it.
4. **Given** a conversation is in progress, **When** the user starts a new chat, **Then** an empty conversation with the welcome message and suggestions is shown and the previous conversation is available in history.

---

### User Story 6 - Attach files to a message (Priority: P3)

Users can attach a file to a message so the agent can use it, see its upload progress, preview it, and remove it before sending.

**Why this priority**: Useful for document-driven tasks, but not needed for most conversations.

**Independent Test**: Attach a file, send a message referencing it, and confirm the message shows the attachment.

**Acceptance Scenarios**:

1. **Given** the user attaches a file, **When** the upload is in progress, **Then** its progress is shown and the message cannot be sent until the upload completes, with a note explaining why.
2. **Given** a file is larger than the application allows, **When** the user attaches it, **Then** an error states the size limit and the file is not sent.
3. **Given** a file is attached, **When** the user removes it before sending, **Then** it is not sent.
4. **Given** a sent message has attachments, **When** the user views the conversation, **Then** the attachments are listed with the message and can be previewed or downloaded.

---

### User Story 7 - Rate agent answers (Priority: P3)

Users can like or dislike an answer and, for a dislike, add an optional comment, helping administrators improve the agent.

**Why this priority**: Improves agent quality over time but does not affect completing the user's task.

**Independent Test**: Like one answer and dislike another with a comment, then reopen the conversation and see both ratings.

**Acceptance Scenarios**:

1. **Given** an answer is complete, **When** the user likes it, **Then** the like is recorded and shown as selected.
2. **Given** an answer is complete, **When** the user dislikes it, **Then** they can add an optional comment, and submitting or skipping the comment records the dislike.
3. **Given** feedback is turned off for the agent, **When** an answer is shown, **Then** no rating controls are shown.

---

### User Story 8 - Use an agent on an application page (Priority: P2)

Application pages such as dashboards, lists and other landing pages can have their own agents. On such a page, an "AI" button at the page's edge opens the agent next to it, so the user can ask about what the page shows. The user can also expand the page's utilities area to keep the agent open beside the page. *(Added after the first release candidate: the standard portal offers page agents and users expect them in SDK applications too.)*

**Why this priority**: Pages are where users start their work, and page agents are configured the same way as case agents. Without this, agents configured on pages are silently missing from SDK applications.

**Independent Test**: Configure an agent on a landing page (for example a dashboard), open the page in the SDK application, open the agent from the button and ask a question.

**Acceptance Scenarios**:

1. **Given** a page with a visible agent configured, **When** the user opens the page, **Then** an "AI" button is shown at the page's edge, and selecting it opens the agent next to the button with its welcome message and suggestions.
2. **Given** the page agent is open, **When** the user closes it and opens it again while staying on the page, **Then** the conversation is still there.
3. **Given** the page agent is available, **When** the user expands the page's utilities area, **Then** the agent is shown beside the page and stays open while the user works on the page.
4. **Given** a page with no agent configured, **When** the user opens the page, **Then** it looks and behaves exactly as before.

---

### Edge Cases

- Agents are configured but none can be resolved (incomplete configuration): the panel explains that the agent is not available instead of failing silently. Agents hidden through their visibility setting are simply not shown.
- Starting the conversation fails when the first message is sent: the user's typed message is kept, an error explains that it could not be sent, and the user can retry.
- An answer fails part-way: the partial answer stays with an error indicator and the user can send again.
- The agent does not support progressive answers: the complete answer appears when ready, with a working indicator in the meantime.
- The user switches agent, changes case, or leaves the page while an answer is being generated: the in-progress answer is abandoned and never appears in another conversation.
- Answers contain control content meant for the application (for example follow-up question data): it is never shown to the user, and any follow-up suggestions are offered as suggestions.
- Answers contain wide tables or long code: they scroll inside the message and the panel stays usable.
- Links in answers point to a case in the application: they open that case. Other links open in a new tab. Unsafe link types are not clickable.
- Narrow screens: the agent panel takes the full available width, or its own view, and remains usable.
- The case-level agent and the application-wide assistant are both available at the same time: they keep separate conversations.
- A page agent and the application-wide assistant are both available on the same page: they keep separate conversations.
- The user's session expires during a conversation: the application's normal session-expiry handling applies and no message is sent twice.
- Embedded (assignment-only) mode: no agent experience is shown and behaviour is unchanged.

## Requirements *(mandatory)*

### Functional Requirements

**Availability and placement**

- **FR-001**: System MUST show an agent panel in the case view when the case type has at least one visible agent configured.
- **FR-002**: System MUST show an assistant entry in the application navigation when the portal has an AI assistant with at least one agent, and MUST open the assistant beside the current page when the entry is selected.
- **FR-003**: System MUST start the application-wide assistant in the display state configured for the portal, and MUST let users switch it between beside-the-page and full width and hide it again.
- **FR-004**: System MUST keep the application-wide assistant's conversation while the user navigates within the application during a session.
- **FR-005**: System MUST show only agents configured as visible, and MUST leave screens unchanged when no agent is configured, in both full-portal and embedded modes.
- **FR-006**: Users MUST be able to switch between configured agents, and each agent MUST keep its own conversation for the session.

**Conversations**

- **FR-007**: System MUST link each conversation to its context (the open case, data record or page) so history and answers relate to the user's current work.
- **FR-008**: System MUST create a new conversation only when the user sends the first message, not when the panel is merely opened.
- **FR-009**: System MUST show the agent's welcome message and up to four suggested prompts in an empty conversation.
- **FR-010**: System MUST display answers progressively as they are generated when the agent supports it, and as a whole otherwise.
- **FR-011**: Users MUST be able to stop an answer while it is being generated.
- **FR-012**: System MUST offer the follow-up suggestions provided with the latest answer and MUST send a suggestion when it is selected.
- **FR-013**: For agents configured for guided use, System MUST limit input to the agent's predefined prompts.
- **FR-014**: System MUST display formatted answers (headings, emphasis, lists, tables, code, links), MUST NOT run or render active content contained in answers, and MUST open links in a new tab unless they point to a case in the application.
- **FR-015**: System MUST hide control content embedded in answers from the user.
- **FR-016**: System MUST show understandable error messages when starting a conversation, sending a message, loading history or loading a conversation fails, without losing the user's typed message.
- **FR-017**: System MUST show a notice that answers are AI-generated once an answer has been displayed.

**Agent actions**

- **FR-018**: System MUST show progress, including steps, while the agent creates a case, opens a case or works on an assignment, and MUST replace it with a confirmation or failure message when the action ends.
- **FR-019**: System MUST show values the agent changes on the case the user has open without requiring a manual refresh.

**Agent questions**

- **FR-020**: System MUST present the agent's single- and multiple-choice questions (as quick choices for a single question with three or fewer options, otherwise as a form with one question at a time) and MUST send the user's answers back to the agent.
- **FR-021**: Users MUST be able to dismiss the agent's questions and continue chatting.

**History**

- **FR-022**: Users MUST be able to view past conversations for the current agent and context grouped by recency, load older ones on demand, and reopen one to continue it.
- **FR-023**: Users MUST be able to start a new chat at any time.

**Attachments**

- **FR-024**: Users MUST be able to attach a file to a message, see its upload progress, remove it before sending, and preview it.
- **FR-025**: System MUST apply the application's maximum attachment size and MUST explain the limit when a file exceeds it.

**Feedback**

- **FR-026**: Users MUST be able to like or dislike an answer, with an optional comment for a dislike, unless feedback is turned off for that agent.

**Accessibility, language and layout**

- **FR-027**: All agent controls MUST be usable with a keyboard alone and labelled for assistive technologies, and new answers MUST be announced to screen-reader users.
- **FR-028**: All text the application shows around the conversation MUST follow the application's language settings.
- **FR-029**: The agent experience MUST remain usable on screens as narrow as a typical phone (320 pixels wide), without the panel itself needing horizontal scrolling.

**Page agents** *(added with User Story 8)*

- **FR-030**: System MUST offer the agents configured on an application page (dashboards, lists and other landing pages) from a button at the page's edge that opens the agent next to it, MUST let users show the agent beside the page instead, and MUST keep the page's conversation while the user stays on the page; pages without agents MUST be unchanged.

### Key Entities *(include if feature involves data)*

- **Agent**: An AI assistant configured in the application, with a display name, a kind (agent or coach) and visibility. When a conversation starts it also provides its welcome message, suggested prompts, whether it is guided, whether it answers progressively, and whether feedback is enabled.
- **Context**: What the user is working on (a case, a data record or a page), to which conversations belong.
- **Conversation**: A dialogue between a user and an agent for one context, with a title, a last-updated time and ordered messages.
- **Message**: An entry in a conversation from the user, the agent or the system, with formatted content, optional attachments, follow-up suggestions, a rating and a status (in progress, complete, stopped, failed).
- **Agent action**: Something the agent does on a case (create a case, open a case, work on an assignment), with the case type or case reference, its steps and its outcome.
- **Question set**: Structured questions from the agent, each single- or multiple-choice with options, plus the user's answers.
- **Attachment**: A file attached to a message, with its name, size, upload status and preview.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing against a platform server of the target release, 100% of in-scope placements (every configured case-view agent and the configured application-wide assistant) are available to users in the SDK application.
- **SC-002**: For a reference set of at least 10 scenarios covering chat, stopping, agent actions, questions, history, attachments and ratings, the SDK application reaches the same outcome as the standard portal in 100% of scenarios.
- **SC-003**: Users see an answer begin to appear no more than 1 second later than the same answer begins to appear in the standard portal.
- **SC-004**: After choosing Stop, users can send a new message within 2 seconds.
- **SC-005**: Screens without agents show no visible or behavioural change, with 0 regressions in the existing case and portal acceptance checks.
- **SC-006**: A test set of answers containing scripts, embedded pages and unsafe links results in 0 executions and 0 clickable unsafe links.
- **SC-007**: An accessibility review finds every agent control operable by keyboard alone and new answers announced by a screen reader, with no critical issues.
- **SC-008**: In usability checks, at least 9 of 10 users can start a conversation, ask a question and reopen a past conversation without help.

## Assumptions

- The application connects to a Pega Infinity '26 server where agents are configured on case types' case views and/or on the portal's AI assistant, and the platform's conversation services are enabled. The platform provides all agent intelligence, conversation storage, case actions and access control; this feature adds only the user-facing experience.
- Behaviour follows the agent experience of the standard portal for the same platform release, presented in the SDK's existing visual style.
- Only applications running on Pega Infinity are in scope; the Launchpad runtime is out of scope.
- Users are already signed in; no new sign-in or permission model is introduced.
- Agents used with this release can run their actions without asking the user for approval first, because action approval is out of scope.
- The content and language of answers come from the platform; only the application's own labels are translated.
- Attachments follow the application's existing size limits and permissions.
- Out of scope for this release: approving agent actions before they run; case progress banners and an active-cases summary; image choices; suggestion cards; placements inside page banners or other views (agents configured on the pages themselves are in scope, User Story 8); resizable or remembered panel widths; case previews inside the conversation; charts in answers; voice input; tracing; and the legacy experience for applications without agent configuration.
