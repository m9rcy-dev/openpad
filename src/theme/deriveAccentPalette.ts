/**
 * Derives a full accent palette from a single user-picked hex color
 * (the free-form color picker in `ThemeDialog`). The three curated
 * presets in `accentPresets.ts` are hand-tuned instead — see that
 * file's doc comment for why a generic formula can't replace them.
 *
 * The shape mirrors a preset's per-mode row: `{ accent, accentInk,
 * accentSoft, accentOn }`. `accentOn` is always computed from the
 * *derived* `accent` value's actual contrast, not guessed from the
 * input — that's what makes an arbitrary custom color safe: whatever
 * lightness/saturation clamping below produces, the on-color is picked
 * to be legible against it, not assumed.
 */
import { clamp, contrastRatio, hexToHsl, hslToHex } from './color'

export interface AccentPalette {
  accent: string
  accentInk: string
  accentSoft: string
  accentOn: string
}

const WHITE = '#ffffff'
// The app's light-mode `--ink` value: a proven-good dark neutral for text
// on a light/bright surface. Deliberately *not* the dark-mode `--ink`
// token (which is a light color, for text on a dark background) — a
// bright accent button needs dark text regardless of which app mode
// produced it, the same way the hand-tuned presets use a bespoke dark
// on-color for their dark-mode rows rather than the app's flipped ink.
const DARK_TEXT = '#1d221e'

/** Picks whichever of white or dark text contrasts better against `accent`. */
function pickAccentOn(accent: string): string {
  const whiteContrast = contrastRatio(accent, WHITE)
  const darkContrast = contrastRatio(accent, DARK_TEXT)
  return whiteContrast >= darkContrast ? WHITE : DARK_TEXT
}

/**
 * Derives `{ accent, accentInk, accentSoft, accentOn }` from one hex
 * color for the given light/dark mode.
 *
 * @example
 * deriveAccentPalette('#ffeb3b', 'light')
 * // -> { accent: '#...', accentInk: '#...', accentSoft: '#...', accentOn: '#1d221e' }
 */
export function deriveAccentPalette(hex: string, mode: 'light' | 'dark'): AccentPalette {
  const { h, s: inputS, l: inputL } = hexToHsl(hex)

  const accentL = mode === 'light' ? clamp(inputL, 38, 52) : clamp(inputL, 60, 75)
  const accentS = mode === 'light' ? clamp(inputS, 45, 90) : clamp(inputS, 40, 85)
  const accent = hslToHex({ h, s: accentS, l: accentL })

  const inkL =
    mode === 'light' ? clamp(accentL - 15, 20, 40) : clamp(accentL + 12, 70, 88)
  const accentInk = hslToHex({ h, s: accentS, l: inkL })

  const softS = mode === 'light' ? clamp(accentS * 0.4, 20, 45) : clamp(accentS * 0.5, 25, 50)
  const softL = mode === 'light' ? 93 : 20
  const accentSoft = hslToHex({ h, s: softS, l: softL })

  return { accent, accentInk, accentSoft, accentOn: pickAccentOn(accent) }
}
