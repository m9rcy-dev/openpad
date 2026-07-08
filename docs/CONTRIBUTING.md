# Contributing

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Read [`ARCHITECTURE.md`](ARCHITECTURE.md) for how the app fits together
and [`../PROGRESS.md`](../PROGRESS.md) for what's built vs. planned.

## Before every commit

```bash
npm run format        # Prettier
npm run lint           # ESLint (type-aware)
npm run typecheck      # tsc -b
npm test               # Vitest
npm run build           # production build (also generates the service worker)
```

All of these run in CI (`.github/workflows/ci.yml`) on every push and
pull request — a green local run means a green CI run. `npm run e2e`
(Playwright, against a real production build) runs in CI as a separate
job; run it locally with `npm run build && npm run e2e` if you're
touching anything user-facing.

## Conventions

- **TypeScript `strict`, no `any`.** ESLint errors on `any`
  (`@typescript-eslint/no-explicit-any`). If you're reaching for `any`,
  the type is telling you something — model it properly instead.
- **Transform tools are pure functions.** Every tool in `src/tools/**` is
  `(input: string) => ToolResult` and never throws — see
  [`ARCHITECTURE.md`](ARCHITECTURE.md#the-tool-registry-the-core-design-pattern).
  Adding a tool: one function, one entry in `src/tools/registry.ts`, one
  colocated `.test.ts` covering the happy path, the error path, and edge
  cases (empty input, unicode, malformed input). `src/tools/**` is held
  to 100% coverage — the CI coverage gate will fail a PR that drops it.
- **No unreachable defensive code.** Don't add a fallback (`?? '...'`,
  `x ? y : z`) for a case that can't actually happen given the calling
  code — it's both dead weight and untestable, which is exactly what
  drags branch coverage down without buying any real safety. If a branch
  genuinely can't be reached, either the type should say so (see the
  discriminated unions in `src/tools/json/json.ts` and
  `src/tools/xml/xml.ts`) or it shouldn't be there.
- **Components live in `src/components/<Name>/`** with a colocated
  `Component.test.tsx`. Styling goes through the CSS custom properties in
  `src/index.css` (`var(--accent)`, `var(--ink)`, …) — never a literal
  hex color in component CSS, so theme switching never needs
  component-level changes.
- **TSDoc on every exported symbol.** State the *why*, not the *what* —
  the code already says what it does; comments earn their place by
  explaining a non-obvious constraint or decision. Tool functions get an
  `@example`.
- **Conventional commit messages**, one commit per completed unit of
  work. If you're resuming a paused session, check `PROGRESS.md`'s
  "Current state" note and the git log before starting.

## Testing philosophy

- **Unit tests** (Vitest + Testing Library) for logic and component
  behavior in isolation. Mock browser-only APIs that jsdom doesn't
  implement (`showOpenFilePicker`, `navigator.onLine`, …) — see existing
  tests in `src/files/` and `src/preview/` for the pattern.
- **E2E tests** (Playwright, `e2e/smoke.spec.ts`) for the golden path
  through a real browser against a real production build. Reach for this
  instead of fighting jsdom when something depends on real browser
  behavior CodeMirror's keymap dispatch, actual service-worker
  installation, real `requestAnimationFrame` timing.
- Before considering a feature done, actually run it (`npm run dev` or
  the built app) and look at it. Green tests are necessary, not
  sufficient — see the M5 and M8 entries in `PROGRESS.md`'s decision log
  for two real bugs that only a real browser turned up.

## Reporting a bug or proposing a change

This is a personal/example project without a formal issue tracker at the
moment — open a PR with a clear description, or reach out to the
maintainer directly.
