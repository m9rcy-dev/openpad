import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newDocument, useDocumentsStore } from '../store/documentsStore'
import {
  AUTOSAVE_DEBOUNCE_MS,
  WORKSPACE_KEY,
  hydrateDocumentsStore,
  type PersistedWorkspace,
} from './persistence'

// In-memory stand-in for idb-keyval: jsdom has no IndexedDB, and these
// tests care about *what* is persisted and *when*, not the IDB wire format.
const idbData = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: (key: string) => Promise.resolve(idbData.get(key)),
  set: (key: string, value: unknown) => {
    idbData.set(key, value)
    return Promise.resolve()
  },
}))

let stopAutosave: (() => void) | undefined

beforeEach(() => {
  idbData.clear()
  useDocumentsStore.setState({
    documents: [],
    activeId: null,
    hydrated: false,
    saveState: 'idle',
  })
  vi.useFakeTimers()
})

afterEach(() => {
  stopAutosave?.()
  stopAutosave = undefined
  vi.useRealTimers()
})

describe('hydrateDocumentsStore', () => {
  it('starts with a fresh untitled document when storage is empty', async () => {
    stopAutosave = await hydrateDocumentsStore()
    const state = useDocumentsStore.getState()
    expect(state.hydrated).toBe(true)
    expect(state.documents[0]?.name).toBe('untitled-1')
  })

  it('restores a persisted workspace', async () => {
    const doc = newDocument('notes.md')
    const workspace: PersistedWorkspace = { documents: [doc], activeId: doc.id }
    idbData.set(WORKSPACE_KEY, workspace)

    stopAutosave = await hydrateDocumentsStore()
    const state = useDocumentsStore.getState()
    expect(state.documents).toEqual([doc])
    expect(state.activeId).toBe(doc.id)
  })

  it('ignores corrupted persisted data', async () => {
    idbData.set(WORKSPACE_KEY, { documents: 'garbage' })
    stopAutosave = await hydrateDocumentsStore()
    expect(useDocumentsStore.getState().documents[0]?.name).toBe('untitled-1')
  })

  it('autosaves document changes after the debounce delay', async () => {
    stopAutosave = await hydrateDocumentsStore()
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')

    useDocumentsStore.getState().updateContent(doc.id, 'draft text')
    expect(useDocumentsStore.getState().saveState).toBe('saving')
    expect(idbData.get(WORKSPACE_KEY)).toBeUndefined()

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS)
    const saved = idbData.get(WORKSPACE_KEY) as PersistedWorkspace
    expect(saved.documents[0]?.content).toBe('draft text')
    expect(useDocumentsStore.getState().saveState).toBe('saved')
  })

  it('collapses rapid edits into a single trailing write', async () => {
    stopAutosave = await hydrateDocumentsStore()
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')

    useDocumentsStore.getState().updateContent(doc.id, 'a')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS / 2)
    useDocumentsStore.getState().updateContent(doc.id, 'ab')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS / 2)
    expect(idbData.get(WORKSPACE_KEY)).toBeUndefined()

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS / 2)
    const saved = idbData.get(WORKSPACE_KEY) as PersistedWorkspace
    expect(saved.documents[0]?.content).toBe('ab')
  })

  it('stops persisting after cleanup', async () => {
    stopAutosave = await hydrateDocumentsStore()
    const doc = useDocumentsStore.getState().documents[0]
    if (doc === undefined) throw new Error('expected a document')

    stopAutosave()
    stopAutosave = undefined
    useDocumentsStore.getState().updateContent(doc.id, 'late edit')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2)
    expect(idbData.get(WORKSPACE_KEY)).toBeUndefined()
  })
})
