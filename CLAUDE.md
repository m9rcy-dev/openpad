# OpenPad — project conventions

Offline-first online notepad (React 19 + TypeScript + CodeMirror 6 + Vite),
deployed as a static site to GitHub Pages. No backend, ever.

## Start here

1. **`PROGRESS.md`** — current state, what's done, what's next. Update it in
   the same commit as the work it describes.
2. `docs/ARCHITECTURE.md` — how the app fits together.
3. `docs/CONTRIBUTING.md` — conventions and pre-commit checks, in full.
4. `docs/online-notepad-implementation-plan-01.md` — the approved plan.
5. `docs/ui-mockup.html` — the approved visual design target and tokens.

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run lint` · `npm run typecheck` · `npm test` · `npm run format`
- `npm run test:coverage` — enforces the thresholds in `vite.config.ts`
  (100% on `src/tools/**`)
- `npm run e2e` — Playwright smoke suite against a real production build
- All of these must be green before every commit (CI enforces the same).

## Conventions

- TypeScript `strict`; `any` is banned (ESLint error).
- Transform tools are **pure functions** in `src/tools/**` returning the
  `ToolResult` discriminated union — never throw to the UI. Each tool:
  one function + one registry entry in `src/tools/registry.ts` + one
  colocated `.test.ts` (100% coverage on `src/tools`).
- TSDoc on every exported symbol; `@example` on tool functions.
- Components live in `src/components/<Name>/` with colocated tests.
- Styling via the design tokens in `src/index.css` only — theme switching
  redefines tokens, components never branch on theme.
- Rendered preview HTML must pass through DOMPurify — no exceptions.
- Conventional commits, one commit per completed task.
