/**
 * Light/dark theme management.
 *
 * The design tokens in src/index.css react to two signals:
 *   1. the OS preference (prefers-color-scheme), the default, and
 *   2. an explicit `data-theme="light" | "dark"` on <html>, which wins.
 *
 * This hook owns signal 2: it applies the user's saved choice on startup
 * and persists changes to localStorage.
 */
import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'openpad:theme'

/** Reads the persisted choice, tolerating missing or corrupted values. */
function loadChoice(): ThemeChoice {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

/** The theme the user currently sees, resolving `system` via media query. */
function resolve(choice: ThemeChoice): 'light' | 'dark' {
  if (choice !== 'system') {
    return choice
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface UseThemeResult {
  /** The effective theme currently applied. */
  theme: 'light' | 'dark'
  /** Switches to the opposite of the currently visible theme. */
  toggleTheme: () => void
}

export function useTheme(): UseThemeResult {
  const [choice, setChoice] = useState<ThemeChoice>(loadChoice)

  useEffect(() => {
    const root = document.documentElement
    if (choice === 'system') {
      delete root.dataset.theme
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      root.dataset.theme = choice
      window.localStorage.setItem(STORAGE_KEY, choice)
    }
  }, [choice])

  const toggleTheme = useCallback(() => {
    setChoice((current) => (resolve(current) === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme: resolve(choice), toggleTheme }
}
