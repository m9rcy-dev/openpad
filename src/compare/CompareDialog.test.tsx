import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NotepadDocument } from '../types/document'
import { CompareDialog } from './CompareDialog'

vi.mock('../files/fileOperations', () => ({
  pickAndReadFile: vi.fn(),
}))

function doc(overrides: Partial<NotepadDocument>): NotepadDocument {
  return {
    id: 'id',
    name: 'doc.txt',
    content: '',
    language: 'plain',
    dirty: false,
    updatedAt: 0,
    ...overrides,
  }
}

describe('CompareDialog', () => {
  it('lists the other open documents', () => {
    render(
      <CompareDialog
        otherDocuments={[doc({ id: 'a', name: 'a.md' }), doc({ id: 'b', name: 'b.json' })]}
        onPick={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'a.md' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'b.json' })).toBeInTheDocument()
  })

  it('picks a tab and reports its content, name, and language', async () => {
    const onPick = vi.fn()
    render(
      <CompareDialog
        otherDocuments={[doc({ name: 'notes.md', content: 'hi', language: 'markdown' })]}
        onPick={onPick}
        onCancel={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'notes.md' }))
    expect(onPick).toHaveBeenCalledWith({ name: 'notes.md', content: 'hi', language: 'markdown' })
  })

  it('omits the tab list entirely when there are no other documents', () => {
    render(<CompareDialog otherDocuments={[]} onPick={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('Open a file to compare…')).toBeInTheDocument()
  })

  it('calls onCancel on backdrop click and on the Cancel button', async () => {
    const onCancel = vi.fn()
    render(<CompareDialog otherDocuments={[]} onPick={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel on Escape', async () => {
    const onCancel = vi.fn()
    render(<CompareDialog otherDocuments={[]} onPick={vi.fn()} onCancel={onCancel} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('picks a file from disk via the file picker', async () => {
    const { pickAndReadFile } = await import('../files/fileOperations')
    vi.mocked(pickAndReadFile).mockResolvedValue({
      name: 'external.xml',
      content: '<a/>',
      handle: null,
    })
    const onPick = vi.fn()
    render(<CompareDialog otherDocuments={[]} onPick={onPick} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByText('Open a file to compare…'))

    expect(onPick).toHaveBeenCalledWith({ name: 'external.xml', content: '<a/>', language: 'xml' })
  })

  it('does nothing when the file picker is cancelled', async () => {
    const { pickAndReadFile } = await import('../files/fileOperations')
    vi.mocked(pickAndReadFile).mockResolvedValue(null)
    const onPick = vi.fn()
    render(<CompareDialog otherDocuments={[]} onPick={onPick} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByText('Open a file to compare…'))

    expect(onPick).not.toHaveBeenCalled()
  })
})
