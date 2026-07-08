import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useMenuClose } from './useMenuClose'

/** Minimal host: a "menu" div and a sibling "outside" button. */
function TestMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuClose(open, rootRef, onClose)
  return (
    <div>
      <div ref={rootRef} data-testid="menu">
        inside
      </div>
      <button type="button">outside</button>
    </div>
  )
}

describe('useMenuClose', () => {
  it('closes on a pointerdown outside the menu root', async () => {
    const onClose = vi.fn()
    render(<TestMenu open={true} onClose={onClose} />)
    await userEvent.click(screen.getByText('outside'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on a pointerdown inside the menu root', async () => {
    const onClose = vi.fn()
    render(<TestMenu open={true} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('menu'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<TestMenu open={true} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does nothing while closed', async () => {
    const onClose = vi.fn()
    render(<TestMenu open={false} onClose={onClose} />)
    await userEvent.click(screen.getByText('outside'))
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })
})
