import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { formatShortcut } from '../../utils/shortcuts'
import { ToolsMenu } from './ToolsMenu'

describe('ToolsMenu', () => {
  it('opens on click and shows every category', async () => {
    render(<ToolsMenu onRunTool={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tools' }))
    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Encoding')
    expect(menu).toHaveTextContent('JSON')
    expect(menu).toHaveTextContent('XML')
    expect(menu).toHaveTextContent('Text')
  })

  it('runs the clicked tool and closes', async () => {
    const onRunTool = vi.fn()
    render(<ToolsMenu onRunTool={onRunTool} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tools' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Base64 encode/ }))

    expect(onRunTool).toHaveBeenCalledTimes(1)
    expect(onRunTool.mock.calls[0]?.[0]).toMatchObject({ id: 'base64-encode' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape without running anything', async () => {
    const onRunTool = vi.fn()
    render(<ToolsMenu onRunTool={onRunTool} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tools' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onRunTool).not.toHaveBeenCalled()
  })
})

describe('formatShortcut', () => {
  it('renders a platform-appropriate shortcut string', () => {
    // jsdom reports a non-Mac platform by default → Ctrl+Shift+F.
    expect(formatShortcut('Mod-Shift-f')).toBe('Ctrl+Shift+F')
  })
})
