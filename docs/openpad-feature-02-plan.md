# OpenPad Feature 02 — Theme picker & Share tool

Two independent additions bundled in one plan file: a **Theme (accent
color) picker** in the Edit menu, and a **Share** tool in the Tools menu
that turns the active document into a copyable link, ported from the
same stateless-URL mechanism as `shareable-notepad`
(`/Users/m9rcy/dev/ai/shareable-notepad/app.js`, live at
https://m9rcy-dev.github.io/shareable-notepad/). They don't depend on
each other; each has its own milestone (M11, M12) and can ship
separately.

## Part A — Theme picker

### Context

OpenPad ships one accent color today: chameleon green, defined as three
CSS custom properties (`--accent`, `--accent-ink`, `--accent-soft`) with
separate light/dark values in `src/index.css`. Every component styles
itself through those tokens rather than hardcoded colors, so swapping
the accent is architecturally cheap — this feature adds a **Theme…**
item to the Edit menu that lets the user pick from two curated presets
plus the default, or choose any color via a native color picker, with
the whole UI recoloring live.

This follows on from `docs/openpad-feature-01-plan.md` (Undo/Redo/Find/
Replace), which shipped the Edit menu this slots into. The two presets
were chosen and visually validated earlier in an artifact-based review:

- **Cobalt Blue** (`#2F6FED` light / `#5B8FF5` dark) — a refreshed
  classic tech blue.
- **Digital Violet** (`#8F6FC9` light / `#B49AE8` dark) — deepened from
  Olivia Rodrigo's SOUR-era palette (cover-art tones `#6871A6`/`#948CCC`
  plus the brand lilac `#D3BEE8`, which shows up unmodified in the soft/
  tint states).

### A real gap found while scoping this: hardcoded white-on-accent text

Grepping the codebase for everywhere `var(--accent)` is used as a solid
background turned up **five spots that hardcode `color: #ffffff` (or an
`rgba(255,255,255,…)` tint) instead of reading a token**:

| File | Selector |
|---|---|
| `src/components/MenuBar/MenuBar.css` | `.menu-bar-logo` |
| `src/components/MenuBar/DropdownMenu.css` | `.menu-trigger-open`, `.dropdown-menu-item:hover`/`:focus-visible` (+ the `rgba(255,255,255,0.75)` dimmed-shortcut variant) |
| `src/pwa/UpdatePrompt.css` | `.update-prompt-action` (the Reload button) |
| `src/editor/theme.ts` | `.cm-searchMatch-selected` |

Chameleon green (`#2e8b46`/`#4fbf68`) and Cobalt Blue are dark/saturated
enough that white text passes; a bright custom color (say, yellow) would
make these spots illegible. This has to be fixed as part of this
feature, not worked around per-color — see Design decision 2.

One more thing this grep confirmed as a *non*-issue: the CodeMirror
editor theme (`src/editor/theme.ts`) already references `var(--accent)`
etc. as live CSS custom-property strings, not JS-resolved build-time
values — so once the new tokens are set on `:root`, the editor's caret,
selection-match highlighting, and syntax colors (headings, links,
keywords…) repaint automatically with **zero editor reconfiguration**.

### Goals / scope

- **Theme…** item in the Edit menu (own group, below Find/Replace).
  Opens a small dialog, not a dropdown list — this needs a live preview
  surface, not just clickable rows.
- Three swatches — **Chameleon Green** (default), **Cobalt Blue**,
  **Digital Violet** — plus a **Custom** swatch that reveals a native
  `<input type="color">`.
- Selecting a preset or picking a custom color **applies immediately**
  (no Apply/OK step), consistent with the existing instant theme
  toggle. The dialog stays open after a pick so the user can compare —
  it only closes via Close / Escape / backdrop click, like
  `ShortcutsDialog`.
- Choice persists across reloads (localStorage, same pattern as
  `useTheme`).
- Fixes the five hardcoded-white spots above with a new `--accent-on`
  token, computed per accent so text stays legible regardless of how
  bright or dark the chosen color is.

### Non-goals

- No per-document or per-tab accent — one accent, app-wide, like the
  existing light/dark toggle.
- No arbitrary editing of `--accent-ink`/`--accent-soft` independently
  of `--accent` — the user picks one color; the app derives the rest.
- Not touching `--bg`/`--chrome`/`--surface`/etc. (the green-biased
  neutral grays) — only the three accent tokens (plus the new
  `--accent-on`) change. A custom accent sitting on unrelated-hued
  neutrals is an accepted tradeoff (see Design decision 3).

### Design decisions

1. **Where the tokens get set.** Presets are visually hand-tuned (see
   Context) and a generic formula wouldn't reproduce them — e.g. the
   SOUR violet's soft tint is deliberately the exact iconic pastel, not
   a mechanically desaturated version of the deep solid-button violet.
   So presets stay as **hand-curated constant tables**
   (`src/theme/accentPresets.ts`), one entry per preset with explicit
   light and dark `{ accent, accentInk, accentSoft, accentOn }`. Custom
   colors can't be hand-curated, so they go through a **derivation
   function** (`src/theme/deriveAccentPalette.ts`) instead — see
   decision 2. Both paths produce the same shape, so applying either is
   one code path: set four CSS custom properties on
   `document.documentElement` via `style.setProperty` (inline style,
   not a CSS class) each time the selection or the light/dark mode
   changes. Inline style deliberately overrides the light/dark
   `:root`/`[data-theme]` blocks in `index.css`, which keep sane
   defaults (chameleon green) for the instant before the accent hook's
   effect runs.

2. **`--accent-on`: automatic on-accent text color.** A new token,
   computed — not hand-picked per preset — from the *relative luminance*
   of whatever `accent` value is in play: light text if the accent is
   dark enough to give ≥ readable contrast, dark text (`--ink`)
   otherwise. This single formula reproduces, without special-casing,
   the pattern already established by hand for the shipped presets
   (dark/saturated hues like green/blue/violet → white text; inherently
   bright hues like a hypothetical lime/yellow custom pick → dark text)
   — and it's the only way to guarantee legibility for a color the user
   picks freely. `index.css` gets a static `--accent-on: #ffffff` (light)
   default so components never see an undefined token before the accent
   hook's first effect runs. The five spots in the Context section
   switch from hardcoded white to `var(--accent-on)`; the
   `rgba(255,255,255,0.75)` dimmed-shortcut variant becomes
   `color-mix(in srgb, var(--accent-on) 75%, transparent)`.

3. **Deriving a palette from one custom hex.** `deriveAccentPalette(hex,
   mode)` converts to HSL and produces the other three tokens by
   adjusting lightness/saturation relative to the input, separately for
   `light`/`dark` mode (mirroring the relationship already visible
   between each preset's light and dark rows): roughly, light mode
   clamps `accent` toward a legible mid lightness and darkens further
   for `accentInk`; dark mode lightens `accent` and lightens further for
   `accentInk`; `accentSoft` is a very pale (light mode) or very dark,
   desaturated (dark mode) tint of the same hue. `accentOn` is always
   the luminance computation from decision 2, applied to whatever
   `accent` value comes out — so a bright custom pick automatically
   gets dark text without a special case. Exact lightness/saturation
   constants get tuned during implementation against real color
   swatches, the same way the presets were, but the *function signature
   and shape* (`hex, mode -> { accent, accentInk, accentSoft, accentOn
   }`) is fixed now so the rest of the feature can be built against it.
   Small color-math helpers (`hexToHsl`, `hslToHex`, relative luminance)
   live in a colocated `src/theme/color.ts`, each independently unit
   tested — this is the one part of the feature that's genuinely new
   logic rather than wiring, so it gets the most test attention.

4. **Storage & the hook.** `src/theme/useAccentTheme.ts`, modeled on
   `useTheme.ts`: persists the selection to `localStorage` under
   `openpad:accent` as `{ type: 'preset', id } | { type: 'custom', hex
   }`, defaulting to the green preset. It takes the *current effective*
   light/dark theme as an input (from `useTheme()`) and re-applies
   whenever either the selection or the light/dark mode changes — so
   toggling light/dark while a custom accent is active keeps that
   accent, correctly recomputed for the new mode, rather than reverting
   to green.

5. **Dialog, not a dropdown.** `ThemeDialog.tsx`, structurally close to
   `ShortcutsDialog`/`CompareDialog` (backdrop, centered panel, Escape/
   backdrop/Close-button dismissal) rather than a `DropdownMenu` list,
   because swatches need to be a visual grid and the custom option needs
   room for the native color input plus a preview. `EditMenu` gets a
   `Theme…` item (own group, under Find/Replace) that opens it via a new
   `onOpenTheme` prop — same wiring pattern `App.tsx` already uses for
   `onOpenShortcuts`/`shortcutsOpen`.

### Files touched

- **New** `src/theme/color.ts` (+ `.test.ts`) — `hexToHsl`, `hslToHex`,
  relative-luminance helper.
- **New** `src/theme/deriveAccentPalette.ts` (+ `.test.ts`) — the
  custom-color derivation from decision 3.
- **New** `src/theme/accentPresets.ts` — the three hand-curated preset
  tables from decision 1 (green mirrors the tokens already in
  `index.css`, so re-selecting it after a custom pick is just
  re-applying this table).
- **New** `src/theme/useAccentTheme.ts` (+ `.test.ts`) — selection
  persistence + token application (decision 4).
- **New** `src/components/MenuBar/ThemeDialog.tsx` (+ `.css` +
  `.test.tsx`) — swatch grid, custom color input, live preview
  (decision 5).
- **Modified** `src/index.css` — add the `--accent-on` default token
  (light + dark).
- **Modified** `src/components/MenuBar/MenuBar.css`,
  `src/components/MenuBar/DropdownMenu.css`, `src/pwa/UpdatePrompt.css`,
  `src/editor/theme.ts` — the five hardcoded-white spots switch to
  `var(--accent-on)` / the `color-mix` variant.
- **Modified** `src/components/MenuBar/EditMenu.tsx` — new `Theme…`
  item + `onOpenTheme` prop.
- **Modified** `src/components/MenuBar/MenuBar.tsx`, `src/App.tsx` —
  thread `onOpenTheme` / dialog-open state through, same pattern as the
  Shortcuts dialog.
- **Modified** `docs/ARCHITECTURE.md`, `PROGRESS.md` — document the
  accent-token system, new M11 checklist.

### Milestone — M11: Theme picker

1. `src/theme/color.ts` + tests: hex↔HSL round-trips, luminance against
   known light/dark colors.
2. `src/theme/deriveAccentPalette.ts` + tests: a spread of input hues
   (including near-white, near-black, and a bright yellow/lime-like
   input) produce a valid, legible `{ accent, accentInk, accentSoft,
   accentOn }` for both modes.
3. `src/theme/accentPresets.ts`: green/cobalt/violet tables using the
   exact values validated in the earlier artifact review.
4. `src/theme/useAccentTheme.ts` + tests: persists and restores the
   selection, re-applies on light/dark toggle, defaults to green.
5. Fix the five hardcoded-white spots to use `--accent-on` (Context
   section); add the default token to `index.css`.
6. `ThemeDialog.tsx` + tests: renders all three presets + Custom,
   selecting a preset applies it immediately without closing the
   dialog, custom color input applies live, Escape/backdrop/Close all
   dismiss.
7. Wire `Theme…` into `EditMenu.tsx` → `MenuBar.tsx` → `App.tsx`.
8. Docs: `docs/ARCHITECTURE.md`, `PROGRESS.md` M11 checklist + current-
   state note.

### Verification

- `npm run lint && npm run typecheck && npm test && npm run build` all
  green; coverage thresholds still met (`src/theme/**` isn't under
  `src/tools/**`'s mandatory 100% rule, but `color.ts`/
  `deriveAccentPalette.ts` are pure logic and should be tested that
  thoroughly anyway per decision 3).
- Manual pass in the browser: switch to each preset, confirm the whole
  UI recolors (menu bar, dropdowns, editor caret/selection/syntax
  highlighting, the PWA update banner) with legible text throughout;
  pick a bright custom color (e.g. yellow) via the color input and
  confirm text over solid-accent buttons stays dark, not white-on-
  yellow; toggle light/dark while a custom accent is active and confirm
  it's recomputed rather than reverting to green; reload and confirm
  the choice persisted.

### Open question for the user

`--accent-on`'s luminance threshold determines exactly which custom
colors get white vs. dark text — worth a quick visual sanity check once
implemented (a mid-saturation orange or teal sits closest to the
boundary) rather than trusting the formula blind. Flagging now so it's
not a surprise during verification, not something to resolve before
starting.

## Part B — Share tool

### Context

`/Users/m9rcy/dev/ai/shareable-notepad/app.js` (live at
https://m9rcy-dev.github.io/shareable-notepad/) is a **stateless**
notepad: the entire document lives in the URL hash fragment, base64url-
encoded (UTF-8 bytes → base64 → `+`/`/`/`=` swapped for `-`/`_`/nothing).
There's no backend and no persistence — the URL *is* the document.
Sharing means: encode the current text into the hash, copy
`location.href`, done. Loading means the reverse, run on every page
load and on `hashchange`.

OpenPad needs the same **mechanism** (hash-based, stateless, no backend
— matches the "no backend, ever" rule in `CLAUDE.md`), but not the same
**app shape**: OpenPad is multi-tab and IndexedDB-persisted, where
`shareable-notepad` is a single unnamed textarea. So "share" here means
"turn the *active tab's* content into a link," and — new beyond what
was literally asked for, see the callout below — "receive" means "a
link like that opens as a *new tab* in OpenPad," not overwrite whatever
the user already has open.

**Scope note:** the request was for the generate → present → copy half
only ("once share is clicked from Tools, a URL is presented, the user
copies it"). But a link nobody can open is a dead end, and
`shareable-notepad` itself always paired encode-on-share with decode-
on-load — that pairing is what "follow how it works" means end to end.
So this plan includes both directions. If you'd rather ship
generate-only for now and add receiving later, say so — it's a clean
milestone split (steps 1–5 vs. 6–7 below).

### Goals / scope

- **Share…** item in the Tools menu (a fixed entry below the registry-
  driven categories — Share isn't a text transform, so it doesn't
  belong in `src/tools/**`'s registry, same reasoning that already
  keeps Open/Save/Compare/Undo/Redo out of it).
- **The item is only enabled when the active document can actually be
  shared** — disabled (with a title tooltip explaining why), not just
  clickable-then-warned, whenever the content is too long for the
  receiving end to load it back. See Design decision 1 for what "too
  long" means precisely and why character *validity* isn't a real
  constraint here.
- Clicking it (when enabled) opens a small dialog showing the generated
  URL in a read-only, auto-selected text field, plus a **Copy link**
  button.
- The URL encodes the *active document's whole content* (no selection
  semantics — matches `shareable-notepad`, which has no concept of a
  partial share).
- Opening a generated link (in any browser, any time) loads its content
  into a **new tab** in OpenPad, the same way opening a file does; it
  never overwrites an existing tab's content.
- Same UTF-8-safe base64url codec as the reference, so the encoding
  itself is byte-for-byte the same algorithm — Unicode, emoji, RTL text,
  newlines/tabs all round-trip exactly like they do today in
  `shareable-notepad`.

### Non-goals

- No cross-app interoperability with `shareable-notepad` itself — a
  link generated by one app points at that app's own origin+path, so it
  opens *that* app, not the other. (The encoded *payload* is decodable
  by both, since the algorithm matches, but nothing here builds a
  redirect or cross-app handoff — not asked for, and it's not obvious
  it'd even be wanted.)
- No filename/language/multi-tab bundling in the link — the reference
  shares raw text only, and this matches it exactly rather than
  inventing a richer format.
- No `Ctrl/Cmd+S` shortcut for Share, unlike the reference — that key is
  already `File → Save` in OpenPad. Menu-click only; not every action
  needs a shortcut (`Replace…` already has none, per feature 01).
- No link expiry, revocation, or analytics — there's no backend to hold
  any of that; the link's lifetime is exactly as long as someone keeps
  the URL.

### Design decisions

1. **What actually gates availability: length only, not character
   validity.** Every character in the source text becomes part of a
   base64url alphabet (`A`–`Z`, `a`–`z`, `0`–`9`, `-`, `_`) before it
   ever touches the URL — that's what the codec in decision 3 does. So
   there's no character (Unicode, emoji, control characters, anything)
   that can produce an invalid URL; the *encoded* output is always
   URL-safe regardless of *input*. The only real constraint is **length**:
   the same `MAX_SHARE_CHARS = 20000` ceiling the reference already
   validated, applied to the source text before encoding (not the
   encoded/URL length, which runs larger and is a less meaningful number
   to show a user). `src/share/shareLink.ts` exposes
   `isOverShareLimit(content): boolean` and `Share…`'s `disabled` prop
   is `isOverShareLimit(activeDocument.content)`, threaded down from
   `App.tsx` through `MenuBar`/`ToolsMenu` exactly like
   `FileMenu`'s `dirty`-gated Save already works — evaluated fresh every
   render (a length check is cheap; no need for the "compute on menu
   open" pattern `EditMenu` uses for Undo/Redo, since that pattern exists
   specifically because reading CodeMirror's history depth requires
   touching the live view imperatively, and document length is already
   plain React state). Disabled state carries a `title` explaining why,
   e.g. *"Document is 21,483 characters — Share supports up to
   20,000."* Because the dialog only opens when the document already
   passed this check, and the dialog is a modal backdrop that blocks
   editing while open (same as `ShortcutsDialog`/`CompareDialog`), the
   content can't grow past the limit *while the dialog is showing it* —
   so there's no in-dialog warning state to build, just the disabled
   button beforehand.

2. **Receiving-side truncation is still worth keeping, as defense in
   depth.** The 20,000-character gate stops OpenPad from ever
   *generating* an oversized link, but `consumeSharedLink()` (decision
   5) has no way to know a hash it's decoding came from OpenPad at all —
   someone could hand-edit the URL, or another tool entirely could
   produce one. So the receiving side still truncates to
   `MAX_SHARE_CHARS` and surfaces a notice if it has to, exactly as
   originally planned — it just becomes a rare/defensive path instead of
   the common one, now that the common case is caught before a link is
   ever generated.

3. **Codec stays a straight port.** `src/share/codec.ts` mirrors the
   reference's `Codec` module exactly: `TextEncoder` → `btoa` →
   URL-safe substitution for encode, the reverse for decode, both
   wrapped so malformed input decodes to `''` instead of throwing (the
   reference does this with try/catch around `atob`; same here). No
   reason to redesign a working, already-tested algorithm — the
   reference's own test list (ASCII, empty, Chinese, emoji, mixed,
   newlines/tabs, Arabic RTL, 10k-char) is a ready-made spec for this
   module's tests.

4. **Where the link points.** `buildShareUrl(content)` uses
   `window.location.origin + window.location.pathname + '#' +
   encode(content)` — i.e. wherever OpenPad itself is currently being
   served from (works unmodified in local dev and on the deployed
   GitHub Pages `base` path, no hardcoded domain). This is a deliberate
   difference from just copying `location.href` like the reference
   does: OpenPad's `location.hash` isn't otherwise meaningful (no
   existing feature uses it), so this doesn't collide with anything.

5. **Receiving: reuse the file-open tab logic, don't duplicate it.**
   `src/files/useFileOperations.ts` already has exactly the behavior a
   shared link needs on arrival — "replace the sole untouched
   `untitled-N` tab if that's all that's open, otherwise add a new
   tab" — in its module-private `loadIntoTab()`. Export it and call it
   from the new share-import path instead of writing a second copy of
   that rule. The generic `untitled-N` naming is reused as-is; the
   reference has no filename concept either, so there's no name to
   carry over.

6. **Import timing.** A new `consumeSharedLink()` in
   `src/share/importSharedLink.ts` reads `window.location.hash`,
   decodes it, and — critically — clears it via
   `history.replaceState(...)` immediately after reading, so a reload
   never re-imports the same link into a second tab. It runs once,
   in `App.tsx`, **after** `hydrateDocumentsStore()` resolves (so
   `isEmptyUntitledDocument` sees the real post-hydration tab set, not
   a transient empty one) — not on a `hashchange` listener like the
   reference, since OpenPad has no reason to react to the hash changing
   after boot (nothing else ever sets it).

7. **Feedback.** Both directions reuse the existing `StatusBar`
   `notice` channel rather than the reference's toast: "Link copied to
   clipboard" / "Copy failed — link is shown below" on share, "Loaded
   shared note" / "Shared note was truncated to 20,000 characters" on
   import — same channel `reportFileError` and tool results already use,
   no new UI pattern.

### Files touched

- **New** `src/share/codec.ts` (+ `.test.ts`) — `encodeShareContent`,
  `decodeShareContent`, ported from the reference (decision 3).
- **New** `src/share/shareLink.ts` (+ `.test.ts`) — `buildShareUrl`
  (decision 4), `MAX_SHARE_CHARS`, `isOverShareLimit` (decision 1).
- **New** `src/share/importSharedLink.ts` (+ `.test.ts`) —
  `consumeSharedLink()` (decision 6).
- **Modified** `src/files/useFileOperations.ts` — export `loadIntoTab`
  (decision 5).
- **New** `src/components/MenuBar/ShareDialog.tsx` (+ `.css` +
  `.test.tsx`) — URL field + Copy link button only; no in-dialog
  over-limit state, since the item that opens it is already gated
  (decision 1).
- **Modified** `src/components/MenuBar/ToolsMenu.tsx` — fixed
  `Share…` entry below the registry-driven categories, `disabled` +
  `title` driven by `isOverShareLimit`; doc-comment updated to note the
  one non-registry exception.
- **Modified** `src/App.tsx` — `shareDialogOpen` state + wiring (same
  pattern as the Compare/Shortcuts dialogs); computes
  `isOverShareLimit(activeDocument.content)` and passes it down; a
  post-hydration effect calling `consumeSharedLink()` →
  `loadIntoTab()` → status notice.
- **Modified** `docs/ARCHITECTURE.md`, `PROGRESS.md` — document the
  share mechanism, new M12 checklist.

### Milestone — M12: Share tool

1. `src/share/codec.ts` + tests (the reference's own test list as the
   spec — ASCII, empty, Unicode, emoji, mixed, newlines/tabs, RTL, long
   text, malformed input decodes to `''` rather than throwing).
2. `src/share/shareLink.ts` + tests: URL shape, `isOverShareLimit` at,
   under, and over the boundary.
3. Export `loadIntoTab` from `useFileOperations.ts` (no behavior
   change, just visibility).
4. `ShareDialog.tsx` + tests: shows the URL, Copy link succeeds/fails
   gracefully (mock `navigator.clipboard`).
5. Wire `Share…` into `ToolsMenu.tsx` → `App.tsx`, including the
   disabled/title state; test that it's disabled with the right title
   when the active document is over `MAX_SHARE_CHARS`, enabled
   otherwise.
6. `src/share/importSharedLink.ts` + tests: decodes and clears the
   hash, `null` on no/invalid hash, truncation flag when over the
   limit (the defense-in-depth path from decision 2).
7. Wire the post-hydration import effect in `App.tsx`, reusing
   `loadIntoTab`; status notices for both the loaded and truncated
   cases.
8. Docs: `docs/ARCHITECTURE.md`, `PROGRESS.md` M12 checklist +
   current-state note.

### Verification

- `npm run lint && npm run typecheck && npm test && npm run build` all
  green.
- Manual pass: share a note with mixed Unicode/emoji content, copy the
  link, open it in a fresh tab (or paste into the address bar) —
  confirm a *new* OpenPad tab appears with identical content and the
  hash is gone from the address bar afterward; reload that fresh tab
  and confirm nothing re-imports; type/paste a document past 20,000
  characters and confirm **Share…** goes disabled with a title
  explaining why (and re-enables when trimmed back under); manually
  craft an oversized hash and confirm the receiving side truncates with
  a notice instead of failing.
- Cross-check against the reference: paste the encoded fragment
  `shareable-notepad` produces for some sample text into OpenPad's
  `decodeShareContent` (e.g. via a quick console check) and confirm it
  decodes identically — the algorithms should be byte-for-byte
  compatible even though the two apps don't otherwise talk to each
  other.
