import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The mock's `render` rejects if it is invoked while a previous call is
 * still in flight — this is what real Mermaid does in practice (shared
 * internal state), and it's what caused the diagram pane to render an
 * empty placeholder forever (a hang, not an error) under React
 * StrictMode's double effect invocation. renderMermaid must serialize
 * calls so this mock never sees two renders overlap.
 */
let busy = false
const initialize = vi.fn()
const render = vi.fn(async (id: string, source: string) => {
  if (busy) {
    throw new Error('concurrent render() call — mermaid is not reentrant')
  }
  busy = true
  await new Promise((resolve) => setTimeout(resolve, 10))
  busy = false
  if (source.includes('bad')) {
    throw new Error('syntax error')
  }
  return { svg: `<svg data-id="${id}"></svg>` }
})

vi.mock('mermaid', () => ({ default: { initialize, render } }))

describe('renderMermaid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    busy = false
  })

  it('renders valid diagram source to SVG', async () => {
    const { renderMermaid } = await import('./mermaid')
    const result = await renderMermaid('flowchart LR\nA-->B', 'light')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.svg).toContain('<svg')
  })

  it('returns an error result for invalid diagram source instead of throwing', async () => {
    const { renderMermaid } = await import('./mermaid')
    const result = await renderMermaid('bad diagram', 'light')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Mermaid: syntax error/)
  })

  it('serializes concurrent calls so mermaid never sees an overlapping render (regression)', async () => {
    const { renderMermaid } = await import('./mermaid')
    const [a, b, c] = await Promise.all([
      renderMermaid('flowchart LR\nA-->B', 'light'),
      renderMermaid('flowchart LR\nC-->D', 'light'),
      renderMermaid('flowchart LR\nE-->F', 'light'),
    ])
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    expect(c.ok).toBe(true)
  })

  it('keeps serializing later calls even after one call fails', async () => {
    const { renderMermaid } = await import('./mermaid')
    const [failed, ok] = await Promise.all([
      renderMermaid('bad', 'light'),
      renderMermaid('flowchart LR\nA-->B', 'light'),
    ])
    expect(failed.ok).toBe(false)
    expect(ok.ok).toBe(true)
  })
})
