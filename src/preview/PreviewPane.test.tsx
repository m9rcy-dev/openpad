import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreviewPane } from './PreviewPane'

// Mermaid is ~1MB and needs a real layout engine; the pane's contract is
// "call mermaid.render and inject the SVG", which a mock verifies fine.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn((_id: string, source: string) =>
      source.includes('bad')
        ? Promise.reject(new Error('syntax error'))
        : Promise.resolve({ svg: `<svg data-testid="mermaid-svg"><title>ok</title></svg>` }),
    ),
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
})

/** Renders the pane and flushes the 250ms debounce + microtasks. */
async function renderPane(text: string) {
  const utils = render(<PreviewPane text={text} theme="light" />)
  await vi.advanceTimersByTimeAsync(300)
  vi.useRealTimers()
  return utils
}

describe('PreviewPane', () => {
  it('renders sanitized markdown content', async () => {
    await renderPane('# Hello\n\n<script>alert(1)</script>\n\n**bold**')
    const pane = screen.getByTestId('preview-pane')
    expect(pane.querySelector('h1')).toHaveTextContent('Hello')
    expect(pane.querySelector('script')).toBeNull()
    expect(pane.querySelector('strong')).toHaveTextContent('bold')
  })

  it('renders mermaid fences as SVG diagrams', async () => {
    await renderPane('```mermaid\nflowchart LR\n  A --> B\n```')
    await waitFor(() => {
      expect(screen.getByTestId('preview-pane').querySelector('svg')).not.toBeNull()
    })
  })

  it('shows an inline notice for invalid mermaid', async () => {
    await renderPane('```mermaid\nbad diagram\n```')
    await waitFor(() => {
      expect(screen.getByTestId('preview-pane')).toHaveTextContent(/Mermaid: syntax error/)
    })
  })

  it('renders plantuml fences as server images when online', async () => {
    await renderPane('```plantuml\nA -> B\n```')
    await waitFor(() => {
      const img = screen.getByTestId('preview-pane').querySelector('img.diagram-plantuml-image')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toMatch(/^https:\/\/www\.plantuml\.com\/plantuml\/svg\//)
    })
  })

  it('shows the offline notice for plantuml when there is no network', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    try {
      await renderPane('```plantuml\nA -> B\n```')
      await waitFor(() => {
        expect(screen.getByTestId('preview-pane')).toHaveTextContent(/needs a network connection/)
      })
      expect(screen.getByTestId('preview-pane').querySelector('img')).toBeNull()
    } finally {
      onLine.mockRestore()
    }
  })
})
