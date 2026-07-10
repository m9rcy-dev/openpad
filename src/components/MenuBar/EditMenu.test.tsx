import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditMenu } from './EditMenu'

const fullState = () => ({ canUndo: true, canRedo: true })
const emptyState = () => ({ canUndo: false, canRedo: false })

function renderMenu(overrides: Partial<Parameters<typeof EditMenu>[0]> = {}) {
  return render(
    <EditMenu
      getEditState={fullState}
      onUndo={vi.fn()}
      onRedo={vi.fn()}
      onFind={vi.fn()}
      onReplace={vi.fn()}
      onOpenTheme={vi.fn()}
      {...overrides}
    />,
  )
}

describe('EditMenu', () => {
  it('opens on click and lists Undo, Redo, Find…, Replace…, Theme…', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Undo')
    expect(menu).toHaveTextContent('Redo')
    expect(menu).toHaveTextContent('Find…')
    expect(menu).toHaveTextContent('Replace…')
    expect(menu).toHaveTextContent('Theme…')
  })

  it('reads edit state from getEditState when the menu opens', async () => {
    const getEditState = vi.fn(fullState)
    renderMenu({ getEditState })
    expect(getEditState).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(getEditState).toHaveBeenCalledTimes(1)
  })

  it('disables Undo and Redo when there is no history', async () => {
    renderMenu({ getEditState: emptyState })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('menuitem', { name: /^Undo/ })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: /^Redo/ })).toBeDisabled()
  })

  it('enables Undo and Redo when history is available', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('menuitem', { name: /^Undo/ })).toBeEnabled()
    expect(screen.getByRole('menuitem', { name: /^Redo/ })).toBeEnabled()
  })

  it('calls onUndo and closes the menu', async () => {
    const onUndo = vi.fn()
    renderMenu({ onUndo })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Undo/ }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls onRedo and closes the menu', async () => {
    const onRedo = vi.fn()
    renderMenu({ onRedo })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Redo/ }))
    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls onFind and closes the menu', async () => {
    const onFind = vi.fn()
    renderMenu({ onFind })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Find/ }))
    expect(onFind).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls onReplace and closes the menu', async () => {
    const onReplace = vi.fn()
    renderMenu({ onReplace })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Replace/ }))
    expect(onReplace).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls onOpenTheme and closes the menu', async () => {
    const onOpenTheme = vi.fn()
    renderMenu({ onOpenTheme })
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^Theme/ }))
    expect(onOpenTheme).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
