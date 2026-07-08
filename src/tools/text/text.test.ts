import { describe, expect, it } from 'vitest'
import {
  removeDuplicateLines,
  removeEmptyLines,
  sortLinesAscending,
  sortLinesDescending,
  toLowerCase,
  toTitleCase,
  toUpperCase,
  trimTrailingWhitespace,
} from './text'

describe('case conversion', () => {
  it('upper-cases including unicode', () => {
    expect(toUpperCase('héllo ß')).toEqual({ ok: true, output: 'HÉLLO SS' })
  })

  it('lower-cases', () => {
    expect(toLowerCase('HÉLLO')).toEqual({ ok: true, output: 'héllo' })
  })

  it('title-cases words and lowers the rest', () => {
    expect(toTitleCase('hello WORLD foo-bar')).toEqual({ ok: true, output: 'Hello World Foo-Bar' })
  })

  it("title-case keeps apostrophes inside words: don't → Don't", () => {
    expect(toTitleCase("don't stop")).toEqual({ ok: true, output: "Don't Stop" })
  })
})

describe('sortLines', () => {
  it('sorts ascending', () => {
    expect(sortLinesAscending('banana\napple\ncherry')).toEqual({
      ok: true,
      output: 'apple\nbanana\ncherry',
    })
  })

  it('sorts descending', () => {
    expect(sortLinesDescending('banana\napple\ncherry')).toEqual({
      ok: true,
      output: 'cherry\nbanana\napple',
    })
  })

  it('preserves a trailing newline', () => {
    expect(sortLinesAscending('b\na\n')).toEqual({ ok: true, output: 'a\nb\n' })
  })

  it('handles a single line', () => {
    expect(sortLinesAscending('only')).toEqual({ ok: true, output: 'only' })
  })
})

describe('removeDuplicateLines', () => {
  it('keeps first occurrences in order', () => {
    expect(removeDuplicateLines('a\nb\na\nc\nb')).toEqual({ ok: true, output: 'a\nb\nc' })
  })

  it('is case-sensitive (A and a are different lines)', () => {
    expect(removeDuplicateLines('A\na\nA')).toEqual({ ok: true, output: 'A\na' })
  })
})

describe('trimTrailingWhitespace', () => {
  it('strips trailing spaces and tabs per line', () => {
    expect(trimTrailingWhitespace('a  \nb\t\nc')).toEqual({ ok: true, output: 'a\nb\nc' })
  })

  it('keeps leading whitespace (indentation)', () => {
    expect(trimTrailingWhitespace('  indented  ')).toEqual({ ok: true, output: '  indented' })
  })
})

describe('removeEmptyLines', () => {
  it('drops empty and whitespace-only lines', () => {
    expect(removeEmptyLines('a\n\n   \nb\n')).toEqual({ ok: true, output: 'a\nb\n' })
  })

  it('returns empty input unchanged', () => {
    expect(removeEmptyLines('')).toEqual({ ok: true, output: '' })
  })
})
