/**
 * Accent color selection: which preset (or custom hex) is active, and
 * applying it to the live document.
 *
 * Unlike light/dark (`useTheme.ts`, which redefines tokens through CSS
 * `[data-theme]` blocks), the accent tokens are set as **inline styles**
 * on `document.documentElement` — they have to be computed in JS either
 * way (a custom hex has no precomputed CSS class to switch to), so
 * presets and custom colors share one application path instead of two.
 * Inline style deliberately outranks the light/dark blocks in
 * `index.css`, which just supply the chameleon-green default for the
 * instant before this hook's first effect runs.
 */
import { useEffect, useState } from 'react'
import { ACCENT_PRESETS, findAccentPreset, type AccentPresetId } from './accentPresets'
import { deriveAccentPalette, type AccentPalette } from './deriveAccentPalette'

export type AccentChoice =
  | { type: 'preset'; id: AccentPresetId }
  | { type: 'custom'; hex: string }

const STORAGE_KEY = 'openpad:accent'
const DEFAULT_CHOICE: AccentChoice = { type: 'preset', id: 'green' }
const PRESET_IDS = new Set(ACCENT_PRESETS.map((preset) => preset.id))
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

function isValidChoice(value: unknown): value is AccentChoice {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  if (candidate.type === 'preset') {
    return typeof candidate.id === 'string' && PRESET_IDS.has(candidate.id as AccentPresetId)
  }
  if (candidate.type === 'custom') {
    return typeof candidate.hex === 'string' && HEX_PATTERN.test(candidate.hex)
  }
  return false
}

/** Reads the persisted choice, tolerating missing or corrupted values. */
function loadChoice(): AccentChoice {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === null) {
    return DEFAULT_CHOICE
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    return isValidChoice(parsed) ? parsed : DEFAULT_CHOICE
  } catch {
    return DEFAULT_CHOICE
  }
}

/** Resolves a choice + light/dark mode into the four concrete token values. */
function resolvePalette(choice: AccentChoice, mode: 'light' | 'dark'): AccentPalette {
  if (choice.type === 'preset') {
    return findAccentPreset(choice.id)[mode]
  }
  return deriveAccentPalette(choice.hex, mode)
}

export interface UseAccentThemeResult {
  choice: AccentChoice
  /** Switches to one of the curated presets. */
  setPreset: (id: AccentPresetId) => void
  /** Switches to a custom color, re-derived for whichever mode is active. */
  setCustom: (hex: string) => void
}

/**
 * @param mode - The app's current effective light/dark theme (from
 *   `useTheme()`). A custom accent is re-derived for the new mode when
 *   this changes, rather than reverting to the default.
 */
export function useAccentTheme(mode: 'light' | 'dark'): UseAccentThemeResult {
  const [choice, setChoice] = useState<AccentChoice>(loadChoice)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
  }, [choice])

  useEffect(() => {
    const palette = resolvePalette(choice, mode)
    const root = document.documentElement
    root.style.setProperty('--accent', palette.accent)
    root.style.setProperty('--accent-ink', palette.accentInk)
    root.style.setProperty('--accent-soft', palette.accentSoft)
    root.style.setProperty('--accent-on', palette.accentOn)
  }, [choice, mode])

  return {
    choice,
    setPreset: (id) => setChoice({ type: 'preset', id }),
    setCustom: (hex) => setChoice({ type: 'custom', hex }),
  }
}
