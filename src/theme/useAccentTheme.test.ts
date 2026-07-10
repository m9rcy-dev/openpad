import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { findAccentPreset } from './accentPresets'
import { useAccentTheme } from './useAccentTheme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.style.removeProperty('--accent')
  document.documentElement.style.removeProperty('--accent-ink')
  document.documentElement.style.removeProperty('--accent-soft')
  document.documentElement.style.removeProperty('--accent-on')
})

describe('useAccentTheme', () => {
  it('defaults to the green preset and applies it', () => {
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'green' })
    const green = findAccentPreset('green').light
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(green.accent)
    expect(document.documentElement.style.getPropertyValue('--accent-on')).toBe(green.accentOn)
  })

  it('setPreset switches to and applies a different preset', () => {
    const { result } = renderHook(() => useAccentTheme('light'))
    act(() => result.current.setPreset('cobalt'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'cobalt' })
    const cobalt = findAccentPreset('cobalt').light
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(cobalt.accent)
  })

  it('setCustom switches to and applies a derived custom color', () => {
    const { result } = renderHook(() => useAccentTheme('light'))
    act(() => result.current.setCustom('#ff8800'))
    expect(result.current.choice).toEqual({ type: 'custom', hex: '#ff8800' })
    // Derived, not a preset value — just confirm something was set and it's a valid hex.
    expect(document.documentElement.style.getPropertyValue('--accent')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('persists the choice to localStorage', () => {
    const { result } = renderHook(() => useAccentTheme('light'))
    act(() => result.current.setPreset('violet'))
    expect(localStorage.getItem('openpad:accent')).toBe(
      JSON.stringify({ type: 'preset', id: 'violet' }),
    )
  })

  it('restores a persisted preset choice on mount', () => {
    localStorage.setItem('openpad:accent', JSON.stringify({ type: 'preset', id: 'cobalt' }))
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'cobalt' })
  })

  it('restores a persisted custom choice on mount', () => {
    localStorage.setItem('openpad:accent', JSON.stringify({ type: 'custom', hex: '#123abc' }))
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'custom', hex: '#123abc' })
  })

  it('ignores a corrupted stored value', () => {
    localStorage.setItem('openpad:accent', 'not json')
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'green' })
  })

  it('ignores a stored value with an unknown preset id', () => {
    localStorage.setItem('openpad:accent', JSON.stringify({ type: 'preset', id: 'nope' }))
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'green' })
  })

  it('ignores a stored custom value with an invalid hex', () => {
    localStorage.setItem('openpad:accent', JSON.stringify({ type: 'custom', hex: 'not-a-hex' }))
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'green' })
  })

  it('ignores a stored value that is valid JSON but not an object', () => {
    localStorage.setItem('openpad:accent', JSON.stringify('green'))
    const { result } = renderHook(() => useAccentTheme('light'))
    expect(result.current.choice).toEqual({ type: 'preset', id: 'green' })
  })

  it('re-applies a custom color when the mode changes', () => {
    const { result, rerender } = renderHook(({ mode }) => useAccentTheme(mode), {
      initialProps: { mode: 'light' as 'light' | 'dark' },
    })
    act(() => result.current.setCustom('#2f6fed'))
    const lightAccent = document.documentElement.style.getPropertyValue('--accent')

    rerender({ mode: 'dark' })
    const darkAccent = document.documentElement.style.getPropertyValue('--accent')

    expect(result.current.choice).toEqual({ type: 'custom', hex: '#2f6fed' })
    expect(darkAccent).not.toBe(lightAccent)
  })
})
