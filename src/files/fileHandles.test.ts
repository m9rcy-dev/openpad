import { afterEach, describe, expect, it } from 'vitest'
import { clearFileHandle, getFileHandle, setFileHandle } from './fileHandles'

// Real FileSystemFileHandle objects only exist behind a user gesture in a
// real browser; a plain object is enough to verify the Map wrapper's
// get/set/clear behavior, which is all this module does.
const fakeHandle = {} as FileSystemFileHandle

afterEach(() => {
  clearFileHandle('doc-1')
  clearFileHandle('doc-2')
})

describe('fileHandles', () => {
  it('returns undefined for a document with no handle', () => {
    expect(getFileHandle('doc-1')).toBeUndefined()
  })

  it('stores and retrieves a handle by document id', () => {
    setFileHandle('doc-1', fakeHandle)
    expect(getFileHandle('doc-1')).toBe(fakeHandle)
  })

  it('keeps handles for different documents independent', () => {
    const otherHandle = {} as FileSystemFileHandle
    setFileHandle('doc-1', fakeHandle)
    setFileHandle('doc-2', otherHandle)
    expect(getFileHandle('doc-1')).toBe(fakeHandle)
    expect(getFileHandle('doc-2')).toBe(otherHandle)
  })

  it('removes a handle on clear', () => {
    setFileHandle('doc-1', fakeHandle)
    clearFileHandle('doc-1')
    expect(getFileHandle('doc-1')).toBeUndefined()
  })
})
