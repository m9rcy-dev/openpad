import { describe, expect, it } from 'vitest'
import { countWords } from './text'

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two  three\nfour')).toBe(4)
  })

  it('returns 0 for empty and whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
  })
})
