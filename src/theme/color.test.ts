import { describe, expect, it } from 'vitest'
import {
  clamp,
  contrastRatio,
  hexToHsl,
  hexToRgb,
  hslToHex,
  relativeLuminance,
  rgbToHex,
} from './color'

describe('hexToRgb', () => {
  it('parses a 6-digit hex color', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('#2e8b46')).toEqual({ r: 46, g: 139, b: 70 })
  })

  it('expands a 3-digit hex color', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
  })
})

describe('rgbToHex', () => {
  it('formats channels as lowercase #rrggbb', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })

  it('clamps and rounds out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 127.6 })).toBe('#ff0080')
  })
})

describe('hexToHsl', () => {
  it('converts pure red', () => {
    const hsl = hexToHsl('#ff0000')
    expect(hsl.h).toBeCloseTo(0)
    expect(hsl.s).toBeCloseTo(100)
    expect(hsl.l).toBeCloseTo(50)
  })

  it('converts white to zero saturation, full lightness', () => {
    const hsl = hexToHsl('#ffffff')
    expect(hsl.s).toBeCloseTo(0)
    expect(hsl.l).toBeCloseTo(100)
  })

  it('converts black to zero lightness', () => {
    const hsl = hexToHsl('#000000')
    expect(hsl.l).toBeCloseTo(0)
  })

  it('converts a known green', () => {
    const hsl = hexToHsl('#2e8b46')
    expect(hsl.h).toBeGreaterThan(120)
    expect(hsl.h).toBeLessThan(150)
  })

  it('handles gray (max at each channel position) without a NaN hue', () => {
    expect(hexToHsl('#808080').h).toBe(0)
  })
})

describe('hslToHex', () => {
  it('round-trips through hexToHsl for a spread of hues', () => {
    const samples = ['#ff0000', '#00ff00', '#0000ff', '#2e8b46', '#8f6fc9', '#2f6fed', '#e8c468']
    for (const hex of samples) {
      const roundTripped = hslToHex(hexToHsl(hex))
      expect(roundTripped).toBe(hex)
    }
  })

  it('produces black and white at the lightness extremes', () => {
    expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000')
    expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff')
  })

  it('covers every 60-degree hue segment', () => {
    expect(hslToHex({ h: 30, s: 100, l: 50 })).toBe('#ff8000')
    expect(hslToHex({ h: 90, s: 100, l: 50 })).toBe('#80ff00')
    expect(hslToHex({ h: 150, s: 100, l: 50 })).toBe('#00ff80')
    expect(hslToHex({ h: 210, s: 100, l: 50 })).toBe('#0080ff')
    expect(hslToHex({ h: 270, s: 100, l: 50 })).toBe('#8000ff')
    expect(hslToHex({ h: 330, s: 100, l: 50 })).toBe('#ff0080')
  })
})

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1)
    expect(relativeLuminance('#000000')).toBeCloseTo(0)
  })

  it('is higher for a lighter color than a darker one', () => {
    expect(relativeLuminance('#4fbf68')).toBeGreaterThan(relativeLuminance('#1d6b33'))
  })
})

describe('contrastRatio', () => {
  it('is 21 for black against white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('is 1 for a color against itself', () => {
    expect(contrastRatio('#2e8b46', '#2e8b46')).toBeCloseTo(1)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#2e8b46', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#2e8b46'))
  })
})

describe('clamp', () => {
  it('leaves in-range values unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps below the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps above the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})
