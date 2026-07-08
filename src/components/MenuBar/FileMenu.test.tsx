import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileMenu } from './FileMenu'

describe('FileMenu', () => {
  it('opens on click and lists Open, Save, Save As', async () => {
    render(<FileMenu dirty={true} onOpen={vi.fn()} onSave={vi.fn()} onSaveAs={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'File' }))
    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Open…')
    expect(menu).toHaveTextContent('Save')
    expect(menu).toHaveTextContent('Save As…')
  })

  it('calls onOpen and closes the menu', async () => {
    const onOpen = vi.fn()
    render(<FileMenu dirty={true} onOpen={onOpen} onSave={vi.fn()} onSaveAs={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'File' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Open/ }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls onSave when the document is dirty', async () => {
    const onSave = vi.fn()
    render(<FileMenu dirty={true} onOpen={vi.fn()} onSave={onSave} onSaveAs={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'File' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Save$/ }))

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables Save when the document has no unsaved changes', async () => {
    render(<FileMenu dirty={false} onOpen={vi.fn()} onSave={vi.fn()} onSaveAs={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'File' }))
    expect(screen.getByRole('menuitem', { name: /^Save$/ })).toBeDisabled()
  })

  it('keeps Save As enabled even when the document is clean', async () => {
    const onSaveAs = vi.fn()
    render(<FileMenu dirty={false} onOpen={vi.fn()} onSave={vi.fn()} onSaveAs={onSaveAs} />)
    await userEvent.click(screen.getByRole('button', { name: 'File' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Save As/ }))

    expect(onSaveAs).toHaveBeenCalledTimes(1)
  })
})
