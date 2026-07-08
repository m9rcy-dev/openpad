/**
 * Mermaid diagram rendering, lazy-loaded.
 *
 * The mermaid library is ~1MB minified, so it is imported dynamically:
 * plain note-taking never pays its cost, and Vite splits it into its own
 * precacheable chunk (which is how it still works offline). The module
 * is loaded at most once per session.
 */

type MermaidModule = typeof import('mermaid').default

let loader: Promise<MermaidModule> | undefined
let initializedTheme: string | undefined

async function loadMermaid(theme: 'light' | 'dark'): Promise<MermaidModule> {
  loader ??= import('mermaid').then((module) => module.default)
  const mermaid = await loader
  // Theme changes require re-initialization; do it only when it changed.
  const mermaidTheme = theme === 'dark' ? 'dark' : 'default'
  if (initializedTheme !== mermaidTheme) {
    mermaid.initialize({
      startOnLoad: false,
      // 'strict' escapes/blocks script content inside diagram labels.
      securityLevel: 'strict',
      theme: mermaidTheme,
    })
    initializedTheme = mermaidTheme
  }
  return mermaid
}

export interface MermaidRenderResult {
  ok: boolean
  svg?: string
  error?: string
}

/** Serial for unique render ids; mermaid requires one per render call. */
let renderSerial = 0

/**
 * Mermaid's `render()` is not safe to call concurrently — it manipulates
 * shared internal/DOM state, and a second call started before the first
 * resolves can hang forever rather than error. A page with more than one
 * diagram (the `for` loop in PreviewPane) or React StrictMode's double
 * effect invocation both produce concurrent calls, so every call is
 * chained onto this promise to force one-at-a-time execution.
 */
let renderQueue: Promise<unknown> = Promise.resolve()

/**
 * Renders mermaid source to SVG markup. Never throws: syntax errors in
 * the diagram come back as `{ ok: false, error }` for an inline notice.
 * Concurrent calls are queued and run one at a time (see {@link renderQueue}).
 */
export function renderMermaid(
  source: string,
  theme: 'light' | 'dark',
): Promise<MermaidRenderResult> {
  const run = renderQueue.then(async (): Promise<MermaidRenderResult> => {
    try {
      const mermaid = await loadMermaid(theme)
      renderSerial += 1
      const { svg } = await mermaid.render(`openpad-mermaid-${renderSerial}`, source)
      return { ok: true, svg }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught)
      return { ok: false, error: `Mermaid: ${message}` }
    }
  })
  // Swallow rejections in the queue chain itself so one failure doesn't
  // permanently jam later renders; `run`'s own caller still gets the result.
  renderQueue = run.catch(() => undefined)
  return run
}
