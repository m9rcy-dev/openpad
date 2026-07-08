# Online Notepad — Implementation Plan

## Context

Build a Notepad++-inspired online notepad as a pure client-side React app: multi-tab editing with utility tools (Base64, URL, HTML entity encode/decode; JSON/XML format/minify/validate; text utilities; file compare) and a live preview pane with full Markdown, Mermaid, and PlantUML support. Requirements:

- **Stack**: React + TypeScript + CodeMirror 6
- **Offline-first**: must run locally and work with no network (PWA)
- **Zero hosting cost**: static deploy to GitHub Pages — no server, no backend
- **Vulnerability-free, minimal dependencies**: only well-maintained open-source libraries; `npm audit` clean
- **Human-maintainable**: fully documented (TSDoc + architecture docs), fully tested, clean code — supportable without AI assistance
- **Resumable work**: progress tracked in-repo so a fresh session can continue where the last one stopped
- **Design target**: `docs/ui-mockup.html` (published as an artifact) is the approved visual reference — menu bar, tab strip, split editor/preview, tools menu, status bar, compare mode, and the chameleon-green design tokens. The build is checked against it.

## Tech stack (all free, actively maintained, minimal transitive deps)

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React 18 + TypeScript (strict) | Standard, fast, first-class GitHub Pages support via `base` config |
| Editor | CodeMirror 6 (`codemirror`, `@codemirror/lang-json`, `@codemirror/lang-xml`, `@codemirror/lang-markdown`) | Modular, ~150KB gz, offline-friendly |
| Diff/compare | `@codemirror/merge` | Official CodeMirror side-by-side merge/diff view |
| Markdown render | `markdown-it` + `DOMPurify` | Battle-tested renderer; every rendered fragment sanitized before insertion (XSS-safe) |
| Mermaid | `mermaid` (lazy-loaded via dynamic import) | Renders fully client-side → works offline; code-split so plain editing never pays its ~1MB cost |
| PlantUML | `plantuml-encoder` + PlantUML server | PlantUML needs Java — no practical in-browser renderer. Diagrams render via a server (public `plantuml.com` by default, URL configurable in Settings for self-hosting). **Online-only feature**: offline, the preview shows the diagram source with a clear "network required" notice |
| State | Zustand | ~1KB, zero transitive deps, trivially testable stores |
| Persistence | `idb-keyval` | ~600B promise wrapper over IndexedDB |
| Unit/component tests | Vitest + React Testing Library + jsdom | Native Vite integration |
| E2E tests | Playwright (smoke suite) | Verifies real offline/PWA behavior |
| Lint/format | ESLint (typescript-eslint) + Prettier | Enforced in CI |
| Offline | `vite-plugin-pwa` (Workbox) | Precache all assets; installable PWA |
| CI/CD | GitHub Actions | Lint + typecheck + test + audit on PR; deploy to Pages on main |

All transform tools are implemented as **dependency-free pure TypeScript functions** using browser natives (`TextEncoder`/`atob`/`btoa` for Base64 with UTF-8 handling, `encodeURIComponent`, `DOMParser` for XML, `JSON.parse/stringify`). No parsing/formatting libraries needed — smallest possible attack surface.

## Architecture

```
notepad/
├── .github/workflows/        ci.yml (lint,typecheck,test,audit,build) + deploy.yml (Pages)
├── docs/                     ARCHITECTURE.md, CONTRIBUTING.md
├── PROGRESS.md               ← living milestone/task checklist (session resumability)
├── e2e/                      Playwright smoke tests
├── public/                   PWA icons, manifest assets
└── src/
    ├── main.tsx, App.tsx
    ├── components/           TabBar, Toolbar (menus), StatusBar, EditorPane,
    │                         CompareView, ConfirmDialog — one folder per component
    │                         with Component.tsx + Component.test.tsx
    ├── editor/               CodeMirror setup: extensions, theme, language detection
    ├── preview/              PreviewPane.tsx (split view, scroll sync) + renderers:
    │                         markdown.ts (markdown-it + DOMPurify pipeline),
    │                         mermaid.ts (lazy import, renders ```mermaid fences),
    │                         plantuml.ts (encode → server image URL, offline fallback)
    ├── tools/                PURE FUNCTIONS ONLY — the heart of the app
    │   ├── encoding/         base64.ts, url.ts, htmlEntities.ts (+ .test.ts each)
    │   ├── json/             format, minify, validate (with line/col error location)
    │   ├── xml/              format, minify, validate (DOMParser-based)
    │   ├── text/             case convert, sort lines, dedupe, trim, counts
    │   └── registry.ts       tool metadata (id, label, category, fn) → menus render from this
    ├── store/                documentsStore.ts (Zustand: tabs, active doc, dirty flags)
    ├── storage/              persistence.ts (idb-keyval; debounced autosave, load-on-boot)
    ├── files/                open/save via File System Access API + download fallback
    └── types/                Document, ToolDefinition, ToolResult
```

**Key design rule**: every tool is a pure `(input: string) => ToolResult` function registered in `tools/registry.ts`. The menu UI, keyboard shortcuts, and tests all derive from the registry — adding a future tool means one pure function + one registry entry + one test file. `ToolResult` is a discriminated union (`{ ok: true, output } | { ok: false, error, position? }`) so failures (invalid JSON, malformed Base64) surface in the status bar, never as thrown exceptions in the UI.

**Autosave**: editor changes → Zustand store → debounced (~500ms) write to IndexedDB. On boot, all documents restore into tabs. Explicit "Save to file" downloads / writes via File System Access API where supported.

**Compare mode**: select two open tabs (or open a second file) → `@codemirror/merge` renders side-by-side diff in a dedicated view; read-only, close to return.

**Preview pane**: toggleable split view (on by default for `.md` tabs). Pipeline: document → markdown-it → DOMPurify sanitize → render; fenced ` ```mermaid ` blocks render locally via lazy-loaded mermaid; ` ```plantuml ` blocks render as `<img>` from the configured PlantUML server (encoded with `plantuml-encoder`), degrading offline to the source plus a "network required" notice. Editor↔preview scroll sync. Security rule: no rendered HTML ever bypasses DOMPurify.

## Milestones (each independently shippable; commit + check off PROGRESS.md per task)

1. **M1 — Scaffold & pipeline**: Vite+React+TS strict, ESLint/Prettier, Vitest, `PROGRESS.md`, CI workflow, GitHub Pages deploy of a hello-world shell (derisks `base` path early). Vite `base: '/<repo-name>/'`.
2. **M2 — Core editor**: CodeMirror pane, single document, status bar (line:col, length, selection), light/dark theme toggle.
3. **M3 — Tabs & persistence**: multi-tab (new/rename/close with dirty-check), Zustand store, IndexedDB autosave + restore.
4. **M4 — Tools**: registry + all four packs (encoding, JSON, XML, text utilities) as pure functions with exhaustive unit tests (round-trips, unicode, malformed input, empty input); menu + shortcuts wiring; apply to selection-or-whole-document.
5. **M5 — Markdown & diagram preview**: split preview pane per the mockup — markdown-it + DOMPurify rendering, scroll sync, lazy-loaded Mermaid for ` ```mermaid ` fences, PlantUML via configurable server with offline fallback notice, preview toggles in the Tools menu.
6. **M6 — File operations**: Open/Save/Save As (File System Access API, download fallback), drag-and-drop to open, language auto-detect by extension (`.md`, `.json`, `.xml`, `.puml`, `.mmd`, …).
7. **M7 — Compare**: `@codemirror/merge` view comparing two tabs or a tab vs. an opened file.
8. **M8 — Offline PWA**: `vite-plugin-pwa`, manifest + icons, update-available prompt; verify airplane-mode operation (including Mermaid rendering and the PlantUML offline notice).
9. **M9 — Hardening & docs**: Playwright smoke E2E (create note → transform → reload → persisted; offline load), coverage thresholds (~90% overall, 100% on `src/tools`), keyboard shortcut help dialog, `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`, Dependabot config, final `npm audit` pass.

## Progress tracking (resumability requirement)

- `PROGRESS.md` at repo root: milestone → task checkboxes, updated **in the same commit** as the work it describes. Top section holds a short "current state / next task" note.
- Conventional commits, one commit per completed task — `git log` + `PROGRESS.md` let any fresh session (or human) resume instantly.
- `CLAUDE.md` at repo root pointing to `PROGRESS.md` and stating project conventions.

## Documentation & code-quality standards (applied throughout, not at the end)

- TSDoc on every exported function/component/type; `@example` blocks on all tool functions.
- ESLint + Prettier enforced in CI; TypeScript `strict: true`; no `any`.
- Every `src/tools/*` module gets a colocated `.test.ts` written with the implementation (target 100% coverage there); components get RTL tests for user-visible behavior.
- CI blocks merge on lint, typecheck, tests, `npm audit --audit-level=high`, and build.

## Verification

- **Per milestone**: `npm run lint && npm run typecheck && npm test && npm run build` all green; manual check of the new feature in `npm run dev`, compared against `docs/ui-mockup.html`.
- **M1**: deployed hello-world loads at `https://<user>.github.io/<repo>/`.
- **M5**: markdown doc with a Mermaid fence and a PlantUML fence renders both diagrams; XSS probe (`<img onerror=…>` in markdown) is sanitized; preview scroll stays in sync.
- **M8**: build + preview, load once, toggle DevTools offline, reload — app fully functional; Mermaid still renders, PlantUML shows the offline notice; install as PWA.
- **M9**: `npx playwright test` green; end-to-end manual pass: create tabs → paste JSON → format → minify → base64 round-trip → markdown+mermaid preview → compare two tabs → close browser → reopen → all tabs restored.

## Open item

- GitHub repository name (determines Vite `base` path and the Pages URL). Defaults to `notepad` unless specified otherwise.
