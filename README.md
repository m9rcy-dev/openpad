# OpenPad — online notepad

A Notepad++-inspired notepad that runs entirely in your browser. Multi-tab
editing, text transform tools (Base64, URL, HTML entities, JSON/XML
format · minify · validate, text utilities), live Markdown / Mermaid /
PlantUML preview, file compare, offline support — deployable for free
on GitHub Pages, live at [openpad.m9rcy.dev](https://openpad.m9rcy.dev).
No server, no account, no data leaves your machine (PlantUML rendering
excepted; see below).

> See [PROGRESS.md](PROGRESS.md) for build status and
> [docs/ui-mockup.html](docs/ui-mockup.html) for the design target.

## Quick start

```bash
npm install
npm run dev        # local development at http://localhost:5173
```

## All commands

| Command                 | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Dev server with hot reload                                        |
| `npm run build`         | Type-check + production build to `dist/`                          |
| `npm run preview`       | Serve the production build locally                                |
| `npm test`              | Run unit/component tests once                                     |
| `npm run test:watch`    | Tests in watch mode                                               |
| `npm run test:coverage` | Tests with coverage report (see thresholds in `vite.config.ts`)   |
| `npm run e2e`           | Playwright end-to-end smoke tests (builds + serves automatically) |
| `npm run lint`          | ESLint (type-aware)                                               |
| `npm run typecheck`     | TypeScript project check                                          |
| `npm run format`        | Prettier write / `format:check` verify                            |

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. Repository **Settings → Pages → Source → "GitHub Actions"**.
3. Push to `main` — `.github/workflows/deploy.yml` builds and publishes
   automatically.

### Custom domain

The deployed site is served from `openpad.m9rcy.dev` instead of the
default `<user>.github.io/openpad/` URL:

1. `public/CNAME` (committed to this repo) contains `openpad.m9rcy.dev` —
   Vite copies it to `dist/CNAME` on every build, which is what GitHub
   Pages reads to serve the custom domain.
2. At the `m9rcy.dev` DNS provider, add a `CNAME` record: `openpad` →
   `<user>.github.io`.
3. Repository **Settings → Pages → Custom domain** → enter
   `openpad.m9rcy.dev` → enable **Enforce HTTPS** once the certificate
   provisions (GitHub Pages auto-provisions it via Let's Encrypt).

Because the domain serves from the root rather than a `/openpad/`
subpath, the deploy workflow no longer sets `VITE_BASE` — the build
defaults to `base: '/'` (see `vite.config.ts`).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the app fits
  together: the tool registry pattern, editor/preview pipelines,
  persistence, offline support, and the testing strategy.
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — conventions and the
  checks to run before committing.
- [`PROGRESS.md`](PROGRESS.md) — milestone-by-milestone build log,
  including real bugs found along the way and how they were fixed.

## Tech & principles

React 19 · TypeScript (strict) · Vite · CodeMirror 6 (+ `@codemirror/merge`
for Compare) · Zustand · idb-keyval · markdown-it + DOMPurify · Mermaid ·
vite-plugin-pwa · Vitest + Testing Library · Playwright.

- **Offline-first**: a service worker precaches the entire app, including
  every lazy-loaded Mermaid diagram-type chunk, so diagrams still render
  with no network. The only network-dependent feature is PlantUML
  diagrams (it needs Java, so rendering goes through a configurable
  PlantUML server); offline, the source is shown with a notice instead.
- **Minimal dependencies**, audited in CI (`npm audit --audit-level=high`)
  and kept current via Dependabot.
- **Human-maintainable**: TSDoc everywhere, `src/tools/**` held to 100%
  test coverage, architecture and contribution docs in `docs/`,
  conventions in `CLAUDE.md`.
