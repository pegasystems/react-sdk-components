# Contract: Configuration Inputs

**Feature**: `001-ai-agent-assistant` | **Status**: Consumed interface (view and portal metadata delivered to components through the bridge's config props)

## 1. `coaches` (case view and widget)

Delivered as a config prop of `CaseView` (case type case view, "Agents" setting) and of the `GenAICoach` widget. Agent references are resolved by the engine before the prop reaches the component.

```text
coaches: Array<{
  type: 'AIAgentObject' | 'GenAICoachObject';
  config: {
    coach: { classID: string; insName: string; label: string; type: 'agent' | 'coach' } | null;
    visibility?: boolean;      // false = hidden
  };
}>
```

| Rule | Behaviour |
|---|---|
| Prop missing, `undefined` or an empty array | No agent experience; the screen is unchanged (the case view receives `[]` when nothing is configured) |
| Every entry has `visibility === false` | No agent experience (agents intentionally hidden) |
| Entries exist but none has a resolved `coach` (`coach === null`, for example a missing rule) | Panel shows `Agent configuration is incomplete. Kindly associate the required Agent rules.` |
| Some entries usable | Only usable, visible entries are offered (FR-005) |
| `coach.type === 'agent'` | Agent methods ([engine-genai-assistant.md](./engine-genai-assistant.md)); otherwise coach methods |

`AIAgentObject` and `GenAICoachObject` are configuration item types only; they are never rendered (research R16).

## 2. `navDisplayOptions` (application assistant)

Delivered to `AppShell` as a config prop. Existing fields (`alignment`, `position`, …) are unchanged. Fields used by this feature (all optional):

| Field | Type | Meaning |
|---|---|---|
| `enableAIAgent` | boolean | Assistant enabled for the portal (default `false`) |
| `selectedAgents` | Array<{ pyComponentName: 'AIAgentObject' \| 'GenAICoachObject'; classID: string; pxInsName: string; pyDisplayLabel?: string; pyLabel?: string }> | Agents offered by the assistant |
| `aiAssistantWidth` | `'Hidden' \| 'Split-width' \| 'Full-width'` | Initial display state; unknown or missing → `'Hidden'` |

Mapping to `coaches` entries for the synthetic `GenAICoach` node: `type` = `pyComponentName`; `config.coach` = `{ classID, insName: pxInsName, label: pyDisplayLabel || pyLabel, type: pyComponentName === 'AIAgentObject' ? 'agent' : 'coach' }`.

The assistant is offered only when `enableAIAgent === true` and `selectedAgents` is non-empty, and only in the default portal (not the self-service/WSS portal).

## 3. Widget props from config

| Prop | Type | This release |
|---|---|---|
| `coaches` | see §1 | Used |
| `isPortalAgent` | boolean | Set only by `AppShell` for the synthetic node; selects the portal context ID rule and the assistant header actions |
| `simplifiedAgent` | boolean | Set by authoring when the widget is placed in a landing-page banner region. Banner placement is out of scope; the prop is ignored (standard layout) |

## 4. Environment

| Source | Use |
|---|---|
| `PCore.getEnvironmentInfo().isInfinityRuntime()` | Must be `true` to render anything (research R18) |
| `PCore.getEnvironmentInfo().getMaxAttachmentSize()` | Attachment size limit in MB (default 3) |
| `PCore.isNamespaceEnabled()`, `getFeatureMap().namespaceList` | Namespace prefix stripping for context IDs and prompt keys |
| `pConnect.getValue('pyPortal.classID')`, `pConnect.getCurrentView()` | Page and portal context IDs |
| `caseInfo.ID`, `dataInfo.content` (`pxObjClass`, `pyGUID`), `dataInfo.contextKey` | Case and data-object context IDs |
