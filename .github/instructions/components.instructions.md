---
applyTo: "packages/react-sdk-components/src/components/**"
description: "Use when creating, modifying, or reviewing SDK components. Covers component structure per subtype (field, template, widget, infra, designSystemExtension), PConnProps interface, MUI design system, hooks, and rendering rules."
---
# Components

React SDK component reference implementation using Material UI v6. Components are organized into five subtypes, each with distinct patterns.

## Subtypes at a Glance

| Subtype | Has `config-ext.json` | Uses `getPConnect` | Pattern |
|---------|----------------------|--------------------|--------|
| `field/` | Yes (most) | Always | Input controls — extend `PConnFieldProps`, use `actionsApi` for value propagation |
| `template/` | Yes (most) | Always | Layout shells — receive children from PConnect tree, render via `createPConnectComponent()` |
| `widget/` | Yes (most) | Always | Self-contained data views — fetch their own data via `PCore` APIs |
| `infra/` | No | Most (except Region, ActionButtons, VerticalTabs) | Container/orchestration plumbing — manage case flow, routing, assignment lifecycle |
| `designSystemExtension/` | No | None | Pure presentational — receive data as props, no PConnect dependency |

---

## Field Components (`field/`)

Form input controls. Every field follows the same data-flow pattern.

### Structure
```
TextInput/
├── TextInput.tsx      # Component
├── index.tsx          # Re-export
└── config-ext.json    # { "type": "Field", "subtype": "Text" }
```
Some fields have additional files (e.g., `currency-utils.ts` in Currency/, CSS files).

### Pattern

All field components:
1. **Extend `PConnFieldProps`** (or `Omit<PConnFieldProps, 'value'>` for non-string values like Checkbox)
2. **Get `actionsApi`** via `getPConnect().getActionsApi()` and `propName` via `getPConnect().getStateProps().value`
3. **Propagate values** via `handleEvent(actions, 'changeNblur', propName, value)` from `helpers/event-utils` — trigger point depends on field type (see below)
4. **Handle display modes**: `DISPLAY_ONLY` and `STACKED_LARGE_VAL` — delegate to `getComponentFromMap('FieldValueList')`
5. **Validate with `useStatus()`** — takes `{ showFieldMessage, messageVisibility, validatemessage, readOnly }` object
6. **Use MUI components** for rendering (TextField, Select, Checkbox, etc.)

### Value propagation — two patterns

**Text-input fields** (TextInput, TextArea, Email, URL, Integer) — buffer with `useState`, propagate on blur:
```
User types → handleChange() updates local useState
  → User blurs → handleBlur() calls handleEvent(actions, 'changeNblur', propName, value)
```

**Selection fields** (Checkbox, Dropdown, RadioButtons, Date, Time, AutoComplete, Phone, Currency, Decimal, Percentage) — propagate immediately on change:
```
User selects → handleChange() calls handleEvent(actions, 'changeNblur', propName, value) directly
```

Both patterns use `handleEvent` with `'changeNblur'` which calls both `updateFieldValue` and `triggerFieldChange`. The difference is the trigger point: blur for free-text input (to avoid re-rendering on every keystroke), immediate for selection (where the value is final on selection).

### Display mode rendering
Fields never render raw `<span>` for read-only. They delegate to FieldValueList:
```typescript
const FieldValueList = getComponentFromMap('FieldValueList');
if (displayMode === 'DISPLAY_ONLY') {
  return <FieldValueList name={hideLabel ? '' : label} value={value} variant={props.variant} />;
}
if (displayMode === 'STACKED_LARGE_VAL') {
  return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
}
```

### Exceptions
- **CancelAlert** — no `config-ext.json` (modal dialog, not a standalone field)
- **Group, EmbeddedDataMulti, ScalarList** — field containers that manage child fields rather than single values
- **Checkbox** — uses `Omit<PConnFieldProps, 'value'>` since its value is boolean, not string

---

## Template Components (`template/`)

Page and form layouts that render child components from the PConnect tree.

### Structure — two patterns

**Flat** — single component:
```
CaseView/
├── CaseView.tsx
├── index.tsx
└── config-ext.json    # { "type": "Template", "subtype": "CASEVIEW" }
```

**Nested variants** — parent directory with sub-variants for different contexts (Page, Form, Details, Tab):
```
NarrowWide/
├── NarrowWide/NarrowWide.tsx        # Base layout (pure, receives children as props)
├── NarrowWidePage/NarrowWidePage.tsx # Page context variant (has config-ext.json)
├── NarrowWideForm/NarrowWideForm.tsx # Form context variant (has config-ext.json)
└── NarrowWideDetails/               # Read-only context variant (has config-ext.json)
```
Nested: OneColumn, TwoColumn, NarrowWide, WideNarrow, Details, SimpleTable, AdvancedSearch.

### Rendering patterns

Templates extend `PConnProps` (not `PConnFieldProps`). Three sub-patterns:

**Form/Page templates** (DefaultForm, OneColumnPage, TwoColumnForm) — render children via `createPConnectComponent()`:
```typescript
import { createElement } from 'react';
import createPConnectComponent from '../../../bridge/react_pconnect';

// Children accessed via: getPConnect().getChildren()[0].getPConnect().getChildren()
const arChildren = getPConnect().getChildren()[0].getPConnect().getChildren();
const renderedChildren = arChildren?.map((kid, index) =>
  createElement(createPConnectComponent(), { ...kid, key: index.toString() })
);
```
Note: `DefaultForm` additionally wraps children with `connectToState(mapStateToProps)` for visibility tracking — this is specific to `DefaultForm`, not a general template pattern.

**Layout templates** (OneColumn, TwoColumn, NarrowWide base) — pure layout, receive `children` as React props:
```typescript
export default function OneColumn(props: PropsWithChildren<OneColumnProps>) {
  const { children } = props;
  return <Grid2 container>{(children as ReactElement[]).map(child => child)}</Grid2>;
}
```

**Data-driven templates** (CaseView, ListView, Details) — use `getPConnect()` heavily for metadata, named regions, and dynamic component creation:
```typescript
// CaseView accesses named regions from children
const theSummaryRegion = getChildRegionByName('summary');

// Details sets inherited props and creates components dynamically
getPConnect().setInheritedProp('displayMode', 'DISPLAY_ONLY');
const children = getPConnect().getChildren().map(c => createElement(createPConnectComponent(), c));
```

### Key PConnect APIs for templates
- `getPConnect().getChildren()` — access child PConnect nodes
- `getPConnect().getInheritedProps()` — get label/display settings from parent
- `getPConnect().setInheritedProp(key, value)` — propagate settings to children
- `getPConnect().getRawMetadata()` — access raw component metadata
- `getPConnect().createComponent(field)` — dynamically create a component from metadata

---

## Widget Components (`widget/`)

Self-contained functional widgets that fetch and display their own data.

### Structure
```
CaseHistory/
├── CaseHistory.tsx
├── index.tsx
└── config-ext.json    # { "type": "Widget", "subtype": "CASE" }
```

### Pattern

Widgets extend `PConnProps`. Unlike fields (values via props) or templates (render children), widgets:
1. **Fetch their own data** using `PCore.getDataApiUtils().getData()` or `getPConnect().getValue()`
2. **Manage their own state** with `useState`/`useEffect` for loading/data
3. **Render tables, lists, or cards** using MUI Table, Card, List components
4. **Don't propagate values** — they display information, not capture input

### Exceptions
- **Followers** — stub/unsupported (renders placeholder)
- **Attachment, FileUtility** — handle file upload/download flows

---

## Infrastructure Components (`infra/`)

Container and orchestration components managing case flow, routing, and layout plumbing.

### Structure
```
infra/
├── ActionButtons/          # Submit/cancel buttons (NO getPConnect)
├── Assignment/             # Assignment lifecycle wrapper
├── Containers/             # Sub-directory with 4 container types:
│   ├── FlowContainer/     #   Case flow orchestration
│   ├── ModalViewContainer/ #   Modal rendering
│   ├── SimpleView/        #   Basic view wrapper
│   ├── ViewContainer/     #   Routed view container
│   └── container-helpers.ts
├── NavBar/                 # Top navigation bar
├── Region/                 # Passthrough wrapper (NO getPConnect)
├── View/                   # View renderer with template resolution
├── VerticalTabs/           # Tab layout (NO getPConnect)
└── ...                     # ErrorBoundary, Stages, MultiStep, etc.
```

**No `config-ext.json` files** — infra components are wired by the engine directly, not registered in the SDK component registry.

### Pattern

Infra has **no single pattern** — each is specialized plumbing:
- **Region** — simplest: pure passthrough `<>{children}</>`, no PConnect
- **ActionButtons** — receives button arrays and `onButtonPress` callback, no PConnect
- **View** — critical orchestrator: resolves template names, sets page titles, handles form/page/modal contexts
- **FlowContainer** — manages case assignment lifecycle, renders assignment cards, shows banners
- **Containers** can be modified but require extra vigilance: changes must be backward compatible, well-tested, and include clear comments explaining the reasoning. These are rarely changed and affect the entire rendering pipeline

Infra manages **lifecycle and routing** rather than rendering user-facing content.

---

## Design System Extension Components (`designSystemExtension/`)

Presentational UI components that are **not PConnect-aware**.

### Structure
```
Banner/
├── Banner.tsx
├── Banner.css
└── index.tsx
```
**No `config-ext.json` files** — DSE components are resolved via `getComponentFromMap()` by other components.

### Pattern

Almost all DSE components (10 of 11):
1. **Do NOT extend `PConnProps`** — custom prop interfaces
2. **Do NOT call `getPConnect()`** — no PConnect tree awareness
3. **Are pure presentational** — receive data, render UI
4. **Are consumed by other components** — fields and templates resolve them via `getComponentFromMap()`

Key DSE components and their consumers:
- **FieldValueList** — renders field values in display mode (used by ALL field components for `DISPLAY_ONLY`)
- **FieldGroup** — renders labeled, collapsible group of fields (used by Details template)
- **AlertBanner** — renders alert messages with severity variants
- **Banner** — renders hero banner with background image
- **RichTextEditor** — TinyMCE wrapper with custom props (not PConnProps)

---

## Creating a New Component

1. Create directory: `<category>/<ComponentName>/`
2. Create `ComponentName.tsx` — implement following the subtype pattern above
3. Create `index.tsx` — re-export: `export { default } from './ComponentName';`
4. If field, template, or widget: create `config-ext.json`:
   ```json
   {
     "name": "ComponentName",
     "label": "Human readable label",
     "description": "Short description",
     "type": "Field|Template|Widget",
     "subtype": "SubtypeIdentifier",
     "properties": []
   }
   ```
5. Register in `sdk-pega-component-map.js` — import the component and add it to the default export object

Note: infra and designSystemExtension also need to be registered in `sdk-pega-component-map.js`. `sdk-local-component-map.js` is for consumer-side overrides only.

---

## MUI Design System

All components use **MUI v6** with **Emotion** as the styling engine.

| Package | Use for |
|---------|---------|
| `@mui/material` | Core components (TextField, Button, Select, Grid2, Typography, Card, Table) |
| `@mui/lab` | Experimental/beta components |
| `@mui/x-date-pickers` | Date and time pickers (Date, DateTime, Time fields) |
| `@mui/icons-material` | Material Design icons |
| `@mui/styles` | Legacy `makeStyles`/`withStyles` (many existing components use it — prefer `sx` or `styled` for new code) |
| `@emotion/react` | CSS-in-JS runtime (used by MUI internally) |
| `@emotion/styled` | `styled()` API for creating styled components |

### Theme (`theme.ts`)
- Light/dark modes (controlled by `sdk-config.json` → `theme`)
- Primary: `#007bff`, Secondary: `#FFC400`
- Custom extensions: `card`, `modal`, `headerNav`, `embedded`, `actionButtons`
- Access via `useTheme()` or `<ThemeProvider theme={theme}>`

### Styling
- Many existing components use `makeStyles`/`withStyles` — legacy but functional
- For new code prefer MUI `sx` prop or `@emotion/styled`
- Some components use CSS files alongside MUI (e.g., `Banner.css`, `ListView.css`)

---

## Helpers (`helpers/`)

| File | Use for |
|------|---------|
| `event-utils.ts` | `handleEvent(actions, 'changeNblur', propName, value)` — field value propagation. `changeNblur` calls both `updateFieldValue` and `triggerFieldChange` |
| `state-utils.tsx` | `connectToState` HOC — used by DefaultForm for child visibility tracking |
| `field-utils.ts` | Field value formatting, `getFieldSx()` for status-based styling |
| `case-utils.tsx` | Case-level operations, status, actions |
| `template-utils.ts` | `getInstructions()`, `getAllFields()` for template rendering |
| `date-format-utils.ts` | Date/time formatting across locales |
| `common-utils.ts` | Generic utilities (string manipulation, type checks) |
| `attachmentShared.ts` | File upload/download shared logic |
| `utils.ts` | Miscellaneous utilities, `Utils.generateDateTime()` |
| `data_page.ts` | `getDataPage()` — data page API access for dropdowns/lookups |
| `field-group-utils.ts` | Field group layout and validation |
| `instructions-utils.ts` | Case/assignment instructions rendering |
| `object-utils.ts` | Object reference helpers |
| `reactContextHelpers.ts` | React context utility wrappers |
| `simpleTableHelpers.ts` | `filterData()` — simple table data and column helpers |
| `versionHelpers.ts` | `compareSdkPCoreVersions()` — SDK/PCore version comparison |
| `formatters/` | Value formatters (`format()`) for display mode — currency, date, etc. |
