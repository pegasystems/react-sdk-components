# AGENTS.md — React SDK Components

## Project Identity

This is the **React SDK Components** repository — the source for two npm packages consumed by the [Constellation React SDK](https://github.com/pegasystems/react-sdk):

| Package | Purpose |
|---------|---------|
| `@pega/react-sdk-components` | Bridge (PConnect integration) + SDK components built with Material UI |
| `@pega/react-sdk-overrides` | Override templates for SDK consumers who want to customize components |

The React SDK (`pegasystems/react-sdk`) is the main project developers use to build applications. This repo provides the component source code and bridge that the React SDK depends on.

For architecture, runtime flow, startup sequence, and how the SDK connects to the Pega platform, see [docs/architecture.md](docs/architecture.md).

---

## Tech Stack & Tooling

| Layer | Technology |
|-------|-----------|
| UI Framework | React |
| Component Library | MUI (Material UI) |
| Language | TypeScript |
| Bundler | Webpack |
| Date handling | Day.js |
| Rich Text | TinyMCE (via @tinymce/tinymce-react) |
| CSS-in-JS | Emotion (@emotion/react, @emotion/styled) |
| Auth | @pega/auth (OAuth 2.0 PKCE) |
| Engine | @pega/constellationjs (provides PCore/PConnect APIs, owns Redux store) |
| Unit Tests | Jest + @testing-library/react |
| E2E Tests | Playwright |
| Linting | ESLint + Prettier |

---

## Directory Map

```
react-sdk-components/
├── packages/
│   ├── react-sdk-components/       # Main source — DO NOT confuse with the consuming react-sdk repo
│   │   ├── src/
│   │   │   ├── bridge/            # Maps PConnect tree → React components (modify with care)
│   │   │   ├── components/        # SDK components: field/, template/, widget/, infra/, designSystemExtension/
│   │   │   ├── hooks/             # Shared React hooks (useStatus, useUID, etc.)
│   │   │   ├── samples/           # App entry points: FullPortal, Embedded, AppSelector
│   │   │   └── types/             # PConnProps, PConnFieldProps interfaces
│   │   ├── tests/                 # Jest unit + Playwright E2E
│   │   └── sdk-local-component-map.js  # Local component overrides — edit this, not sdk-pega-component-map.js
│   └── react-sdk-overrides/        # Generated override package — do not edit directly
├── scripts/                        # Node.js build automation — see build-scripts.instructions.md
├── assets/                         # Static CSS, icons, images
├── docs/                           # Architecture docs
├── sdk-config.json                 # Runtime config: Infinity URL, OAuth client IDs, app settings
├── webpack.config.js               # Webpack config
└── tsconfig.json                   # TypeScript config
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run build-sdk` | TypeScript compile → `lib/` |
| `npm run build:dev` | Lint + Webpack dev build → `dist/` |
| `npm run build:prod` | Lint + Webpack prod build (gzip/brotli) → `dist/` |
| `npm run start-dev` | Webpack dev server (HMR, port 3502) |
| `npm run start-dev-https` | Same but with HTTPS (uses `keys/`) |
| `npm run start-prod` | http-server on `dist/` port 3502 |
| `npm run test` | Playwright E2E (chromium, MediaCo portal+embedded) |
| `npm run test-jest` | Jest unit tests (watch mode) |
| `npm run lint` | ESLint + Prettier check |
| `npm run fix` | ESLint + Prettier auto-fix |
| `npm run build-overrides` | Generate override templates package |

### Prerequisites

1. Node.js (LTS) + npm
2. `npm install` at root
3. For E2E tests: app running at `http://localhost:3502` + Pega Infinity server accessible

---

## Prohibitions & Do-Not-Touch Zones

| Rule | Reason |
|------|--------|
| No direct REST calls to Infinity | All data access goes through `getPConnect()` API |
| Do not edit `sdk-pega-component-map.js` without adding the corresponding component | This file is the SDK's master component registry — every new component must be imported and exported here. Only add entries; do not remove or rename existing ones without updating all references |
| Do not edit files in `lib/` or `dist/` | Build output — regenerated on every build |
| Do not create a custom Redux store | Use `PCore.getStore()` — the engine owns all state |
| Do not bypass PConnect for component data | PConnect manages lifecycle, visibility, validation |
| Do not modify `@pega/constellationjs` bundles | Pre-built engine, not source code |
| Do not hardcode auth tokens or Infinity URLs | Use `@pega/auth` and `sdk-config.json` |
| Do not commit `node_modules/`, `dist/`, or `lib/` | Build artifacts — recreate via npm scripts |
| Infra/container components (`src/components/infra/Containers/`) | Can be modified but require extra vigilance: changes must be backward compatible, well-tested, and include clear comments explaining the reasoning. These are rarely changed and affect the entire rendering pipeline |

---

## Repo-Specific Conventions

These are non-obvious rules specific to this codebase that a new contributor would get wrong:

1. **Field value propagation differs by field type.** Text-input fields buffer locally and propagate on blur. Selection fields propagate immediately on change. Both must go through the shared event utility — never call the engine's change handler directly.

2. **Display mode rendering delegates to the design system extension.** Field components must never render raw markup for read-only display. They delegate to a design system extension component resolved from the component map.

3. **Every new component must be registered in the component registry.** The consumer-side override map is a separate file. The component resolution checks the override map first, then the main registry.

4. **Template children must go through the bridge.** Form/page templates render children by wrapping each child PConnect node through the bridge's component factory. Layout templates receive children as React props. Never render PConnect children directly as React elements.

5. **PCore/PConnect API reference lives in `node_modules/@pega/pcore-pconnect-typedefs/`.** When you need to know what methods are available on `getPConnect()` or `PCore`, read the `.d.ts` files there — they are the authoritative, version-locked API definitions.
