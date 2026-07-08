# Progress

> Living checklist for the OpenPad build. Update this file **in the same
> commit** as the work it describes. A fresh session (human or AI) resumes
> from the "Current state" note plus `git log`.
> Plan: `docs/online-notepad-implementation-plan-01.md` · Design target: `docs/ui-mockup.html`

## Current state

**M9 done — all 9 planned milestones complete.** Playwright e2e suite (9
tests, all passing under parallel workers), coverage thresholds enforced
in CI (100% on `src/tools/**`, ~90%+ overall with `App.tsx` excluded as
orchestration glue covered by e2e instead), a "?" keyboard-shortcuts
dialog, and `docs/ARCHITECTURE.md` + `docs/CONTRIBUTING.md` +
`.github/dependabot.yml` + `LICENSE`. 235 unit/component tests green.

The app is feature-complete per the approved plan. Remaining known gaps
are the visual-only offline verification noted in M8, and the two items
below that need the user directly.

**Blocked on user:** GitHub repository creation + push, and enabling
Pages (Settings → Pages → Source → "GitHub Actions") to verify the
deploy — see M1. Once pushed, worth a final look: confirm CI's new `e2e`
job passes on GitHub's runners too (only run locally so far).

## M1 — Scaffold & pipeline

- [x] Vite + React 19 + TypeScript (strict) scaffold
- [x] ESLint (type-aware) + Prettier + eslint-config-prettier
- [x] Vitest + React Testing Library + jsdom, first passing test
- [x] Design tokens in `src/index.css` (light/dark, per mockup)
- [x] CI workflow: audit, format, lint, typecheck, test, build
- [x] Deploy workflow: GitHub Pages with `VITE_BASE=/<repo>/`
- [x] PROGRESS.md, CLAUDE.md, README
- [x] All local gates green (lint, typecheck, test, build, `npm audit`: 0 vulnerabilities)
- [x] Initial commit
- [ ] Deployed hello-world verified on GitHub Pages _(needs repo — user)_

## M2 — Core editor

- [x] CodeMirror 6 editor pane (line numbers, active line, history, search)
- [x] Editor theme driven by the design tokens (`src/editor/theme.ts`)
- [x] Status bar: Ln/Col, char + word count, language label
- [x] Light/dark theme toggle (persisted, `data-theme` on `<html>`)
- [x] Component tests (EditorPane, StatusBar, useTheme, languages)
- [ ] Visual check in a real browser (bundled into the post-M5 pass)

## M3 — Tabs & persistence

- [x] `NotepadDocument` type + Zustand documents store (tests)
- [x] Tab strip: new / activate / rename (double-click) / close with dirty check
- [x] Debounced autosave to IndexedDB (`idb-keyval`), restore on boot
- [x] Autosave indicator in status bar
- Note: per-tab undo history is dropped on tab switch (editor remounts per
  document); acceptable for v1, candidate improvement post-M9.

## M4 — Transform tools

- [x] `ToolResult` type + registry pattern (`src/tools/registry.ts`)
- [x] Encoding pack: Base64 (UTF-8 safe), URL, HTML entities — encode/decode
- [x] JSON pack: format, minify, validate (error line/col)
- [x] XML pack: format, minify, validate (DOMParser; DTD subsets documented as unsupported)
- [x] Text pack: UPPER/lower/Title case, sort, dedupe, trim, remove empty lines
- [x] Tools menu (registry-driven) + keyboard shortcuts (JSON format/minify)
- [x] Apply to selection-or-document, single undoable change, chaining keeps selection
- [x] Exhaustive unit tests incl. hostile-input sweep over the whole registry
      (coverage threshold enforcement lands in M9)

## M5 — Markdown / Mermaid / PlantUML preview

- [x] Split preview pane with toggle (default on for Markdown docs)
- [x] markdown-it + DOMPurify pipeline (XSS tests included)
- [x] Mermaid fences rendered locally (lazy-loaded; main bundle stays mermaid-free)
- [x] PlantUML fences via configurable server (`openpad:plantuml-server`) + offline notice
- [x] Editor → preview scroll sync (one-way; bidirectional is a post-M9 candidate)
- [x] Fixed: concurrent `mermaid.render()` calls hung forever instead of
      erroring (Mermaid isn't reentrant-safe), so a page with 2+ diagrams — or
      just React StrictMode's double effect invocation on mount — left the
      diagram showing an empty placeholder with no error. `renderMermaid` now
      queues calls to run one at a time; regression test in `mermaid.test.ts`.
      Found via manual browser verification, not the (mocked) test suite.

## M6 — File operations

- [x] Open / Save / Save As (File System Access API + hidden-input/download
      fallback) — `src/files/fileOperations.ts`, wired via `useFileOperations`
- [x] File menu (Open… / Save / Save As…) + shortcuts (⌘O, ⌘S, ⌘⇧S)
- [x] Drag-and-drop to open (each dropped file becomes its own tab)
- [x] Language auto-detect by extension (existing `detectLanguage`, reused)
- [x] Opening into the sole untouched `untitled-N` tab replaces it instead
      of piling up empty tabs; otherwise adds a new tab
- [x] File handles are session-only by design (not persisted to IndexedDB —
      a stored handle's permission can't be silently reused after reload)
- [x] Verified live: Save As via the download fallback (forced by deleting
      `window.showOpenFilePicker`/`showSaveFilePicker` to avoid triggering a
      real OS dialog that browser automation can't drive) and drag-and-drop
      both confirmed working end-to-end. The native-picker code paths (File >
      Open, and Save/Save As when the API is supported) are unit-tested with
      mocks only — clicking them for real opens an OS-native dialog outside
      any automated tool's control.

## M7 — Compare mode

- [x] "Compare…" trigger in the menu bar + ⌘⇧C shortcut
- [x] `CompareDialog`: pick another open tab, or "Open a file to compare…"
      (reuses M6's `pickAndReadFile`; compared files are never added as tabs)
- [x] `CompareView`: read-only side-by-side diff via `@codemirror/merge`'s
      `MergeView`, syntax-highlighted per side, themed through existing
      accent/danger tokens (no new CSS variables needed — they already matched)
- [x] Close returns to the normal tab/editor view unchanged
- [x] Verified live: diff highlighting, line alignment, and Close all
      confirmed working end-to-end in the browser

## M8 — Offline PWA

- [x] vite-plugin-pwa (`registerType: 'prompt'`), manifest (name, colors,
      standalone display) — `vite.config.ts`
- [x] Real 192×192 / 512×512 PNG icons (`public/icons/`) — rendered via an
      actual browser canvas and piped out through a throwaway local HTTP
      receiver (no image-processing dependency added just for two PNGs)
- [x] `UpdatePrompt` (`src/pwa/`): offline-ready notice + "new version,
      Reload" banner via `virtual:pwa-register/react`'s `useRegisterSW`,
      dismissible; unit-tested with the virtual module mocked
- [x] Production build confirmed: `sw.js` + `workbox-*.js` generated,
      manifest precaches 110 entries / ~4.3MB — includes every lazy-loaded
      Mermaid diagram-type chunk (dagre, graphlib, flowDiagram, …), not just
      the app shell
- [x] Verified live: with the preview server killed outright (not just
      DevTools throttling), a full reload still loads the entire app —
      menu bar, tabs, editor — and typing/editing/autosave all work with
      zero reachable origin. All Mermaid-related chunks confirmed fetched
      successfully from the SW cache while offline (checked via
      `performance.getEntriesByType('resource')`)
- [~] Mermaid _rendering the SVG_ while offline, and the PlantUML offline
  notice, were exercised live but not visually confirmed: the automated
  browser tab used for verification never became the OS-foreground tab
  (`document.visibilityState` stayed `'hidden'` even as the only open
  tab), and Chrome throttles `requestAnimationFrame` so aggressively in
  that state that a scheduled rAF took 131 seconds to fire once —
  Mermaid's layout step depends on it, so rendering never completed
  within a practical wait. This is a property of the automation
  environment, not the app: the same Mermaid code path (with the
  concurrency-queue fix from M5) was already confirmed working with a
  real rendered SVG earlier in this session in a foregrounded tab, and
  every asset it needs is proven to load correctly offline here. The
  PlantUML offline-notice path is covered by a passing unit test
  (`PreviewPane.test.tsx`, mocked `navigator.onLine`) but not re-checked
  live for the same reason. Flagged here rather than glossed over —
  worth a real manual check (open the built app, physically disconnect
  networking, look at it) before calling offline support fully done.

## M9 — Hardening & docs

- [x] Playwright smoke E2E (`e2e/smoke.spec.ts`, 9 tests): golden path —
  typing/autosave/reload, JSON format via menu and via keyboard shortcut,
  Base64 round-trip, Markdown+Mermaid preview, Compare mode, the "?"
  shortcuts dialog (incl. that typing a literal `?` doesn't reopen it),
  and a genuine offline reload with the network cut off. Runs against a
  real production build (`playwright.config.ts`'s `webServer`), not dev
  mode — this is also where CodeMirror's keymap dispatch gets verified,
  since jsdom can't reliably simulate it (see the M9 decision log entry).
  New CI job `e2e` (`.github/workflows/ci.yml`) runs it after `verify`.
- [x] Coverage thresholds enforced in CI (`vite.config.ts`, `test:coverage`
  step): `src/tools/**` at true 100% lines/branches/functions/statements
  (closed every previously-unreachable defensive-code branch by fixing
  the *types* instead — see decision log); overall thresholds set a few
  points below the actual ~96/88/95/97% achieved, with `App.tsx` excluded
  from measurement as orchestration wiring the e2e suite already covers.
- [x] "?" keyboard-shortcuts dialog (`src/components/ShortcutsDialog/`):
  lists File/Tools/View shortcuts, tool entries generated straight from
  the registry. Guarded against firing while typing `?` into the editor
  or a rename field.
- [x] `docs/ARCHITECTURE.md` (directory map, data flow, the tool-registry
  pattern, editor/preview pipelines, persistence, offline, testing
  strategy) and `docs/CONTRIBUTING.md` (conventions, pre-commit checks,
  testing philosophy); README updated to link both and reflect the
  now-complete feature set.
- [x] `.github/dependabot.yml` (weekly, npm + GitHub Actions, CodeMirror
  packages grouped since they must move together) and a `LICENSE` file
  (MIT, matching `package.json`). Final `npm audit --audit-level=high`:
  0 vulnerabilities.

## Decision log

- 2026-07-07 — create-vite now ships React 19 / Vite 8 / TS 6 / oxlint; kept
  React 19 (plan said 18 — 19 is current stable), replaced oxlint with
  ESLint + typescript-eslint per the approved plan.
- 2026-07-07 — `VITE_BASE` env var (set by deploy.yml from the repo name)
  instead of hard-coding the Pages base path in vite.config.ts.
- 2026-07-08 — Mermaid render calls must be serialized app-wide (see M5);
  the unit test suite mocks mermaid, so this class of bug only surfaces
  under real browser use — reinforces doing the manual verification pass
  before considering a milestone truly done, not just green CI.
- 2026-07-08 — The claude-in-chrome browser-automation tab never becomes
  the OS-foreground tab, so `requestAnimationFrame` is throttled to the
  order of minutes; anything rAF-dependent (Mermaid's layout step) can't
  be visually re-verified through it reliably. DOM/state assertions via
  `javascript_exec` stay reliable; screenshots and paint-dependent
  behavior don't. Worth remembering next time "verify visually" is asked
  for on rAF-heavy code — plan for a real manual check instead.
- 2026-07-08 — CodeMirror's internal keymap dispatch isn't reliably
  triggerable via jsdom's `fireEvent.keyDown` (tried it for the JSON
  Format shortcut; never fired). Dropped the unit test and put it in the
  Playwright suite instead, where a real browser's keyboard events work
  correctly. General rule: real-keyboard/real-DOM-dispatch behavior
  belongs in e2e, not jsdom.
- 2026-07-08 — Closing the coverage gap on `src/tools/**` surfaced a
  pattern worth keeping: several `?? fallback` / `isNaN` guards were
  provably unreachable given the calling code (e.g. `JSON.parse` only
  ever throws a real `Error`; a regex requiring `[0-9a-fA-F]+` can't
  produce a `NaN` parseInt). Fixing the *types* (discriminated unions in
  `json.ts`/`xml.ts`, casting to `CharacterData` where the DOM guarantees
  non-null `textContent`) let the dead branches be deleted outright
  instead of contorted into a test — both simpler code and honest 100%
  coverage, rather than coverage achieved by testing impossible states.
- 2026-07-08 — The offline-PWA e2e test needed real experimentation to
  get non-flaky: checking `registration.active` alone raced ahead of the
  service worker actually being ready to intercept fetches (a reload
  right after could hit `net::ERR_INTERNET_DISCONNECTED`). What worked
  reliably: a flat few-second wait, then reload, then wait for
  `navigator.serviceWorker.controller` specifically — controller, not
  just an active registration, is the real signal this page will be
  served from the SW cache.
