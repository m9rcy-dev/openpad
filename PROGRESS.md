# Progress

> Living checklist for the OpenPad build. Update this file **in the same
> commit** as the work it describes. A fresh session (human or AI) resumes
> from the "Current state" note plus `git log`.
> Plan: `docs/online-notepad-implementation-plan-01.md` · Design target: `docs/ui-mockup.html`

## Current state

**M9 done — all 9 originally planned milestones complete**, plus three
post-plan features: **M10 — Edit menu** (Undo/Redo/Find/Replace,
`docs/openpad-feature-01-plan.md`), **M11 — Theme picker** (accent
color presets + custom picker), and **M12 — Share tool** (stateless
share links), both from `docs/openpad-feature-02-plan.md`. Playwright
e2e suite (9 tests, all passing under parallel workers), coverage
thresholds enforced in CI (100% on `src/tools/**`, ~90%+ overall with
`App.tsx` excluded as orchestration glue covered by e2e instead), a "?"
keyboard-shortcuts dialog, and `docs/ARCHITECTURE.md` +
`docs/CONTRIBUTING.md` + `.github/dependabot.yml` + `LICENSE`.

`docs/openpad-feature-03-plan.md` adds three more, independent pieces:
a custom domain (`openpad.m9rcy.dev`) for the GitHub Pages deploy, a
gzip-compressed share-link format (raising the document cap from 20,000
to 100,000 characters, backward-compatible with links shared under the
old format), and a CSS fix for mouse-drag text selection not highlighting
its first row.

Remaining known gaps are the visual-only offline verification noted in
M8, e2e coverage for M11/M12 (unit/component tests are in place; no
Playwright cases added yet for the theme picker or share flow), and the
two items below that need the user directly.

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

## M10 — Edit menu (post-plan feature)

Plan: `docs/openpad-feature-01-plan.md`.

- [x] `EditorPaneHandle` extended with `undo`, `redo`, `openFind`,
      `openReplace`, `getEditState` — dispatches `@codemirror/commands`'
      `undo`/`redo`/`undoDepth`/`redoDepth` and `@codemirror/search`'s
      `openSearchPanel` on the live view; `openReplace` additionally
      focuses the panel's replace field
- [x] `EditMenu` component (`src/components/MenuBar/EditMenu.tsx`):
      Undo, Redo, Find…, Replace…, mounted between File and Tools.
      Undo/Redo disabled state is read from `getEditState()` once when
      the dropdown opens, not kept in sync on every keystroke
- [x] Cut/Copy/Paste deliberately excluded — already work via native OS
      shortcuts; wiring the Clipboard API in purely for menu
      discoverability was judged not worth the cross-browser risk
      (Firefox restricts `clipboard.readText()`) — see the plan's Context
- [x] Regex find/replace needed no new implementation: CodeMirror's
      built-in search panel already ships a regexp checkbox plus
      case-sensitive/whole-word toggles and Replace/Replace All, themed
      to match the app already
- [x] "?" shortcuts dialog: new Edit group (Undo, Redo, Find, Replace);
      Redo's binding is platform-dependent (`Cmd+Shift+Z` mac /
      `Ctrl+Y` elsewhere, per `@codemirror/commands`' `historyKeymap`) —
      added `redoShortcut()` to `src/utils/shortcuts.ts` to get it right
      on both
- [x] Found and fixed a pre-existing bug while extending `runTool`:
      `onToolStatusRef.current?.(applyToolToEditor(view, tool))` never
      evaluated `applyToolToEditor(...)` at all when `onToolStatus` was
      undefined, because an optional call's arguments are never
      evaluated when its callee is nullish — masked in production since
      `App.tsx` always passes the callback, but a real landmine. See
      decision log
- [ ] Playwright e2e additions for Undo/Redo/Find/Replace via menu
      _(not yet added — unit/component coverage is in place; e2e still
      pending)_

## M11 — Theme picker (post-plan feature)

Plan: `docs/openpad-feature-02-plan.md`, Part A.

- [x] `src/theme/color.ts` + tests: hex↔HSL round-trips, WCAG relative
      luminance and contrast ratio, `clamp` — pure math, no app
      knowledge
- [x] `src/theme/deriveAccentPalette.ts` + tests: derives
      `{ accent, accentInk, accentSoft, accentOn }` from one custom hex
      for either light or dark mode; `accentOn` is computed from the
      *derived* accent's real contrast, not guessed from the input, so
      a bright custom pick (verified with a saturated yellow) always
      gets legible dark text automatically
- [x] `src/theme/accentPresets.ts`: Chameleon Green / Cobalt Blue /
      Digital Violet hand-curated tables (the exact values validated in
      the earlier artifact-based color review); green mirrors
      `index.css`'s shipped tokens exactly, so it's a true no-op default
- [x] `src/theme/useAccentTheme.ts` + tests: persists the choice
      (`openpad:accent`) and applies all four tokens as **inline
      styles** on `<html>`, re-deriving a custom color when the
      light/dark mode changes instead of losing it
- [x] Fixed the five spots that hardcoded `color: #ffffff` instead of a
      token (`MenuBar.css`, `DropdownMenu.css` ×2, `UpdatePrompt.css`,
      `editor/theme.ts`'s `.cm-searchMatch-selected`) to read the new
      `--accent-on` token; added its default to all four blocks in
      `index.css`
- [x] `ThemeDialog.tsx` + tests: three preset swatches + a "Custom…"
      swatch that triggers a native `<input type="color">`; applies
      immediately, stays open after a pick, closes via Escape/backdrop/
      Close
- [x] Wired `Theme…` into `EditMenu` → `MenuBar` → `App.tsx`
- [x] Found and fixed a real bug during implementation, not just a
      typo: the first `accentOn` design compared a dark-mode accent
      against the app's dark-mode `--ink` token — but dark-mode `--ink`
      is a *light* color (body text on a dark background), so a bright
      dark-mode accent had no genuinely dark candidate to fall back to.
      Fixed by comparing against two fixed candidates (white / a fixed
      dark neutral) regardless of app mode — caught by the "keeps
      accentOn legibly contrasted" test, not by inspection. See
      decision log

## M12 — Share tool (post-plan feature)

Plan: `docs/openpad-feature-02-plan.md`, Part B.

- [x] `src/share/codec.ts` + tests: UTF-8 → base64url codec, same
      algorithm as `shareable-notepad`'s `Codec` module — ASCII, empty,
      Unicode, emoji, mixed, newlines/tabs, Arabic RTL, and malformed
      input decoding to `''` instead of throwing, all ported from that
      app's own test list
- [x] One deliberate improvement over the reference during the port:
      byte-to-binary-string conversion is chunked instead of
      `String.fromCharCode(...bytes)` in one call, which can throw
      `RangeError: Maximum call stack size exceeded` on a large
      `Uint8Array` (each byte becomes a spread argument) — verified with
      a 100k-character round-trip test
- [x] `src/share/shareLink.ts` + tests: `MAX_SHARE_CHARS = 20000` (same
      ceiling the reference already validates in production),
      `isOverShareLimit`, `buildShareUrl` (against the current
      origin+pathname, not a hardcoded domain)
- [x] Exported `loadIntoTab` from `src/files/useFileOperations.ts` and
      `nextUntitledName` from `src/store/documentsStore.ts` — both were
      module-private; the share-import path reuses them instead of
      duplicating the "replace the sole empty tab, else add a new one"
      rule and its collision-free naming
- [x] `ShareDialog.tsx` + tests: read-only auto-selected URL field +
      Copy link button (Clipboard API, success/failure reported via a
      callback, not a new toast system)
- [x] **Share…** wired into `ToolsMenu` as a fixed, non-registry entry
      below the categories, `disabled` + explanatory `title` driven by
      `isOverShareLimit(activeDocument.content)` — gated *before* the
      dialog can open, not click-then-warned, since length is the only
      real constraint (every character becomes a URL-safe base64
      character, so there's no "invalid character" case)
- [x] `src/share/importSharedLink.ts` + tests: `consumeSharedLink()`
      reads and unconditionally clears `location.hash` once it's
      non-empty (even a malformed link doesn't linger in the address
      bar), decodes it, and truncates to `MAX_SHARE_CHARS` with a
      `truncated` flag as defense in depth for a hand-edited or
      externally-produced oversized link
- [x] Wired a post-hydration effect in `App.tsx`: `consumeSharedLink()`
      → `loadIntoTab()` into a new tab (never overwrites existing work)
      → status notice ("Loaded shared note" or the truncation warning)
- [ ] Playwright e2e additions for the share round-trip (generate a
      link, navigate to it, confirm a new tab loads) — not yet added

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
- 2026-08-31 — Added `openpad.m9rcy.dev` as a custom domain on GitHub
  Pages (`docs/openpad-feature-03-plan.md` Part A): `public/CNAME` +
  a DNS `CNAME` record + repo Settings → Pages → Custom domain. Since a
  custom domain serves from the root rather than a `/openpad/` repo
  subpath, `VITE_BASE` was removed from `deploy.yml` (superseding the
  2026-07-07 entry above) — `base` now always defaults to `/`.
- 2026-08-31 — Share links now gzip-compress via native
  `CompressionStream`/`DecompressionStream` (`docs/openpad-feature-03-plan.md`
  Part B), no new dependency. Output carries a `z.`/`u.` marker prefix;
  a hash with no marker is decoded as the original pre-compression
  format, so links shared before this change keep working forever.
  `MAX_SHARE_CHARS` raised from 20,000 to 100,000. Compression made
  `encodeShareContent`/`decodeShareContent` async, which rippled into
  `buildShareUrl`, `consumeSharedLink`, and `ShareDialog` (moved its URL
  generation from an `App.tsx`-computed prop to an internal effect,
  since JSX can't `await`). Hit one non-obvious snag along the way:
  `new Blob([bytes]).stream()` — the MDN-idiomatic way to turn bytes
  into a `ReadableStream` for piping through `CompressionStream` —
  throws under Vitest's jsdom environment (`.stream is not a function`);
  jsdom's `Blob` polyfill doesn't implement it, even though real
  browsers and Node both do. Constructing the `ReadableStream` directly
  (`new ReadableStream({ start(c) { c.enqueue(bytes); c.close() } })`)
  sidesteps `Blob` entirely and works identically everywhere.
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
- 2026-07-10 — Adding an `EditorPane` test that didn't pass an
  `onToolStatus` prop surfaced a real bug in `runTool`:
  `onToolStatusRef.current?.(applyToolToEditor(view, tool))` — an
  optional call's arguments are never evaluated when its callee is
  nullish, so with no `onToolStatus` callback, `applyToolToEditor(...)`
  silently never ran at all; the tool wouldn't apply, not just fail to
  report. Masked in production because `App.tsx` always passes the
  callback. Fixed by evaluating the tool result into a variable first,
  then calling the optional callback with it. General rule: never nest
  a side-effecting call inside `x?.(...)` — the side effect depends on
  `x` being defined, which is rarely the intent.
- 2026-07-10 — `deriveAccentPalette`'s first `accentOn` implementation
  picked between white and the app's mode-matched `--ink` token, which
  seemed elegant (stays in sync if `--ink` is retuned) but was wrong:
  dark-mode `--ink` is a *light* color (it's body text on a dark
  background), so a bright dark-mode accent — the derivation
  deliberately lightens accents in dark mode — had no genuinely dark
  candidate to contrast against. The "keeps accentOn legibly
  contrasted" test caught it immediately (contrast ratios around 2,
  need ≥3) where eyeballing the code would not have. Fixed by comparing
  against two mode-independent fixed colors (white / a fixed dark
  neutral) instead — text-on-a-bright-button legibility isn't actually
  related to which app mode produced that button. General rule for this
  codebase: when a "just reuse the existing token" idea sounds too
  convenient, check what that token is actually *for* before reusing it
  for a different purpose.
- 2026-07-10 — Porting `shareable-notepad`'s `Codec.encode` surfaced a
  latent bug in the *source* being ported, not something introduced
  here: `btoa(String.fromCharCode(...bytes))` spreads every byte as a
  function argument, which throws `RangeError: Maximum call stack size
  exceeded` on some engines once a `Uint8Array` gets large enough (each
  byte is one spread argument). Never manifested in the reference app in
  practice — 20,000 characters of mostly-ASCII text stays under the
  limit — but a 20,000-character string of 4-byte-UTF-8 characters
  (emoji-heavy content) gets close, and nothing stopped a determined
  Unicode stress test from finding it. Fixed with a chunked conversion
  instead of a straight port; verified with a 100k-character round-trip
  test. General rule: "port the algorithm" doesn't mean "port a known JS
  anti-pattern along with it" — worth a second look at *how* a reference
  implementation does something, not just *what* it computes.
- 2026-07-10 — User-reported bug, found live, not in tests: text
  selection rendered as a fixed lavender (`#d7d4f0`) instead of the
  active accent color, but only while the editor had focus — unfocused
  selection was correctly accent-colored, which is what made this
  confusing to diagnose (single-line test selections looked fine;
  multi-line ones, checked while the editor stayed focused, didn't).
  Root cause: `@codemirror/view`'s own base theme hardcodes
  `&light.cm-focused > .cm-scroller > .cm-selectionLayer
  .cm-selectionBackground { background: #d7d4f0 }`, at higher CSS
  specificity (6 class-selector components) than our plain
  `.cm-selectionBackground` rule (3), so it silently won the moment
  `.cm-focused` was added — a rule this codebase's own unit tests can't
  catch, since jsdom doesn't compute real cross-stylesheet CSS
  specificity. Fixed with `!important` on that one property in
  `src/editor/theme.ts` (the standard, documented way to override this
  specific CodeMirror default — matching their selector exactly was
  considered and rejected as fragile against future CodeMirror internal
  changes). Confirmed via direct DOM/computed-style inspection in a real
  browser, not just visual screenshots — the `.cm-selectionBackground`
  elements' own `background-color` had reported correctly all along;
  only the *rendered* color was wrong, which a computed-style query
  catches and a coverage report never would.
