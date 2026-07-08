import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CompareView } from './CompareView'

const left = { name: 'a.txt', content: 'line one\nline two\n', language: 'plain' as const }
const right = { name: 'b.txt', content: 'line one\nline TWO\n', language: 'plain' as const }

describe('CompareView', () => {
  it('shows both document names and a read-only badge', () => {
    render(<CompareView left={left} right={right} onClose={vi.fn()} />)
    expect(screen.getByText(/a\.txt/)).toBeInTheDocument()
    expect(screen.getByText(/b\.txt/)).toBeInTheDocument()
    expect(screen.getByText('read-only')).toBeInTheDocument()
  })

  it('mounts a CodeMirror merge view showing both documents', () => {
    render(<CompareView left={left} right={right} onClose={vi.fn()} />)
    const panes = screen.getByTestId('compare-panes')
    expect(panes.querySelectorAll('.cm-editor')).toHaveLength(2)
    expect(panes).toHaveTextContent('line one')
    expect(panes).toHaveTextContent('line TWO')
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<CompareView left={left} right={right} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Close/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
