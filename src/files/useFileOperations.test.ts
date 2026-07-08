import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { newDocument, useDocumentsStore } from '../store/documentsStore'
import { getFileHandle } from './fileHandles'
import type { OpenedFile, SavedFile } from './fileOperations'
import { useFileOperations } from './useFileOperations'

const pickAndReadFile = vi.fn<() => Promise<OpenedFile | null>>()
const saveFileAs = vi.fn<(content: string, suggestedName: string) => Promise<SavedFile | null>>()
const writeToHandle = vi.fn<(handle: FileSystemFileHandle, content: string) => Promise<void>>()
let fsAccessSupported = true

vi.mock('./fileOperations', () => ({
  pickAndReadFile: () => pickAndReadFile(),
  saveFileAs: (content: string, suggestedName: string) => saveFileAs(content, suggestedName),
  writeToHandle: (handle: FileSystemFileHandle, content: string) => writeToHandle(handle, content),
  isFileSystemAccessSupported: () => fsAccessSupported,
}))

const fakeHandle = {} as FileSystemFileHandle

beforeEach(() => {
  vi.clearAllMocks()
  fsAccessSupported = true
  useDocumentsStore.setState({
    documents: [],
    activeId: null,
    hydrated: true,
    saveState: 'idle',
  })
})

describe('useFileOperations — openFile', () => {
  it('replaces the sole empty untitled tab with the opened file', async () => {
    const empty = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [empty], activeId: empty.id })
    pickAndReadFile.mockResolvedValue({ name: 'notes.md', content: '# hi', handle: null })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openFile())

    const { documents } = useDocumentsStore.getState()
    expect(documents).toHaveLength(1)
    expect(documents[0]).toMatchObject({
      id: empty.id,
      name: 'notes.md',
      content: '# hi',
      dirty: false,
    })
  })

  it('adds a new tab when the current tab has content', async () => {
    const dirty = newDocument('draft.txt')
    dirty.content = 'work in progress'
    useDocumentsStore.setState({ documents: [dirty], activeId: dirty.id })
    pickAndReadFile.mockResolvedValue({ name: 'notes.md', content: '# hi', handle: null })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openFile())

    expect(useDocumentsStore.getState().documents).toHaveLength(2)
  })

  it('does nothing when the picker is cancelled', async () => {
    const empty = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [empty], activeId: empty.id })
    pickAndReadFile.mockResolvedValue(null)

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openFile())

    expect(useDocumentsStore.getState().documents).toEqual([empty])
  })

  it('registers the file handle against the document that received the content', async () => {
    const empty = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [empty], activeId: empty.id })
    pickAndReadFile.mockResolvedValue({ name: 'notes.md', content: '# hi', handle: fakeHandle })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openFile())

    expect(getFileHandle(empty.id)).toBe(fakeHandle)
  })
})

describe('useFileOperations — saveDocument', () => {
  it('writes silently through an existing handle without prompting', async () => {
    const empty = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [empty], activeId: empty.id })
    pickAndReadFile.mockResolvedValue({ name: 'notes.md', content: 'v1', handle: fakeHandle })
    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openFile())

    useDocumentsStore.getState().updateContent(empty.id, 'v2')
    const opened = useDocumentsStore.getState().documents[0]
    if (opened === undefined) throw new Error('expected the opened document')

    await act(() => result.current.saveDocument(opened))

    expect(writeToHandle).toHaveBeenCalledWith(fakeHandle, 'v2')
    expect(saveFileAs).not.toHaveBeenCalled()
    expect(useDocumentsStore.getState().documents[0]?.dirty).toBe(false)
  })

  it('falls back to Save As when the document has no handle', async () => {
    const doc = newDocument('untitled-1')
    doc.content = 'hello'
    useDocumentsStore.setState({ documents: [doc], activeId: doc.id })
    saveFileAs.mockResolvedValue({ name: 'untitled-1', handle: null })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.saveDocument(doc))

    expect(saveFileAs).toHaveBeenCalledWith('hello', 'untitled-1')
    expect(useDocumentsStore.getState().documents[0]?.dirty).toBe(false)
  })
})

describe('useFileOperations — saveDocumentAs', () => {
  it('renames the document to whatever name the save picker returned', async () => {
    const doc = newDocument('untitled-1')
    doc.content = 'hello'
    useDocumentsStore.setState({ documents: [doc], activeId: doc.id })
    saveFileAs.mockResolvedValue({ name: 'greeting.md', handle: fakeHandle })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.saveDocumentAs(doc))

    const saved = useDocumentsStore.getState().documents[0]
    expect(saved?.name).toBe('greeting.md')
    expect(saved?.language).toBe('markdown')
    expect(saved?.dirty).toBe(false)
    expect(getFileHandle(doc.id)).toBe(fakeHandle)
  })

  it('leaves the document untouched when Save As is cancelled', async () => {
    const doc = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [doc], activeId: doc.id })
    useDocumentsStore.getState().updateContent(doc.id, 'hello') // marks it dirty
    saveFileAs.mockResolvedValue(null)

    const dirtyDoc = useDocumentsStore.getState().documents[0]
    if (dirtyDoc === undefined) throw new Error('expected a document')

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.saveDocumentAs(dirtyDoc))

    expect(useDocumentsStore.getState().documents[0]?.dirty).toBe(true)
    expect(useDocumentsStore.getState().documents[0]?.name).toBe('untitled-1')
  })
})

describe('useFileOperations — openDroppedFiles', () => {
  it('opens each dropped file as its own tab', async () => {
    const empty = newDocument('untitled-1')
    useDocumentsStore.setState({ documents: [empty], activeId: empty.id })
    const fileA = new File(['a'], 'a.txt', { type: 'text/plain' })
    const fileB = new File(['b'], 'b.txt', { type: 'text/plain' })

    const { result } = renderHook(() => useFileOperations())
    await act(() => result.current.openDroppedFiles([fileA, fileB]))

    const { documents } = useDocumentsStore.getState()
    expect(documents.map((doc) => doc.name).sort()).toEqual(['a.txt', 'b.txt'])
  })
})
