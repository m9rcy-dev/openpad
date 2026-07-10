import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareDialog } from './ShareDialog'

const URL = 'https://example.com/openpad/#aGVsbG8'

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
}

afterEach(() => {
  // @ts-expect-error -- cleaning up the test-only stub
  delete navigator.clipboard
})

describe('ShareDialog', () => {
  it('shows the URL in a read-only field', () => {
    render(<ShareDialog url={URL} onClose={vi.fn()} onCopyResult={vi.fn()} />)
    const input = screen.getByLabelText<HTMLInputElement>('Share link')
    expect(input.value).toBe(URL)
    expect(input).toHaveAttribute('readonly')
  })

  it('copies the link and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    const onCopyResult = vi.fn()
    render(<ShareDialog url={URL} onClose={vi.fn()} onCopyResult={onCopyResult} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(writeText).toHaveBeenCalledWith(URL)
    expect(onCopyResult).toHaveBeenCalledWith(true)
  })

  it('reports failure when the clipboard write rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    mockClipboard(writeText)
    const onCopyResult = vi.fn()
    render(<ShareDialog url={URL} onClose={vi.fn()} onCopyResult={onCopyResult} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(onCopyResult).toHaveBeenCalledWith(false)
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(<ShareDialog url={URL} onClose={onClose} onCopyResult={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via backdrop click but not via a click inside the dialog', async () => {
    const onClose = vi.fn()
    render(<ShareDialog url={URL} onClose={onClose} onCopyResult={vi.fn()} />)
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop === null) throw new Error('expected a backdrop element')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<ShareDialog url={URL} onClose={onClose} onCopyResult={vi.fn()} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
