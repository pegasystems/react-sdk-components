# Architecture & Runtime Flow

This repo produces two npm packages (`@pega/react-sdk-components` and `@pega/react-sdk-overrides`) consumed by the [Constellation React SDK](https://github.com/pegasystems/react-sdk). The SDK provides an alternative React/MUI frontend for the Pega Constellation architecture, connecting to the Pega Infinity platform through:

- **`@pega/constellationjs`** — the engine that manages case lifecycle, assignments, view hierarchy, and state. It provides the `PCore` global API and `PConnect` per-component API. It also owns the Redux store (`PCore.getStore()`).
- **`@pega/auth`** — handles OAuth 2.0 PKCE authentication with the Pega Infinity server.

The SDK does NOT talk to Pega REST APIs directly — all interaction with the platform goes through PCore/PConnect provided by `@pega/constellationjs`.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Pega Infinity Server                              │
│  (Case engine, Rules, Data pages, REST APIs, OAuth 2.0 provider)        │
└────────────────────┬────────────────────────────────────────────────────┘
                     │ REST
┌────────────────────▼────────────────────────────────────────────────────┐
│                    Pega-Provided Packages (not SDK source)               │
│                                                                          │
│  @pega/auth                    @pega/constellationjs                     │
│  OAuth 2.0 PKCE login          bootstrap-shell.js → PCore global         │
│  loginIfNecessary()            Manages: case lifecycle, assignments       │
│  Token management              Owns: Redux store (PCore.getStore())      │
│                                Exposes: PConnect objects per component    │
└────────────────────┬────────────────────────────────────────────────────┘
                     │ PConnect objects (component tree metadata)
┌────────────────────▼────────────────────────────────────────────────────┐
│                 SDK Bridge Layer (this repo)                              │
│  react_pconnect.jsx: maps PConnect nodes → SDK React components          │
│  sdk_component_map.ts: component registry (local + Pega-provided)        │
│  StoreContext.ts: React context wrapping PCore.getStore()                │
│  connectRedux + withVisibility: Redux state → props, engine visibility   │
└────────────────────┬────────────────────────────────────────────────────┘
                     │ React props (getPConnect, field values, etc.)
┌────────────────────▼────────────────────────────────────────────────────┐
│                 SDK React / MUI Components (this repo)                    │
│  Field │ Template │ Widget │ Infra │ DesignSystemExtension                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Startup Sequence

1. Browser loads `index.html` → imports `app.bundle.js`
2. `index.tsx` renders `<BrowserRouter><TopLevelApp /></BrowserRouter>`
3. `AppSelector` routes to `FullPortal` (`/portal`) or `Embedded` (`/embedded`)
4. `@pega/auth`: `loginIfNecessary()` initiates OAuth 2.0 PKCE flow → redirects to Infinity login → returns with auth code → exchanges for token
5. `@pega/constellationjs` bootstrap-shell loads → fires `SdkConstellationReady` event
6. `PCore.onPCoreReady(renderObj)` callback fires with the initial PConnect render tree
7. `getSdkComponentMap(localMap)` initializes SDK component registry (merges local + Pega-provided mappings)
8. `createPConnectComponent()` wraps the render tree in Redux-connected React components
9. For each PConnect node, `react_pconnect.jsx` resolves the SDK component via the 3-layer map
10. SDK components render using MUI, interacting with the platform through `getPConnect()` API

## Two Application Modes

| Mode | URL | Entry Component | Use Case |
|------|-----|-----------------|----------|
| **Portal** | `/portal` | `FullPortal` | Full case worker portal UI (NavBar, work queues, case views) |
| **Embedded** | `/embedded` | `Embedded` | Mashup — embeds a single case creation flow into external page |

## Authentication

- OAuth 2.0 Authorization Code with PKCE
- Config in `sdk-config.json` → `authConfig` section
- `portalClientId` for portal mode, `mashupClientId` for embedded
- Auth handled entirely by `@pega/auth` library — do NOT implement custom auth logic

## Component Anatomy

Every SDK component follows this structure:

```
ComponentName/
├── ComponentName.tsx    # React component implementation
├── index.tsx            # Re-export (export { default } from './ComponentName')
└── config-ext.json      # Component metadata (field, template, widget only)
```

### Props Interface

```typescript
interface PConnProps {
  getPConnect: () => typeof PConnect;
}

interface PConnFieldProps extends PConnProps {
  label: string;
  required: boolean;
  disabled: boolean;
  value?: string;
  validatemessage: string;
  status?: string;
  onChange: any;
  onBlur?: any;
  readOnly: boolean;
  testId: string;
  helperText: string;
  displayMode?: string;
  hideLabel: boolean;
  placeholder?: string;
}
```

### Component Resolution

Components are resolved by name through a 3-layer lookup in `react_pconnect.jsx`:
1. Check `LazyComponentMap` (from `components_map.ts`) — currently empty/unused
2. Check `SdkComponentMap.getLocalComponentMap()` (from `sdk-local-component-map.js`) — local overrides win
3. Check `SdkComponentMap.getPegaProvidedComponentMap()` (from `sdk-pega-component-map.js`) — Pega reference
4. If not found → `ErrorBoundary` renders

Resolved components are wrapped with `connectRedux()` (Redux state mapping) and conditionally with `withVisibility()` (engine-controlled visibility). Template components recursively render children via `createPConnectComponent()`.

### Available Hooks

| Hook | Purpose |
|------|---------|
| `useStatus` | Returns field validation status — takes `{ showFieldMessage, messageVisibility, validatemessage, readOnly }` object |
| `useUID` | Generates stable unique ID across renders |
| `useScrolltoTop` | Auto-scrolls to top on view change |
| `useAfterInitialEffect` | Skips initial render, runs on subsequent updates |
| `useCollapsibleState` | Manages expanded/collapsed/none state |
| `useFocusFirstField` | Auto-focuses first editable field on view change |
| `useConsolidatedRef` | Consolidates multiple refs into single proxy |
| `useIsMount` | Returns true on initial render only |
| `useGetTabsCount` | Manages tab data/counts for deferred-loaded tabs |

## Key Globals

Set by `@pega/constellationjs`, available at runtime (do not mock in components):

| Global | What it provides |
|--------|-----------------|
| `PCore` | Engine API — store, environment info, constants, component lifecycle |
| `PCore.getStore()` | Redux store (read case state, subscriptions) |
| `PCore.onPCoreReady(cb)` | Callback when engine initialization complete |
| `PCore.getConstants()` | Enum values for selection modes, render modes, etc. |
| `PCore.getEnvironmentInfo()` | Server environment details, default portal |

### PCore & PConnect API Reference

For the full list of available methods on `PCore` and the `PConnect` object returned by `getPConnect()`, read the TypeScript typedefs at `node_modules/@pega/pcore-pconnect-typedefs/`. These are the authoritative, version-locked API definitions for this project.

## Override System

The `@pega/react-sdk-overrides` package mirrors the component directory structure. SDK consumers:
1. Install `@pega/react-sdk-overrides`
2. Copy the component they want to customize into their project
3. Register it in their local component map (overrides take priority)

Generated via `npm run build-overrides` which copies `src/components/` to `packages/react-sdk-overrides/lib/`.

## sdk-config.json

Runtime configuration loaded at startup:

| Section | Purpose |
|---------|---------|
| `authConfig.portalClientId` | OAuth client ID for portal mode |
| `authConfig.mashupClientId` | OAuth client ID for embedded/mashup mode |
| `authConfig.mashupUserIdentifier` | Pre-set user for embedded (e.g., `customer@mediaco`) |
| `serverConfig.infinityRestServerUrl` | Full URL to Pega Infinity REST server |
| `serverConfig.appAlias` | Application alias (e.g., `MediaCo`) |
| `serverConfig.appPortal` | Specific portal to load (blank = operator default) |
| `serverConfig.appMashupCaseType` | Case type for embedded mode |
| `serverConfig.excludePortals` | Portals to skip (admin/system portals) |
| `theme` | `"light"` or `"dark"` |
