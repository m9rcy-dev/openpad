import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UpdatePrompt } from './UpdatePrompt'

// virtual:pwa-register/react only exists at build time via vite-plugin-pwa;
// tests mock it and drive its state through this same object the hook
// returns, mirroring how the real hook's setters work.
const setOfflineReady = vi.fn()
const setNeedRefresh = vi.fn()
const updateServiceWorker = vi.fn()
let offlineReady = false
let needRefresh = false

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  }),
}))

describe('UpdatePrompt', () => {
  it('renders nothing when neither offline-ready nor an update is pending', () => {
    offlineReady = false
    needRefresh = false
    const { container } = render(<UpdatePrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the offline-ready message with no Reload button', () => {
    offlineReady = true
    needRefresh = false
    render(<UpdatePrompt />)
    expect(screen.getByRole('status')).toHaveTextContent('ready to work offline')
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument()
  })

  it('shows the update message with a Reload button that triggers the update', async () => {
    offlineReady = false
    needRefresh = true
    render(<UpdatePrompt />)
    expect(screen.getByRole('status')).toHaveTextContent('new version')

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('dismissing clears both flags', async () => {
    offlineReady = true
    needRefresh = false
    render(<UpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(setOfflineReady).toHaveBeenCalledWith(false)
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
  })
})
