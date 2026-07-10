import { describe, expect, it } from 'vitest'
import { contrastRatio } from './color'
import { deriveAccentPalette } from './deriveAccentPalette'

const HEX = /^#[0-9a-f]{6}$/

const SAMPLE_HUES = [
  '#ff0000', // red
  '#2e8b46', // chameleon green itself
  '#2f6fed', // cobalt blue
  '#8f6fc9', // digital violet
  '#fefefe', // near-white
  '#050505', // near-black
  '#fff700', // bright, saturated yellow
]

describe('deriveAccentPalette', () => {
  it.each(SAMPLE_HUES)('produces a valid hex palette for %s in light mode', (hex) => {
    const palette = deriveAccentPalette(hex, 'light')
    expect(palette.accent).toMatch(HEX)
    expect(palette.accentInk).toMatch(HEX)
    expect(palette.accentSoft).toMatch(HEX)
    expect(palette.accentOn).toMatch(HEX)
  })

  it.each(SAMPLE_HUES)('produces a valid hex palette for %s in dark mode', (hex) => {
    const palette = deriveAccentPalette(hex, 'dark')
    expect(palette.accent).toMatch(HEX)
    expect(palette.accentInk).toMatch(HEX)
    expect(palette.accentSoft).toMatch(HEX)
    expect(palette.accentOn).toMatch(HEX)
  })

  it.each(SAMPLE_HUES)('keeps accentOn legibly contrasted against accent (%s, light)', (hex) => {
    const palette = deriveAccentPalette(hex, 'light')
    expect(contrastRatio(palette.accent, palette.accentOn)).toBeGreaterThanOrEqual(3)
  })

  it.each(SAMPLE_HUES)('keeps accentOn legibly contrasted against accent (%s, dark)', (hex) => {
    const palette = deriveAccentPalette(hex, 'dark')
    expect(contrastRatio(palette.accent, palette.accentOn)).toBeGreaterThanOrEqual(3)
  })

  it('picks dark text for a bright saturated yellow, in both modes', () => {
    const light = deriveAccentPalette('#fff700', 'light')
    const dark = deriveAccentPalette('#fff700', 'dark')
    expect(light.accentOn).toBe('#1d221e')
    expect(dark.accentOn).toBe('#1d221e')
  })

  it('picks white text for a dark, saturated blue', () => {
    const palette = deriveAccentPalette('#0a1a5c', 'light')
    expect(palette.accentOn).toBe('#ffffff')
  })

  it('produces a lighter accent in dark mode than light mode for the same hue', () => {
    const light = deriveAccentPalette('#2f6fed', 'light')
    const dark = deriveAccentPalette('#2f6fed', 'dark')
    // Compare via luminance-sensitive contrast against black: the dark-mode
    // accent should read as lighter overall.
    expect(contrastRatio(dark.accent, '#000000')).toBeGreaterThan(
      contrastRatio(light.accent, '#000000'),
    )
  })

  it('produces a pale soft tint in light mode and a dark soft tint in dark mode', () => {
    const light = deriveAccentPalette('#2f6fed', 'light')
    const dark = deriveAccentPalette('#2f6fed', 'dark')
    expect(contrastRatio(light.accentSoft, '#ffffff')).toBeLessThan(1.5)
    expect(contrastRatio(dark.accentSoft, '#000000')).toBeLessThan(2)
  })
})
