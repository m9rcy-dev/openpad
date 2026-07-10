import { describe, expect, it } from 'vitest'
import { ACCENT_PRESETS, findAccentPreset } from './accentPresets'

describe('ACCENT_PRESETS', () => {
  it('has exactly three presets: green, cobalt, violet', () => {
    expect(ACCENT_PRESETS.map((preset) => preset.id)).toEqual(['green', 'cobalt', 'violet'])
  })

  it('every preset has valid hex values for both modes', () => {
    const hex = /^#[0-9a-f]{6}$/
    for (const preset of ACCENT_PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        expect(preset[mode].accent).toMatch(hex)
        expect(preset[mode].accentInk).toMatch(hex)
        expect(preset[mode].accentSoft).toMatch(hex)
        expect(preset[mode].accentOn).toMatch(hex)
      }
    }
  })
})

describe('findAccentPreset', () => {
  it('finds a preset by id', () => {
    expect(findAccentPreset('cobalt').label).toBe('Cobalt Blue')
    expect(findAccentPreset('violet').label).toBe('Digital Violet')
  })

  it('falls back to green for an unrecognized id', () => {
    // @ts-expect-error deliberately passing an invalid id to test the fallback
    expect(findAccentPreset('not-a-real-id').id).toBe('green')
  })
})
