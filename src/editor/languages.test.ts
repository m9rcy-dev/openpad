import { describe, expect, it } from 'vitest'
import { detectLanguage, languageExtension } from './languages'

describe('detectLanguage', () => {
  it.each([
    ['notes.md', 'markdown'],
    ['README.markdown', 'markdown'],
    ['payload.json', 'json'],
    ['payload.JSON', 'json'],
    ['config.xml', 'xml'],
    ['diagram.svg', 'xml'],
    ['page.html', 'xml'],
  ] as const)('maps %s to %s', (fileName, expected) => {
    expect(detectLanguage(fileName)).toBe(expected)
  })

  it('falls back to plain for unknown extensions', () => {
    expect(detectLanguage('script.py')).toBe('plain')
  })

  it('falls back to plain when there is no extension', () => {
    expect(detectLanguage('untitled-1')).toBe('plain')
  })

  it('falls back to plain for names ending in a dot', () => {
    expect(detectLanguage('weird.')).toBe('plain')
  })
})

describe('languageExtension', () => {
  it('returns an empty extension for plain text', () => {
    expect(languageExtension('plain')).toEqual([])
  })

  it.each(['markdown', 'json', 'xml'] as const)('returns an extension for %s', (language) => {
    expect(languageExtension(language)).toBeTruthy()
  })
})
