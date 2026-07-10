# OpenPad Feature 01 — Edit Menu

## Context

`docs/ui-mockup.html` already reserves a menu slot for "Edit" (between File
and the rest — see the `menu-item` list at the top of the mockup), but it
was never built; M1–M9 shipped File, Tools, Compare, and the theme/preview
toggles only (see `PROGRESS.md`). This feature closes that gap: a
discoverable **Edit** dropdown with **Undo**, **Redo**, **Find…**,
**Replace…**, with regex support in Find/Replace.

Cut/Copy/Paste are deliberately **out of scope** — they already work
today via native OS shortcuts (Cmd/Ctrl+X/C/V) because the editor surface
is a real focusable contenteditable, and CodeMirror has no clipboard
command of its own to hook a menu item into. Wiring them up would mean
reimplementing clipboard access via the browser Clipboard API purely for
menu discoverability, which adds real cross-browser risk (Firefox
restricts `clipboard.readText()`) for something users can already do
perfectly well with the keyboard. Decided: leave them out of the menu
entirely.

The underlying capability for what's left mostly **already exists** —
this is primarily a UI-wiring task, not new editing logic:

- `src/editor/extensions.ts` already installs `history()` +
  `historyKeymap` (undo/redo) and `search({ top: true })` +
  `searchKeymap` (`Mod-f` opens CodeMirror's built-in search panel).
- That built-in panel (from `@codemirror/search`) already ships **Find**,
  **Replace**, **Replace All**, and checkboxes for **regexp**,
  **case sensitive**, and **by word** — this maps directly onto the
  Notepad++-style "Normal search" vs "Regular expression search" split:
  checkbox off = plain substring search, checkbox on = full JS `RegExp`
  matching. (Notepad++ additionally has an "Extended" mode that
  interprets `\n`/`\t` escapes without full regex — not worth
  replicating since plain regex already covers that case.) It's already
  themed via `src/editor/theme.ts` (`.cm-panels` block), so no new
  styling is needed there either.

## Goals / scope

- New **Edit** dropdown in `MenuBar`, positioned between File and Tools
  (`File · Edit · Tools · Compare…`), styled with the existing
  `DropdownMenu.css` — no new CSS system needed.
- Menu items: **Undo**, **Redo**, — **Find…**, **Replace…**.
- Find/Replace support both plain-text and regex search, via
  CodeMirror's existing panel (see Context above) — normal search is the
  default, with a regexp checkbox to switch modes, same shape as
  Notepad++'s Find dialog.
- Cheap, on-open state reflection: Undo/Redo disabled when the history is
  empty in that direction.
- Shortcut hints shown in the menu (via the existing `formatShortcut`
  helper), matching already-working bindings — no user has to relearn a
  shortcut.

## Non-goals

- Cut/Copy/Paste — see Context above.
- No custom find/replace UI — reuse CodeMirror's panel as-is.
- No change to the `ToolDefinition` / `ToolResult` / tool-registry
  pattern. Undo/redo/find/replace are editor commands, not pure text
  transforms, so they don't belong in `src/tools/**` — same reasoning
  that already keeps Open/Save/Compare out of the registry today.
- The mockup's literal `File / Edit / Search / View / Tools / Help` list
  is not followed 1:1 — Find/Replace live under Edit (as in VS Code,
  Notepad++, etc.) rather than a separate top-level Search menu, and
  View/Help aren't part of this feature.

## Design decisions

1. **Command wiring.** Extend `EditorPaneHandle`
   (`src/components/EditorPane/EditorPane.tsx`) with imperative methods —
   `undo`, `redo`, `openFind`, `openReplace`, `getEditState` — the same
   pattern `runTool` already uses. `EditMenu` never touches CodeMirror
   directly; it only calls props threaded down from `App.tsx`, same as
   `FileMenu`/`ToolsMenu`.

2. **Undo/Redo.** Dispatch `undo`/`redo` from `@codemirror/commands`
   (already a dependency, already imported in `extensions.ts`) on the
   live view. Disabled state comes from `undoDepth`/`redoDepth` (also
   exported by `@codemirror/commands`), read once when the dropdown
   opens rather than piped through React state on every keystroke —
   cheap, and avoids re-rendering the whole menu bar on every edit.

3. **Find/Replace.** Both menu items call `openSearchPanel(view)` from
   `@codemirror/search` (already imported in `extensions.ts`). "Find…"
   leaves the default focus (the search field). "Replace…" additionally
   focuses the replace input right after opening — `@codemirror/search`
   doesn't expose a "focus replace" command, so this is a small
   `requestAnimationFrame` + `querySelector('.cm-panels input[aria-label="Replace"]')`
   lookup, isolated inside `EditorPane`. The regexp/case/word-boundary
   checkboxes and Replace/Replace All buttons need no new code — they're
   already in the panel.

## Files touched

- **New** `src/components/MenuBar/EditMenu.tsx` (+ `.test.tsx`) — same
  structure as `FileMenu.tsx`: dropdown, `useMenuClose`, disabled states,
  shortcut hints.
- **Modified** `src/components/EditorPane/EditorPane.tsx` — new
  `EditorPaneHandle` methods listed under Design decision 1.
- **Modified** `src/components/MenuBar/MenuBar.tsx` — mounts `EditMenu`
  between `FileMenu` and `ToolsMenu`; new props threaded through from
  `App.tsx`.
- **Modified** `src/App.tsx` — wires the new handlers to
  `editorRef.current`.
- **Modified** `src/components/ShortcutsDialog/ShortcutsDialog.tsx` —
  new "Edit" shortcut group (Undo, Redo, Find, Replace).
- **Modified** `docs/ARCHITECTURE.md` — mention `EditMenu` in the
  `MenuBar/` bullet of the directory map.
- **Modified** `PROGRESS.md` — new milestone entry (M10) and updated
  "Current state" note.

## Milestone — M10: Edit menu

1. Extend `EditorPaneHandle`/`EditorPane.tsx` with `undo`, `redo`,
   `openFind`, `openReplace`, `getEditState`.
2. `EditMenu.tsx` + test: renders Undo/Redo/Find…/Replace… with correct
   disabled/enabled state from `getEditState()`, correct shortcut hints,
   closes on selection/outside-click (reuses `useMenuClose`).
3. Wire into `MenuBar.tsx` and `App.tsx`.
4. `ShortcutsDialog.tsx`: add the Edit group.
5. Playwright e2e additions: type → Undo via menu → Redo via menu; open
   Find via menu and confirm a match highlights; open Replace via menu,
   toggle regexp, Replace All a pattern and confirm the document updates.
6. Docs: `docs/ARCHITECTURE.md` bullet, `PROGRESS.md` checklist +
   current-state note.

## Verification

- `npm run lint && npm run typecheck && npm test && npm run build` all
  green; `npm run test:coverage` thresholds still met.
- Manual check against `docs/ui-mockup.html`: Edit dropdown matches the
  existing File/Tools visual style, no new CSS needed.
- Manual pass: Undo/Redo via menu on a real edit; Find a plain-text
  match; switch to regexp mode and Replace All a pattern (e.g.
  `\d+` → `#`); confirm disabled states (Undo greyed out on a fresh
  document with no edits).
- `npm run e2e` green including the new Playwright cases.
