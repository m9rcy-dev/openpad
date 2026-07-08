import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isFileSystemAccessSupported,
  pickAndReadFile,
  saveFileAs,
  writeToHandle,
} from './fileOperations'

vi.mock('./download', () => ({ downloadFile: vi.fn() }))

/** Minimal fake matching the one method pickWithFileSystemAccess/writeToHandle use. */
function fakeFileHandle(name: string, content: string): FileSystemFileHandle {
  const write = vi.fn()
  const close = vi.fn()
  return {
    kind: 'file',
    name,
    getFile: () => Promise.resolve(new File([content], name, { type: 'text/plain' })),
    createWritable: () =>
      Promise.resolve({ write, close } as unknown as FileSystemWritableFileStream),
  } as unknown as FileSystemFileHandle
}

describe('isFileSystemAccessSupported', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'showOpenFilePicker')
    Reflect.deleteProperty(window, 'showSaveFilePicker')
  })

  it('is false when the API is absent (e.g. Firefox, Safari)', () => {
    expect(isFileSystemAccessSupported()).toBe(false)
  })

  it('is true only when both picker functions are present', () => {
    window.showOpenFilePicker = vi.fn()
    window.showSaveFilePicker = vi.fn()
    expect(isFileSystemAccessSupported()).toBe(true)
  })
})

describe('pickAndReadFile — File System Access API path', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'showOpenFilePicker')
    Reflect.deleteProperty(window, 'showSaveFilePicker')
  })

  it('reads the chosen file and returns its handle', async () => {
    const handle = fakeFileHandle('notes.md', '# hi')
    window.showOpenFilePicker = vi.fn().mockResolvedValue([handle])
    window.showSaveFilePicker = vi.fn()

    const result = await pickAndReadFile()
    expect(result).toEqual({ name: 'notes.md', content: '# hi', handle })
  })

  it('resolves to null when the user cancels the picker', async () => {
    const abort = new DOMException('cancelled', 'AbortError')
    window.showOpenFilePicker = vi.fn().mockRejectedValue(abort)
    window.showSaveFilePicker = vi.fn()

    expect(await pickAndReadFile()).toBeNull()
  })

  it('propagates non-cancel errors', async () => {
    window.showOpenFilePicker = vi.fn().mockRejectedValue(new Error('disk error'))
    window.showSaveFilePicker = vi.fn()

    await expect(pickAndReadFile()).rejects.toThrow('disk error')
  })
})

describe('pickAndReadFile — hidden-input fallback', () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, 'showOpenFilePicker')
    Reflect.deleteProperty(window, 'showSaveFilePicker')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with the selected file and no handle', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      const file = new File(['plain text'], 'todo.txt', { type: 'text/plain' })
      Object.defineProperty(this, 'files', { value: [file], configurable: true })
      this.dispatchEvent(new Event('change'))
    })

    const result = await pickAndReadFile()
    expect(result).toEqual({ name: 'todo.txt', content: 'plain text', handle: null })
  })

  it('resolves to null when the input reports cancel', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      this.dispatchEvent(new Event('cancel'))
    })

    expect(await pickAndReadFile()).toBeNull()
  })

  it('removes the temporary input element after use', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement,
    ) {
      this.dispatchEvent(new Event('cancel'))
    })

    await pickAndReadFile()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })
})

describe('writeToHandle', () => {
  it('writes content and closes the writable stream', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const handle = {
      createWritable: () => Promise.resolve({ write, close }),
    } as unknown as FileSystemFileHandle

    await writeToHandle(handle, 'new content')
    expect(write).toHaveBeenCalledWith('new content')
    expect(close).toHaveBeenCalled()
  })
})

describe('saveFileAs', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'showOpenFilePicker')
    Reflect.deleteProperty(window, 'showSaveFilePicker')
    vi.clearAllMocks()
  })

  it('downloads the file when the File System Access API is unsupported', async () => {
    const { downloadFile } = await import('./download')
    const result = await saveFileAs('content', 'notes.txt')
    expect(downloadFile).toHaveBeenCalledWith('content', 'notes.txt')
    expect(result).toEqual({ name: 'notes.txt', handle: null })
  })

  it('writes through the native save picker when supported', async () => {
    const handle = fakeFileHandle('renamed.md', '')
    window.showOpenFilePicker = vi.fn()
    window.showSaveFilePicker = vi.fn().mockResolvedValue(handle)

    const result = await saveFileAs('content', 'notes.md')
    expect(result).toEqual({ name: 'renamed.md', handle })
  })

  it('resolves to null when the save picker is cancelled', async () => {
    const abort = new DOMException('cancelled', 'AbortError')
    window.showOpenFilePicker = vi.fn()
    window.showSaveFilePicker = vi.fn().mockRejectedValue(abort)

    expect(await saveFileAs('content', 'notes.md')).toBeNull()
  })
})
