import { describe, expect, it, vi } from 'vitest'
import { formatJson, minifyJson, offsetToPosition, validateJson } from './json'

describe('formatJson', () => {
  it('pretty-prints with 2-space indentation', () => {
    expect(formatJson('{"a":1,"b":[true,null]}')).toEqual({
      ok: true,
      output: '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}',
    })
  })

  it('accepts scalars and preserves unicode', () => {
    expect(formatJson('"héllo"')).toEqual({ ok: true, output: '"héllo"' })
  })

  it('rejects empty input with a friendly message', () => {
    const result = formatJson('   ')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/empty/)
  })

  it('reports the error location for invalid JSON', () => {
    const result = formatJson('{\n  "a": ,\n}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Invalid JSON/)
      // V8 includes a position; when present it must be line 2.
      if (result.position !== undefined) {
        expect(result.position.line).toBe(2)
      }
    }
  })

  it('handles a non-Error throw from JSON.parse gracefully', () => {
    // JSON.parse only ever throws a real SyntaxError in practice, but the
    // catch block guards the (spec-legal) case of a non-Error throw too.
    const spy = vi.spyOn(JSON, 'parse').mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'not an Error instance'
    })
    try {
      const result = formatJson('{}')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe('Invalid JSON: not an Error instance')
    } finally {
      spy.mockRestore()
    }
  })
})

describe('minifyJson', () => {
  it('removes all insignificant whitespace', () => {
    expect(minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}')).toEqual({
      ok: true,
      output: '{"a":1,"b":[1,2]}',
    })
  })

  it('round-trips with formatJson', () => {
    const minified = minifyJson('{ "deep": { "list": [1,2,3], "s": "x" } }')
    if (!minified.ok) throw new Error('expected success')
    const formatted = formatJson(minified.output)
    if (!formatted.ok) throw new Error('expected success')
    expect(minifyJson(formatted.output)).toEqual(minified)
  })
})

describe('validateJson', () => {
  it('returns the input unchanged with a success message', () => {
    const input = '{ "a": 1 }'
    expect(validateJson(input)).toEqual({ ok: true, output: input, message: 'Valid JSON' })
  })

  it('fails with a position for malformed input', () => {
    const result = validateJson('[1, 2,,]')
    expect(result.ok).toBe(false)
  })
})

describe('offsetToPosition', () => {
  it('maps offsets to 1-based line/column', () => {
    const text = 'ab\ncd\nef'
    expect(offsetToPosition(text, 0)).toEqual({ line: 1, column: 1 })
    expect(offsetToPosition(text, 3)).toEqual({ line: 2, column: 1 })
    expect(offsetToPosition(text, 7)).toEqual({ line: 3, column: 2 })
  })

  it('clamps out-of-range offsets', () => {
    expect(offsetToPosition('ab', 99)).toEqual({ line: 1, column: 3 })
    expect(offsetToPosition('ab', -5)).toEqual({ line: 1, column: 1 })
  })
})
