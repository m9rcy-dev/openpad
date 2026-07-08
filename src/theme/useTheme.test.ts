import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useTheme } from './useTheme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('useTheme', () => {
  it('defaults to the system theme (light in tests) with no data-theme set', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('toggling applies data-theme and persists the choice', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('openpad:theme')).toBe('dark')
  })

  it('restores a persisted choice on mount', () => {
    localStorage.setItem('openpad:theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('ignores corrupted stored values', () => {
    localStorage.setItem('openpad:theme', 'neon')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })
})
