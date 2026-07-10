import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ShortcutsDialog } from './ShortcutsDialog'

describe('ShortcutsDialog', () => {
  it('lists File, Edit, Tools, and View shortcut groups', () => {
    render(<ShortcutsDialog onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(dialog).toHaveTextContent('File')
    expect(dialog).toHaveTextContent('Open…')
    expect(dialog).toHaveTextContent('Edit')
    expect(dialog).toHaveTextContent('Undo')
    expect(dialog).toHaveTextContent('Redo')
    expect(dialog).toHaveTextContent('Find…')
    expect(dialog).toHaveTextContent('Replace…')
    expect(dialog).toHaveTextContent('Tools')
    expect(dialog).toHaveTextContent('JSON · Format')
    expect(dialog).toHaveTextContent('View')
    expect(dialog).toHaveTextContent('Compare with…')
  })

  it("shows Redo's platform-correct binding", () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64')
    render(<ShortcutsDialog onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(dialog).toHaveTextContent('Ctrl+Y')
    vi.restoreAllMocks()
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via backdrop click but not via a click inside the dialog', async () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog onClose={onClose} />)
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    // The backdrop is the dialog's parent; click it directly.
    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop === null) throw new Error('expected a backdrop element')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
