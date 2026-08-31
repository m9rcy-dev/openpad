# OpenPad Feature 03 — Custom domain, compressed share links, selection fix

Three independent pieces of work bundled in one plan file, following the
house style of `docs/openpad-feature-01-plan.md` / `-02-plan.md`. None
depend on each other and each shipped as its own commit: (A) serve the
app at `openpad.m9rcy.dev` via GitHub Pages custom domain, (B) raise the
Share tool's document cap via native gzip compression, (C) fix a bug
where mouse-drag text selection doesn't visually highlight its first
row.

## Part A — Custom domain: `openpad.m9rcy.dev` on GitHub Pages

### Context

The user owns `m9rcy.dev` and wants the app reachable at
`openpad.m9rcy.dev`. GitHub Pages supports custom domains natively (free
auto-provisioned HTTPS via Let's Encrypt) — no need to move off Pages.
Previously the site was a **project page** served from
`https://<user>.github.io/openpad/`, so `.github/workflows/deploy.yml`
built with `VITE_BASE=/${{ github.event.repository.name }}/`, and
`vite.config.ts` documented that `vite-plugin-pwa` derives the service
worker scope/`start_url` from that same `base`. A custom domain serves
from the **domain root**, not `/openpad/`, so `VITE_BASE` had to stop
being set to the repo-name path — otherwise the PWA manifest/SW scope
and all asset URLs would incorrectly assume a `/openpad/` subpath that
no longer exists once the domain is live.

### Steps

1. **`public/CNAME`** — new file containing exactly `openpad.m9rcy.dev`.
   Vite copies everything under `public/` verbatim to `dist/` root, so
   this lands at `dist/CNAME`, which is what GitHub Pages reads to
   configure the custom domain on each deploy.
2. **`.github/workflows/deploy.yml`** — removed the `VITE_BASE` env var
   from the build step so the build defaults to `base: '/'`. Updated the
   header comment to reflect the domain-root deploy.
3. **DNS (manual, outside this repo)** — the user adds, at their DNS
   provider for `m9rcy.dev`, a `CNAME` record: `openpad` →
   `<user>.github.io`.
4. **Repository settings (manual, outside this repo)** — Settings → Pages
   → Custom domain → enter `openpad.m9rcy.dev` → enable "Enforce HTTPS"
   once the certificate provisions.
5. **`README.md`** — added a "Custom domain" subsection under "Deploying
   to GitHub Pages" covering the DNS record, repo settings, and
   `public/CNAME`; updated the top blurb to link the live domain.
6. **`docs/ARCHITECTURE.md`** — added a "Deployment" section describing
   the custom domain, `public/CNAME`, and why `base` defaults to `/`.
7. **`PROGRESS.md`** — decision-log entry recording the switch.

### Non-goals

- Not migrating off GitHub Pages (see conversation: GitHub Pages already
  supports custom domains natively, so Vercel wasn't needed).

### Verification

- `npm run build` locally with no `VITE_BASE` set — confirm
  `dist/index.html` references root-relative asset paths, and
  `dist/CNAME` exists containing `openpad.m9rcy.dev`.
- After DNS propagates and the user adds the custom domain in repo
  settings: load `https://openpad.m9rcy.dev`, confirm HTTPS is valid,
  confirm the service worker registers with scope `/`, and confirm an
  offline reload still works.

---

## Part B — Compressed share links (raise the cap ~5x)

### Context

The Share tool (`docs/openpad-feature-02-plan.md` Part B) builds a
stateless link by base64url-encoding the document's UTF-8 bytes into the
URL hash — no compression. The cap on document size was
`MAX_SHARE_CHARS = 20_000` characters of source text (enforced by
`isOverShareLimit`, defensively re-checked on decode by truncating
instead of rejecting). No compression library was installed.

Per user decision: raise the cap to **100,000 characters**, implemented
with the browser-native `CompressionStream`/`DecompressionStream` gzip
API (no new dependency, consistent with `CLAUDE.md`'s minimal-dependency
convention; supported in all current Chrome/Firefox/Safari — Safari since
16.4).

**Key design constraint — backward compatibility.** Links already shared
under the old plain-base64 format keep working. The old alphabet is
exactly `[A-Za-z0-9\-_]`, so a `.` character can never appear in an
old-format payload — that makes `.` a safe, unambiguous marker delimiter
for the new format without touching the old one:

- New encoded output is `z.<base64url of gzip bytes>` when compression
  helps, or `u.<base64url of raw bytes>` when it doesn't (gzip has ~18-20
  bytes of fixed header/trailer overhead, so very short documents end up
  smaller uncompressed; encode picks whichever output is shorter).
- Decode dispatches on the marker: `z.` → decompress, `u.` → decode
  as-is, **no marker prefix at all → the legacy plain-base64url format**,
  decoded exactly as before. Old shared links keep resolving correctly
  forever.
- If `CompressionStream` is unavailable in the sharer's browser, encode
  falls back to the legacy unmarked plain-base64 format directly.
- If `DecompressionStream` is unavailable in a recipient's browser for a
  `z.`-marked link, decode fails closed to `''`, handled by the existing
  "not a valid link" path.

**Key design constraint — async.** The native compression API is
stream-based and asynchronous, so `encodeShareContent`/
`decodeShareContent` (and everything that calls them) became
`Promise`-returning. `buildShareUrl(activeDocument.content)` was
previously computed inline in JSX as a prop, which can't await, so the
async URL generation moved **into `ShareDialog` itself**: its prop
changed from `url: string` to `content: string`, with an internal
`useState`/`useEffect` that calls `buildShareUrl(content)` and shows a
brief "Generating link…" placeholder while pending.

### Steps

1. `src/share/codec.ts` — rewritten with `toBase64Url`/`fromBase64Url`
   helpers, `gzip`/`gunzip` via `CompressionStream`/`DecompressionStream`,
   and async `encodeShareContent`/`decodeShareContent` implementing the
   marker scheme above.
2. `src/share/shareLink.ts` — `MAX_SHARE_CHARS` bumped to `100_000`;
   `buildShareUrl` is now `async`.
3. `src/share/importSharedLink.ts` — `consumeSharedLink` is now `async`.
4. `src/App.tsx` — awaits `consumeSharedLink()`; passes
   `content={activeDocument.content}` to `ShareDialog` instead of a
   pre-built URL.
5. `src/components/MenuBar/ShareDialog.tsx` — `content` prop, internal
   async URL generation with a pending state.
6. `src/components/MenuBar/ToolsMenu.tsx` — unchanged logic, picks up
   the new `MAX_SHARE_CHARS` value in its tooltip text.
7. Updated tests: `codec.test.ts`, `shareLink.test.ts`,
   `importSharedLink.test.ts`, `ShareDialog.test.tsx` — async/await
   throughout, plus new coverage for the compressed/plain/legacy marker
   paths and feature-detection fallbacks.
8. `docs/ARCHITECTURE.md` — "Share links" section updated to describe
   the compressed format, marker scheme, backward-compat guarantee, and
   the new 100,000-character cap.
9. `PROGRESS.md` — decision-log entry.

### Non-goals

- No new npm dependency.
- No change to the truncate-not-reject / disabled-not-warned UX.
- No Playwright e2e coverage added for the share flow (matches the
  existing gap noted for M12).

### Verification

- `npm run typecheck`, `npm run lint`, `npm run format:check`.
- `npm test` / `npm run test:coverage`.
- Manual check in a real browser: share a large (~80-90K char) document,
  confirm the URL is meaningfully shorter than the uncompressed
  equivalent, open it in a new tab, confirm the content loads correctly
  and un-truncated. Confirm an old-style plain-base64 hash (no marker)
  still decodes correctly.

---

## Part C — Bug fix: mouse-drag selection doesn't highlight its first row

### Context

Root cause (confirmed by reading the live CodeMirror 6 source, not just
app code): the editor enables both `drawSelection()` and
`highlightActiveLine()` in `src/editor/extensions.ts`. `drawSelection()`
paints the selection background as an absolutely-positioned rectangle in
a `.cm-selectionLayer` sibling with a **negative z-index** relative to
`.cm-scroller`'s stacking context. `highlightActiveLine()` instead adds
`cm-activeLine` directly onto the normal in-flow `.cm-line` element that
contains the selection's **head** (the end of the range where the mouse
was released) — and per standard CSS paint order, that in-flow line's
opaque background paints *on top of* the negative-z-index selection
rectangle underneath it, hiding the selection highlight completely for
that one line. `--active-line` was opaque and nearly the same tone as
`--editor-bg`, so the masked line read as "not selected at all" rather
than just a wrong shade.

Ctrl+A never showed this because its selection head always lands at the
very end of the document, never on an earlier row. A mouse drag that
ends with the release point on an earlier line (e.g. dragging upward, or
releasing back on the first row) puts the head there instead. This is a
genuine interaction gap between two independently-added CodeMirror
extensions, not a regression from the earlier `4acdfae` "fix selection
color bug" commit (that one fixed a `!important`-specificity issue with
the selection *color*, on `.cm-selectionBackground` — a different,
unrelated rule).

Chosen fix: make `--active-line` **translucent** instead of an opaque
flat color, so it tints on top of whatever's beneath it (including the
selection layer) rather than fully masking it. This is a token-only
change — `.cm-activeLine`/`.cm-activeLineGutter` in `src/editor/theme.ts`
already read `var(--active-line)`, so no theme.ts or extension changes
were needed.

### Steps

1. `src/index.css` — all four `--active-line` definitions changed from a
   hardcoded opaque hex to a `color-mix()` expression tying the tint to
   the current accent color:
   - Light blocks: `color-mix(in srgb, var(--accent) 6%, transparent)`
   - Dark blocks: `color-mix(in srgb, var(--accent) 10%, transparent)`
   Deriving from `var(--accent)` means the tint automatically stays
   correct under the M11 theme picker's presets and custom colors too.

### Non-goals

- Not touching `drawSelection()`/`highlightActiveLine()` config, or
  building a custom conditional active-line extension.
- Not auditing other `.cm-*` layering for similar issues beyond this
  specific, confirmed bug.

### Verification

- Reproduced the bug pattern in a real browser (drag-select ending with
  mouse release on the first row) both before and after the fix —
  confirmed the row now shows the selection highlight, in both light and
  dark mode.
- Confirmed Ctrl+A selection still looks correct (no regression).
- Confirmed the plain active-line indicator (cursor, no selection) still
  reads as a subtle, visible tint, distinct from `--accent-soft`.
