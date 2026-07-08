import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useDocumentsStore } from './store/documentsStore'

// App hydrates from IndexedDB on mount. jsdom has no IndexedDB, so
// persistence falls back to an empty workspace — which is exactly the
// first-visit experience these tests assert on.

beforeEach(() => {
  useDocumentsStore.setState({
    documents: [],
    activeId: null,
    hydrated: false,
    saveState: 'idle',
  })
})

describe('App', () => {
  it('renders menu bar, tab strip, editor, and status bar after hydration', async () => {
    render(<App />)
    expect(await screen.findByTestId('editor-pane')).toBeInTheDocument()
    expect(screen.getByText('OpenPad')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /untitled-1/ })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ln 1, Col 1')
  })
})
