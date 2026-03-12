---
description: "Write unit tests following the project's Jest + React Testing Library patterns"
agent: "unitTestGenerator"
argument-hint: "Component name, list of names, or path to component directory"
---

# Write Unit Tests

You are writing unit tests for the React SDK Components. Follow these rules strictly.

## Framework & Imports

- Use **Jest** + **React Testing Library**.
- Import from `@testing-library/react` for `render`, `screen`, `fireEvent`, `waitFor`.
- Import `userEvent` from `@testing-library/user-event`.
- Test file naming: `index.test.tsx` inside a directory matching the component's category structure.

## Rules

1. **Use `userEvent` over `fireEvent`** for user interactions (click, type, etc.) when possible.
2. **Mock all external dependencies** — never make real API calls.
3. **Mock PCore** — understand the component source code and mock `getPConnect` if required. Provide `getActionsApi()` and `getStateProps()` stubs.
4. **Mock `getComponentFromMap`** — this function takes a component name string and returns the child component. Always mock it to return a stub component. Never import the actual child component.
5. **Mock `handleEvent`** from `event-utils` — mock with `jest.fn()` and assert on calls.
6. **Test behavior, not implementation** — avoid testing internal state or implementation details.
7. **Include edge cases**: empty states, error states, loading states, boundary values, conditional rendering paths.
8. **Use `waitFor`** for async assertions.
9. **Test files must be `.tsx`** — never `.js(x)`.
10. **Use `jest.fn()` only when you need to assert on calls** (e.g., `toHaveBeenCalled`). For mock data or stub functions that just return a value, use plain functions or objects.

## Skip-If-Exists

Before generating tests:
- **Check** if a test file already exists for the target component under `packages/react-sdk-components/tests/unit/components/`.
- **If tests exist**: Run coverage. If 100% covered → skip and report "already covered." If gaps exist → add only the missing tests.
- **If no tests exist**: Generate the full test suite.

## Example Reference

Read [the TextInput component source](packages/react-sdk-components/src/components/field/TextInput/TextInput.tsx) to understand a typical component structure with imports to mock.

Read [the TextInput test](packages/react-sdk-components/tests/unit/components/field/TextInput/index.test.tsx) to understand the established testing pattern: mocking `getComponentFromMap`, `handleEvent`, `getPConnect`/actions, and the AAA test structure.

## Verification

- Run the generated test with `npm run test-jest` and verify it passes. If it fails, fix the error and retry.
- Verify 100% coverage with `npm run test-jest-coverage`.

You will be provided a component name, a list of component names, or a path to a component directory. If nothing is provided, read and understand component code from the `packages/react-sdk-components/src/components/` directory and ask which component(s) to test.
