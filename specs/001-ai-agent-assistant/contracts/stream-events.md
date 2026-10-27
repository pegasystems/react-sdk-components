# Contract: Streamed Agent Responses

**Feature**: `001-ai-agent-assistant` | **Status**: Consumed protocol (server → client), read from the response stream returned by the engine's streamed send (see [engine-genai-assistant.md](./engine-genai-assistant.md) §2.1).

Source: `REF:packages/dx-components/src/utils/message-stream-utils.ts` and `REF:packages/dx-components/src/utils/hooks/useAgentStreamHandler.ts` (`release/26.1.2`), ported to `components/helpers/message-stream-utils.ts` and `hooks/useAgentStreamHandler.ts` (research R15). This document restates the protocol and the required user-visible behaviour, including the port's deliberate deviations.

## 1. Detecting a stream

| Condition | Treatment |
|---|---|
| `headers['content-type']` starts with `text/event-stream` (case-insensitive) **and** `data.getReader` is a function | Read as a stream (§2) |
| `content-type` starts with `text/event-stream` but no reader is available | Nothing streamed; finish with the accumulated state |
| Any other response | Complete JSON response ([engine-genai-assistant.md](./engine-genai-assistant.md) §4) |
| `data` empty | Finish with an empty answer |

(The reference requires the exact value `text/event-stream;charset=UTF-8`; this feature intentionally accepts any charset suffix — research R4.)

## 2. Framing

- Decode bytes with a streaming UTF-8 decoder and append to a buffer.
- A frame ends at a blank line that is followed by `event:`, `data:` or `{`. The unterminated remainder stays in the buffer.
- In a frame: an `event:` line sets the event name; `data:` lines are trimmed and joined with newlines; further non-empty lines after the first `data:` line are appended with a newline (servers may emit raw newlines).
- Text produced by one network chunk is delivered to the UI in one batch (keeps rendering responsive).

## 3. Events

| Event | Payload | Required handling |
|---|---|---|
| `message` | JSON `{ content: string }` (raw data if not JSON) | Append `content` to the answer (§4.1) |
| `toolReasonEnd` | none | Append a newline |
| `toolCallStart` | JSON `{ toolType, toolName, displayMetadata? }` — tolerate trailing commas before parsing | Action progress (§4.2) |
| `toolCallEnd` | JSON `{ toolType, toolName, displayMetadata?, output?: { status } }` (`status` defaults to `UNKNOWN`) | Action progress (§4.2) |
| `questionnaireProvided` | JSON `{ questionnaire: { questions: Question[] } }` | Accumulate; deliver once at end of stream (§5). Ignore malformed payloads |
| `imageChoicesProvided` | JSON `{ imageChoices: { label, items: [{ id, label }] } }` | **Out of scope**: ignore without interrupting the stream |
| `error` | JSON `{ errorMessage }` (raw text if not JSON) | Mark the current answer failed with this text; the stream may continue |
| `metadata` | timing/usage | No display. A trailing `metadata` frame means the stream ended with no final JSON |

`displayMetadata` fields: `casetype {ID, label}`, `case {ID, label}`, `assignment {ID, label, taskID, processID, stageID, stageLabel, isTaskCompleted}`, `output` (text, for `UI_INSIGHT`).

### End of stream

When the reader finishes:
1. If the remaining buffer starts with an `event: metadata` frame, there is no final JSON; skip to step 5.
2. Otherwise, if it contains a blank line followed by `{`, or itself starts with `{`, parse that JSON. If parsing fails, retry after escaping raw line breaks inside string values.
3. A final JSON with `errorDetails` is an error: mark the answer failed with `errorDetails[0].localizedValue`.
4. Otherwise the final JSON is `{ messageID, response, aiGuidedQuestions?, toolsNeedConfirmation? }`: set the answer's server `messageID`, attach follow-up suggestions from `aiGuidedQuestions`, keep the streamed text (the final `response` is not appended again), and apply the approval notice if `toolsNeedConfirmation` is non-empty (research R7).
5. Deliver accumulated questions (§5), then finalize (§4.3).

Always release the reader. A cancelled stream (Stop) is not an error.

## 4. Events to messages (required behaviour)

### 4.1 Text

- The first text adopts an existing empty loading agent message ("orphan loader"); otherwise a new agent message is created. Only empty loading messages are adopted.
- Later text appends to the active message.
- When an action starts, the active text message is sealed; text arriving afterwards goes to a new message.
- During assignment work, text is collected in a separate text message next to the progress item.
- `UI_INSIGHT` tool output is appended as text (charts are out of scope; JSON code blocks render as code).

### 4.2 Actions

**Create case / open case**
- `toolCallStart`: remove an orphan loader, seal the active message, and add a progress item titled with the case type label.
- `toolCallEnd` success with a case label: replace the progress item with a system message — `Case "<label>" created` or `Case "<label>" opened` (localized templates).
- `toolCallEnd` success without a label, or with a missing/null `casetype.ID`: remove the progress item silently.
- `toolCallEnd` failure: keep the progress item; a retry of the same action reuses it. Other messages are untouched, and text arriving after a failure is not lost.

**Perform assignment**
- First `toolCallStart`: one progress item; each later start adds a step labelled `<stageLabel>: <assignment label>` (or the assignment label alone). A retry of the same task does not add a duplicate step.
- `toolCallEnd` success: completed steps + 1, each completion visible for at least 750 ms. Failure: remember the failed step label. An end without an active progress item is ignored.

### 4.3 Finalization (end of stream, error, or Stop)

- Flush any pending step completion.
- Remove a lingering case progress item (all retries failed).
- Remove the assignment progress item; if any step did not complete, insert a system message with the failed step label (or the last step label) at its position. Keep the assignment text message and all other messages.
- Remove remaining orphan loaders.
- On Stop: keep partial text, mark loading messages complete, add ratings to the last agent message if it has text, and append a "Response stopped" system message.
- Reset per-stream state so the next answer starts fresh.

## 5. Questions

- Delivered once after the stream ends, including when it ends with a `metadata` frame. (The reference skips delivery in that case; this feature delivers them so questions are never lost — research R8.) Not delivered when the stream ends in error or is stopped.
- `Question` = `{ field, type: 'single' | 'multi', questionText, defaultInput?, optionItems: [{ key, label, displayLabel?, selected? }] }`.
- Presentation and answer format: [data-model.md](../data-model.md) §7 and [engine-genai-assistant.md](./engine-genai-assistant.md) §2.1.
