import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeDialog } from './ThemeDialog'

describe('ThemeDialog', () => {
  it('lists all three presets plus Custom', () => {
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Theme' })
    expect(dialog).toHaveTextContent('Chameleon Green')
    expect(dialog).toHaveTextContent('Cobalt Blue')
    expect(dialog).toHaveTextContent('Digital Violet')
    expect(dialog).toHaveTextContent('Custom…')
  })

  it('marks the active preset as pressed', () => {
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'cobalt' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cobalt Blue' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Chameleon Green' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('marks Custom as pressed when a custom color is active', () => {
    render(
      <ThemeDialog
        choice={{ type: 'custom', hex: '#123456' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Custom…' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onSelectPreset and does not close when a swatch is clicked', async () => {
    const onSelectPreset = vi.fn()
    const onClose = vi.fn()
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={onSelectPreset}
        onSelectCustom={vi.fn()}
        onClose={onClose}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cobalt Blue' }))
    expect(onSelectPreset).toHaveBeenCalledWith('cobalt')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onSelectCustom when the color input changes', () => {
    const onSelectCustom = vi.fn()
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={onSelectCustom}
        onClose={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Custom accent color')
    fireEvent.change(input, { target: { value: '#ff8800' } })
    expect(onSelectCustom).toHaveBeenCalledWith('#ff8800')
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={onClose}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via backdrop click but not via a click inside the dialog', async () => {
    const onClose = vi.fn()
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={onClose}
      />,
    )
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop === null) throw new Error('expected a backdrop element')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <ThemeDialog
        choice={{ type: 'preset', id: 'green' }}
        onSelectPreset={vi.fn()}
        onSelectCustom={vi.fn()}
        onClose={onClose}
      />,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
