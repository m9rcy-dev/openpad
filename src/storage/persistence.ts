/**
 * IndexedDB persistence for the documents store.
 *
 * Strategy: the whole workspace (all documents + active tab) is stored
 * under one key via idb-keyval. Writes are debounced so fast typing does
 * not hammer IndexedDB; the trailing write always contains the final
 * state. On boot, `hydrateDocumentsStore` loads the workspace exactly
 * once and then starts the autosave subscription.
 */
import { get, set } from 'idb-keyval'
import type { NotepadDocument } from '../types/document'
import { useDocumentsStore } from '../store/documentsStore'

/** Single IndexedDB key holding the whole workspace. */
export const WORKSPACE_KEY = 'openpad:workspace'

/** Milliseconds of quiet time before an edit is written to IndexedDB. */
export const AUTOSAVE_DEBOUNCE_MS = 500

/** Shape of the value stored under {@link WORKSPACE_KEY}. */
export interface PersistedWorkspace {
  documents: NotepadDocument[]
  activeId: string | null
}

/** Runtime check so corrupted/foreign data can't crash hydration. */
function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<PersistedWorkspace>
  return (
    Array.isArray(candidate.documents) &&
    candidate.documents.every(
      (doc) => typeof doc === 'object' && doc !== null && typeof doc.id === 'string',
    )
  )
}

/**
 * Loads the persisted workspace into the store (marking it hydrated) and
 * begins autosaving subsequent changes. Returns a cleanup function that
 * stops autosaving — used by tests and hot reloads; the app itself keeps
 * the subscription for its whole lifetime.
 */
export async function hydrateDocumentsStore(): Promise<() => void> {
  const store = useDocumentsStore

  let persisted: PersistedWorkspace | undefined
  try {
    const raw: unknown = await get(WORKSPACE_KEY)
    persisted = isPersistedWorkspace(raw) ? raw : undefined
  } catch {
    // IndexedDB unavailable (private browsing, storage pressure, …):
    // run as an in-memory notepad rather than failing to start.
    persisted = undefined
  }
  store.getState().hydrate(persisted?.documents ?? [], persisted?.activeId ?? null)

  let timer: ReturnType<typeof setTimeout> | undefined

  const unsubscribe = store.subscribe((state, previous) => {
    // Only content-bearing changes schedule a write — not saveState
    // flips (which this module itself causes) or re-hydration.
    if (state.documents === previous.documents && state.activeId === previous.activeId) {
      return
    }
    store.getState().setSaveState('saving')
    clearTimeout(timer)
    timer = setTimeout(() => {
      const { documents, activeId } = store.getState()
      const workspace: PersistedWorkspace = { documents, activeId }
      set(WORKSPACE_KEY, workspace)
        .then(() => store.getState().setSaveState('saved'))
        .catch(() => store.getState().setSaveState('idle'))
    }, AUTOSAVE_DEBOUNCE_MS)
  })

  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}
