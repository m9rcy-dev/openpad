/**
 * The three curated accent presets. Hand-tuned, not derived —
 * `deriveAccentPalette.ts` exists for the free-form custom color picker,
 * where hand-curation isn't possible, but a generic formula couldn't
 * reproduce these: the Digital Violet soft tint is deliberately the
 * exact iconic Olivia Rodrigo SOUR-era pastel lilac, not a mechanically
 * desaturated version of the deep solid-button violet, and every value
 * here was visually validated against the app's real chrome before
 * being locked in.
 */
import type { AccentPalette } from './deriveAccentPalette'

export type AccentPresetId = 'green' | 'cobalt' | 'violet'

export interface AccentPreset {
  id: AccentPresetId
  label: string
  /** Swatch color shown in the picker UI (the light-mode accent). */
  swatch: string
  light: AccentPalette
  dark: AccentPalette
}

/**
 * Mirrors the tokens already shipped in `src/index.css` exactly, so
 * selecting this preset after a custom pick looks identical to the
 * app's un-themed default — no `--accent-on` change either, since white
 * text on both the light and dark green already ships today.
 */
const GREEN: AccentPreset = {
  id: 'green',
  label: 'Chameleon Green',
  swatch: '#2e8b46',
  light: {
    accent: '#2e8b46',
    accentInk: '#1d6b33',
    accentSoft: '#e3f2e7',
    accentOn: '#ffffff',
  },
  dark: {
    accent: '#4fbf68',
    accentInk: '#6fd486',
    accentSoft: '#1e3325',
    accentOn: '#ffffff',
  },
}

/** A refreshed classic tech blue — the safe, highly legible option. */
const COBALT: AccentPreset = {
  id: 'cobalt',
  label: 'Cobalt Blue',
  swatch: '#2f6fed',
  light: {
    accent: '#2f6fed',
    accentInk: '#1f52b8',
    accentSoft: '#e3ecfd',
    accentOn: '#ffffff',
  },
  dark: {
    accent: '#5b8ff5',
    accentInk: '#85acf8',
    accentSoft: '#1c2a44',
    accentOn: '#0d1626',
  },
}

/**
 * Deepened from Olivia Rodrigo's SOUR-era palette (cover-art tones
 * `#6871A6`/`#948CCC` plus the brand lilac `#D3BEE8`, which shows up
 * unmodified as the soft tint below).
 */
const VIOLET: AccentPreset = {
  id: 'violet',
  label: 'Digital Violet',
  swatch: '#8f6fc9',
  light: {
    accent: '#8f6fc9',
    accentInk: '#6b4fa0',
    accentSoft: '#e8dcf7',
    accentOn: '#ffffff',
  },
  dark: {
    accent: '#b49ae8',
    accentInk: '#cdbaf2',
    accentSoft: '#2e2347',
    accentOn: '#1e1730',
  },
}

/** All presets, in the order they're offered in `ThemeDialog`. */
export const ACCENT_PRESETS: AccentPreset[] = [GREEN, COBALT, VIOLET]

/** Looks up a preset by id; falls back to green for an unrecognized id. */
export function findAccentPreset(id: AccentPresetId): AccentPreset {
  return ACCENT_PRESETS.find((preset) => preset.id === id) ?? GREEN
}
