---
applyTo: "packages/react-sdk-components/tests/**,**/*.spec.*,**/*.test.*"
description: "Use when writing or modifying tests. Covers Jest unit tests, Playwright E2E setup, test credentials, helpers, and configuration."
---
# Testing

This directory contains both unit tests (Jest) and end-to-end tests (Playwright).

## Structure

```
tests/
├── unit/              # Jest unit tests
│   └── components/    # Component-level unit tests
├── e2e/               # Playwright E2E tests
│   ├── MediaCo/       # MediaCo sample app tests
│   │   ├── portal.spec.js    # Full portal workflow
│   │   └── embedded.spec.js  # Embedded/mashup workflow
│   └── Digv2/         # DigV2 application tests (various field/template scenarios)
├── common.js          # Shared Playwright helpers (launchPortal, login, date utils)
├── config.js          # Test environment config (URLs, credentials, viewport settings)
└── setUpTests.js      # Jest setup (test environment bootstrapping)
```

## Unit Tests (Jest)

### Running
```bash
npm run test-jest            # Watch mode
npm run test-jest-coverage   # With coverage report
```

### Configuration
- Config: `jest.config.js` at project root
- Environment: `jsdom`
- Preset: `ts-jest` (TypeScript support)
- Setup file: `tests/setUpTests.js`
- Coverage output: `tests/coverage/`

### Writing Unit Tests
- Place tests in `tests/unit/components/<ComponentName>/`
- Use `@testing-library/react` for rendering and assertions
- Use `@testing-library/jest-dom` for DOM matchers
- Mock `getPConnect()` — components always expect this prop

## E2E Tests (Playwright)

### Prerequisites
1. App must be running: `npm run start-prod` (serves at http://localhost:3502)
2. Pega Infinity server must be accessible at the URL in `sdk-config.json`
3. Test users must exist on the Infinity server

### Running
```bash
npm test                     # Chromium, MediaCo portal + embedded
npm run test:headed          # Same but with visible browser
npx playwright test --debug  # Debug mode (step through)
npm run test-report          # View last test report
```

### Test Credentials (config.js)

| App | Role | Username | Password |
|-----|------|----------|----------|
| MediaCo | Representative | `rep@mediaco` | `pega` |
| MediaCo | Manager | `manager@mediaco` | `pega` |
| MediaCo | Technician | `tech@mediaco` | `pega` |
| DigV2 | User | `user.digv2` | `pega` |

### Configuration (config.js)
- `baseUrl`: `http://localhost:3502`
- Viewport: 1920x1080 (config.js default), overridden to 1720x1080 in common.js helpers
- Default timeout: 60s
- Headless by default
- SlowMo: 120ms (config.js), 200ms (playwright.config.js `launchOptions`)

### Shared Helpers (common.js)

| Function | Purpose |
|----------|---------|
| `launchPortal({ page })` | Navigate to portal URL, set viewport |
| `launchEmbedded({ page })` | Navigate to embedded URL, set viewport |
| `launchSelfServicePortal({ page })` | Navigate to self-service portal |
| `login(username, password, page)` | Fill login form and submit |
| `getFormattedDate(date)` | Format date as MMDDYYYY |
| `getFutureDate()` | Get date 2 days from now (formatted) |

### Playwright Config (playwright.config.js)
- Test directory: `packages/react-sdk-components/tests/e2e`
- Test timeout: 120 seconds
- Assertion timeout: 50 seconds
- Trace: on first retry
- Retries: 2 on CI, 0 locally
- Ignored tests: ManyToMany.spec.js, Localization.spec.js

### Writing E2E Tests
- Use `@playwright/test` for test/expect
- Import helpers from `../common.js` and config from `../config.js`
- Tests follow login → navigate → interact → assert pattern
- Always wait for `networkidle` after navigation
- Use `data-testid` attributes for element selection where possible
