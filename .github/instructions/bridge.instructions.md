---
applyTo: "packages/react-sdk-components/src/bridge/**"
description: "Use when modifying the PConnect bridge layer. Covers react_pconnect.jsx flow, SdkComponentMap, StoreContext, visibility HOC, and Redux connect patterns."
---
# PConnect Bridge Architecture

This directory is the SDK's integration layer that maps the PConnect component tree (provided by `@pega/constellationjs`) to SDK React components. The engine decides **what** to render; this bridge decides **how** to render it.

`@pega/constellationjs` provides: `PCore` (global API), `PConnect` (per-component API), and the Redux store (`PCore.getStore()`). The bridge consumes these to wire SDK components into the engine's component tree.

## Files

| File | Responsibility |
|------|---------------|
| `react_pconnect.jsx` | Redux-connected HOC that resolves PConnect nodes to React components |
| `Context/StoreContext.ts` | React context wrapping `PCore.getStore()` (Redux store from engine) |
| `helpers/sdk_component_map.ts` | Singleton component registry — maps names to React components |

## How react_pconnect.jsx Works

1. **Redux `connect()`**: Maps PCore Redux state to component props via `connectRedux()` with custom `areStatePropsEqual` for performance
2. **Component resolution**: `getComponent()` resolves in 3 steps: `LazyComponentMap` (currently unused) → `SdkComponentMap.getLocalComponentMap()` → `SdkComponentMap.getPegaProvidedComponentMap()` → `ErrorBoundary` fallback
3. **Visibility HOC**: `withVisibility()` wraps components that have conditions — if `visibility === false`, renders nothing
4. **ErrorBoundary**: Wraps rendered components to catch rendering failures gracefully
5. **UID generation**: `createUID()` assigns unique IDs to each component instance for React key stability
6. **Action wiring**: `processActions()` sets up `onChange`/`onBlur` on the PConnect node via `actionsApi`
7. **Recursive children**: `createChildren()` wraps each child PConnect node in a new `PConnect` class instance

```
PConnect metadata (from engine)
  → getComponent(c11nEnv) resolves React class from 3-layer map
    → if c11nEnv.isConditionExist(): connectRedux(withVisibility(component))
    → else: connectRedux(component)
      → PConnect class renders <this.Control {...finalProps}>{children}</this.Control>
        → On error: <ErrorBoundary getPConnect={...} isInternalError />
```

### Key exports from react_pconnect.jsx
- `createPConnectComponent()` — factory that returns the `PConnect` class. Used at the root (in `FullPortal`/`Embedded`) AND recursively by template components (e.g., `DefaultForm` calls `createElement(createPConnectComponent(), childProps)` to render each child)
- `setVisibilityForList(c11nEnv, visibility)` — handles visibility for list/multi-select components

### PConnect class lifecycle
- **constructor**: resolves the SDK component via `getComponent()`, gets `actionsApi`, calls `processActions()` which sets up `onChange`/`onBlur` handlers
- **componentDidMount**: calls `c11nEnv.addFormField()` (registers in form) and `setVisibilityForList(c11nEnv, true)`
- **componentWillUnmount**: calls `removeFormField()`, `setVisibilityForList(c11nEnv, false)`, and `c11nEnv.removeNode()` — this last call is critical: without it, field references from previous steps persist in the context tree and cause 400 errors on submission
- **render**: merges config props + actions + additional props into `finalProps`, renders `<this.Control {...finalProps}>{this.createChildren()}</this.Control>`

## SdkComponentMap (helpers/sdk_component_map.ts)

Singleton pattern with two component maps:

| Map | Source | Priority |
|-----|--------|----------|
| `localComponentMap` | `sdk-local-component-map.js` | **Checked first** — consumer-side overrides |
| `pegaProvidedComponentMap` | `sdk-pega-component-map.js` | Fallback — SDK's master component registry (maintained in this repo) |

### Initialization
```typescript
// Called once during app startup (in FullPortal/Embedded initialRender)
const theMap = await getSdkComponentMap(localSdkComponentMap);
```

### Component Lookup
```typescript
// Used by react_pconnect.jsx to resolve each PConnect node
const Component = SdkComponentMap.getComponentFromMap('TextInput');
```

## StoreContext (Context/StoreContext.ts)

Provides access to PCore's Redux store via React context:

```typescript
// In FullPortal — wraps root component with store context
const contextValue = { store: PCore.getStore() };
<StoreContext.Provider value={contextValue}>{thePConnObj}</StoreContext.Provider>
```

Components below this provider can access the store via `useConstellationContext()`.

## Rules for Modifying Bridge Code

- **Do NOT create a separate Redux store** — `PCore.getStore()` IS the store
- **Do NOT bypass `react_pconnect.jsx`** for rendering PConnect nodes
- **Component map priority is intentional** — local always overrides Pega-provided
- **The bridge does NOT contain business logic** — it's purely a mapping/wiring layer
- **`SdkComponentMap` is a singleton** — only one instance exists per app lifecycle
- **Visibility is engine-controlled** — do not override visibility logic in components
- The `classID` comparison logic in Redux `connect()` is intentional for performance — do not simplify without understanding the shallowEqual optimization
