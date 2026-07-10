/**
 * Small color-math helpers used to derive an accent palette from a
 * single user-picked hex color (see `deriveAccentPalette.ts`). Pure
 * functions with no app-specific knowledge — no design-token names,
 * no OpenPad concepts — just hex/HSL/luminance math.
 */

/** Hue in degrees `[0, 360)`, saturation/lightness as percentages `[0, 100]`. */
export interface Hsl {
  h: number
  s: number
  l: number
}

interface Rgb {
  r: number
  g: number
  b: number
}

/** Parses a `#rgb` or `#rrggbb` hex string into 0-255 RGB channels. */
export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const value = parseInt(expanded, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

/** Formats 0-255 RGB channels as a lowercase `#rrggbb` hex string. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const toByte = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

/** Converts a hex color to HSL. */
export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const l = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { h: 0, s: 0, l: l * 100 }
  }

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rNorm) {
    h = ((gNorm - bNorm) / delta) % 6
  } else if (max === gNorm) {
    h = (bNorm - rNorm) / delta + 2
  } else {
    h = (rNorm - gNorm) / delta + 4
  }
  h *= 60
  if (h < 0) {
    h += 360
  }

  return { h, s: s * 100, l: l * 100 }
}

/** Converts HSL back to a `#rrggbb` hex string. */
export function hslToHex({ h, s, l }: Hsl): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let rgb: [number, number, number]
  if (h < 60) {
    rgb = [c, x, 0]
  } else if (h < 120) {
    rgb = [x, c, 0]
  } else if (h < 180) {
    rgb = [0, c, x]
  } else if (h < 240) {
    rgb = [0, x, c]
  } else if (h < 300) {
    rgb = [x, 0, c]
  } else {
    rgb = [c, 0, x]
  }

  return rgbToHex({
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255,
  })
}

/** WCAG relative luminance (0 = black, 1 = white) of a hex color. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const linearize = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG contrast ratio (`1`–`21`) between two hex colors. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA)
  const lumB = relativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Clamps `value` into `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
