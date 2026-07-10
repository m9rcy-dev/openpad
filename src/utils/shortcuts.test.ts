import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatShortcut, redoShortcut } from './shortcuts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatShortcut', () => {
  it('renders symbols on macOS', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    expect(formatShortcut('Mod-Shift-f')).toBe('⌘⇧F')
  })

  it('renders Ctrl+ names on non-Mac platforms', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64')
    expect(formatShortcut('Mod-Shift-f')).toBe('Ctrl+Shift+F')
  })

  it('handles a shortcut with no modifiers', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64')
    expect(formatShortcut('f')).toBe('F')
  })
})

describe('redoShortcut', () => {
  it('uses Cmd+Shift+Z on macOS', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    expect(redoShortcut()).toBe('Mod-Shift-z')
    expect(formatShortcut(redoShortcut())).toBe('⌘⇧Z')
  })

  it('uses Ctrl+Y on non-Mac platforms', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64')
    expect(redoShortcut()).toBe('Mod-y')
    expect(formatShortcut(redoShortcut())).toBe('Ctrl+Y')
  })
})
