import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NotepadDocument } from '../../types/document'
import { TabBar } from './TabBar'

function doc(overrides: Partial<NotepadDocument>): NotepadDocument {
  return {
    id: 'id-1',
    name: 'untitled-1',
    content: '',
    language: 'plain',
    dirty: false,
    updatedAt: 0,
    ...overrides,
  }
}

const noHandlers = {
  onActivate: vi.fn(),
  onCreate: vi.fn(),
  onClose: vi.fn(),
  onRename: vi.fn(),
}

describe('TabBar', () => {
  it('renders a tab per document and marks the active one', () => {
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' }), doc({ id: 'b', name: 'b.json' })]}
        activeId="b"
        {...noHandlers}
      />,
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('shows a dirty indicator for modified documents', () => {
    render(<TabBar documents={[doc({ dirty: true })]} activeId="id-1" {...noHandlers} />)
    expect(screen.getByLabelText('Unsaved changes')).toBeInTheDocument()
  })

  it('activates a tab on click', async () => {
    const onActivate = vi.fn()
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' })]}
        activeId={null}
        {...noHandlers}
        onActivate={onActivate}
      />,
    )
    await userEvent.click(screen.getByRole('tab'))
    expect(onActivate).toHaveBeenCalledWith('a')
  })

  it('requests close from the ✕ control without activating the tab', async () => {
    const onClose = vi.fn()
    const onActivate = vi.fn()
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' })]}
        activeId="a"
        {...noHandlers}
        onClose={onClose}
        onActivate={onActivate}
      />,
    )
    await userEvent.click(screen.getByLabelText('Close a.md'))
    expect(onClose).toHaveBeenCalledWith('a')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('creates a document from the + button', async () => {
    const onCreate = vi.fn()
    render(<TabBar documents={[doc({})]} activeId="id-1" {...noHandlers} onCreate={onCreate} />)
    await userEvent.click(screen.getByLabelText('New document'))
    expect(onCreate).toHaveBeenCalled()
  })

  it('renames via double-click, typing, and Enter', async () => {
    const onRename = vi.fn()
    render(<TabBar documents={[doc({})]} activeId="id-1" {...noHandlers} onRename={onRename} />)

    await userEvent.dblClick(screen.getByRole('tab'))
    const input = screen.getByLabelText('Rename document')
    await userEvent.clear(input)
    await userEvent.type(input, 'notes.md{Enter}')
    expect(onRename).toHaveBeenCalledWith('id-1', 'notes.md')
  })

  it('cancels a rename with Escape', async () => {
    const onRename = vi.fn()
    render(<TabBar documents={[doc({})]} activeId="id-1" {...noHandlers} onRename={onRename} />)

    await userEvent.dblClick(screen.getByRole('tab'))
    await userEvent.keyboard('{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('tab')).toBeInTheDocument()
  })

  it('commits a rename on blur', async () => {
    const onRename = vi.fn()
    render(<TabBar documents={[doc({})]} activeId="id-1" {...noHandlers} onRename={onRename} />)

    await userEvent.dblClick(screen.getByRole('tab'))
    const input = screen.getByLabelText('Rename document')
    await userEvent.clear(input)
    await userEvent.type(input, 'blurred.md')
    await userEvent.click(document.body)

    expect(onRename).toHaveBeenCalledWith('id-1', 'blurred.md')
  })

  it('closes on a middle-click (auxclick)', () => {
    const onClose = vi.fn()
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' })]}
        activeId="a"
        {...noHandlers}
        onClose={onClose}
      />,
    )

    fireEvent(screen.getByRole('tab'), new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    expect(onClose).toHaveBeenCalledWith('a')
  })

  it('ignores non-middle auxclicks', () => {
    const onClose = vi.fn()
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' })]}
        activeId="a"
        {...noHandlers}
        onClose={onClose}
      />,
    )

    fireEvent(screen.getByRole('tab'), new MouseEvent('auxclick', { bubbles: true, button: 2 }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes via Enter/Space on the close control (keyboard access)', async () => {
    const onClose = vi.fn()
    render(
      <TabBar
        documents={[doc({ id: 'a', name: 'a.md' })]}
        activeId="a"
        {...noHandlers}
        onClose={onClose}
      />,
    )

    screen.getByLabelText('Close a.md').focus()
    await userEvent.keyboard(' ')
    expect(onClose).toHaveBeenCalledWith('a')
  })
})
