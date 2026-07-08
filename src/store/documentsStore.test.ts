import { beforeEach, describe, expect, it } from 'vitest'
import {
  isEmptyUntitledDocument,
  newDocument,
  selectActiveDocument,
  useDocumentsStore,
} from './documentsStore'

/** Resets the store to a known single-document state before each test. */
beforeEach(() => {
  useDocumentsStore.setState({
    documents: [],
    activeId: null,
    hydrated: false,
    saveState: 'idle',
  })
  useDocumentsStore.getState().hydrate([], null)
})

describe('hydrate', () => {
  it('creates an empty untitled document when nothing was persisted', () => {
    const state = useDocumentsStore.getState()
    expect(state.documents).toHaveLength(1)
    expect(state.documents[0]?.name).toBe('untitled-1')
    expect(state.activeId).toBe(state.documents[0]?.id)
    expect(state.hydrated).toBe(true)
  })

  it('restores persisted documents and the active tab', () => {
    const a = newDocument('a.md')
    const b = newDocument('b.json')
    useDocumentsStore.getState().hydrate([a, b], b.id)
    expect(useDocumentsStore.getState().documents).toEqual([a, b])
    expect(useDocumentsStore.getState().activeId).toBe(b.id)
  })

  it('falls back to the first document when the active id is unknown', () => {
    const a = newDocument('a.md')
    useDocumentsStore.getState().hydrate([a], 'missing-id')
    expect(useDocumentsStore.getState().activeId).toBe(a.id)
  })
})

describe('createDocument', () => {
  it('adds and activates an untitled document with the next free number', () => {
    useDocumentsStore.getState().createDocument()
    const state = useDocumentsStore.getState()
    expect(state.documents.map((doc) => doc.name)).toEqual(['untitled-1', 'untitled-2'])
    expect(selectActiveDocument(state)?.name).toBe('untitled-2')
  })

  it('reuses freed numbers', () => {
    const store = useDocumentsStore.getState()
    store.createDocument() // untitled-2
    const first = useDocumentsStore.getState().documents[0]
    if (first === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().closeDocument(first.id) // frees untitled-1
    useDocumentsStore.getState().createDocument()
    expect(useDocumentsStore.getState().documents.map((doc) => doc.name)).toEqual([
      'untitled-2',
      'untitled-1',
    ])
  })
})

describe('closeDocument', () => {
  it('activates the following tab when the active tab closes', () => {
    useDocumentsStore.getState().createDocument()
    useDocumentsStore.getState().createDocument()
    const [first, second, third] = useDocumentsStore.getState().documents
    if (!first || !second || !third) throw new Error('expected three documents')

    useDocumentsStore.getState().activateDocument(second.id)
    useDocumentsStore.getState().closeDocument(second.id)
    expect(useDocumentsStore.getState().activeId).toBe(third.id)
  })

  it('keeps the current tab active when a background tab closes', () => {
    useDocumentsStore.getState().createDocument()
    const [first, second] = useDocumentsStore.getState().documents
    if (!first || !second) throw new Error('expected two documents')

    useDocumentsStore.getState().closeDocument(first.id)
    expect(useDocumentsStore.getState().activeId).toBe(second.id)
  })

  it('replaces the last tab with a fresh untitled document', () => {
    const only = useDocumentsStore.getState().documents[0]
    if (only === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().updateContent(only.id, 'some text')
    useDocumentsStore.getState().closeDocument(only.id)

    const state = useDocumentsStore.getState()
    expect(state.documents).toHaveLength(1)
    expect(state.documents[0]?.content).toBe('')
    expect(state.documents[0]?.id).not.toBe(only.id)
  })
})

describe('renameDocument', () => {
  it('renames and re-detects the language', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().renameDocument(doc.id, 'notes.md')

    const renamed = useDocumentsStore.getState().documents[0]
    expect(renamed?.name).toBe('notes.md')
    expect(renamed?.language).toBe('markdown')
  })

  it('ignores empty names', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().renameDocument(doc.id, '   ')
    expect(useDocumentsStore.getState().documents[0]?.name).toBe('untitled-1')
  })
})

describe('updateContent', () => {
  it('updates content and marks the document dirty', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')
    expect(doc.dirty).toBe(false)

    useDocumentsStore.getState().updateContent(doc.id, 'hello')
    const updated = useDocumentsStore.getState().documents[0]
    expect(updated?.content).toBe('hello')
    expect(updated?.dirty).toBe(true)
  })
})

describe('activateDocument', () => {
  it('ignores unknown ids', () => {
    const before = useDocumentsStore.getState().activeId
    useDocumentsStore.getState().activateDocument('nope')
    expect(useDocumentsStore.getState().activeId).toBe(before)
  })
})

describe('addDocument', () => {
  it('appends a fully-formed document and activates it', () => {
    const doc = newDocument('opened.md')
    doc.content = '# hi'
    useDocumentsStore.getState().addDocument(doc)

    const state = useDocumentsStore.getState()
    expect(state.documents).toHaveLength(2)
    expect(state.documents[1]).toEqual(doc)
    expect(state.activeId).toBe(doc.id)
  })
})

describe('replaceDocument', () => {
  it('overwrites name, content, and language, and clears dirty', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().updateContent(doc.id, 'draft') // becomes dirty

    useDocumentsStore.getState().replaceDocument(doc.id, 'notes.json', '{"a":1}')

    const replaced = useDocumentsStore.getState().documents[0]
    expect(replaced).toMatchObject({
      id: doc.id,
      name: 'notes.json',
      content: '{"a":1}',
      language: 'json',
      dirty: false,
    })
  })
})

describe('markSaved', () => {
  it('clears dirty without changing the name when none is given', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')
    useDocumentsStore.getState().updateContent(doc.id, 'draft')

    useDocumentsStore.getState().markSaved(doc.id)

    const saved = useDocumentsStore.getState().documents[0]
    expect(saved?.dirty).toBe(false)
    expect(saved?.name).toBe(doc.name)
  })

  it('renames and re-detects language when a name is given (Save As)', () => {
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')

    useDocumentsStore.getState().markSaved(doc.id, 'renamed.xml')

    const saved = useDocumentsStore.getState().documents[0]
    expect(saved?.name).toBe('renamed.xml')
    expect(saved?.language).toBe('xml')
    expect(saved?.dirty).toBe(false)
  })
})

describe('isEmptyUntitledDocument', () => {
  it('is true for an untouched untitled-N document', () => {
    expect(isEmptyUntitledDocument(newDocument('untitled-3'))).toBe(true)
  })

  it('is false once content has been typed', () => {
    const doc = newDocument('untitled-1')
    doc.content = 'x'
    expect(isEmptyUntitledDocument(doc)).toBe(false)
  })

  it('is false for a document with a real file name', () => {
    expect(isEmptyUntitledDocument(newDocument('notes.md'))).toBe(false)
  })

  it('is false once the document is marked dirty', () => {
    const doc = newDocument('untitled-1')
    doc.dirty = true
    expect(isEmptyUntitledDocument(doc)).toBe(false)
  })
})
