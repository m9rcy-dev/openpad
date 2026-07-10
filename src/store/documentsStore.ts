/**
 * The documents store: every open tab, which one is active, and the
 * autosave status. This is the single source of truth for document state;
 * components subscribe via the `useDocumentsStore` hook and persistence
 * (src/storage/persistence.ts) subscribes to write changes to IndexedDB.
 *
 * All actions are pure state transitions — no I/O happens here, which is
 * what keeps the store trivially unit-testable.
 */
import { create } from 'zustand'
import type { DocumentLanguage, NotepadDocument } from '../types/document'
import { detectLanguage } from '../editor/languages'

/** Autosave lifecycle, surfaced in the status bar. */
export type SaveState = 'idle' | 'saving' | 'saved'

export interface DocumentsState {
  documents: NotepadDocument[]
  /** Id of the document shown in the editor; null only before hydration. */
  activeId: string | null
  /** True once persisted state has been loaded (or found absent) on boot. */
  hydrated: boolean
  saveState: SaveState

  /** Creates an empty `untitled-N` document and activates it. */
  createDocument: () => void
  /**
   * Closes a document. The caller is responsible for any "discard unsaved
   * changes?" confirmation. Closing the last tab creates a fresh empty one,
   * so there is always a document to type into.
   */
  closeDocument: (id: string) => void
  activateDocument: (id: string) => void
  /** Renames a document and re-detects its language from the new name. */
  renameDocument: (id: string, name: string) => void
  /** Replaces a document's content (editor edits and transform tools). */
  updateContent: (id: string, content: string) => void
  setLanguage: (id: string, language: DocumentLanguage) => void
  /** Appends an already-built document (file open) and activates it. */
  addDocument: (doc: NotepadDocument) => void
  /**
   * Overwrites a document's name/content/language and clears `dirty` —
   * used to load an opened file into an existing (empty, untouched) tab
   * instead of adding a new one.
   */
  replaceDocument: (id: string, name: string, content: string) => void
  /**
   * Marks a document as saved to disk. Pass `name` when Save As changed
   * the file name, so the tab and language stay in sync with it.
   */
  markSaved: (id: string, name?: string) => void
  /** Installs persisted state on boot; used only by hydration. */
  hydrate: (documents: NotepadDocument[], activeId: string | null) => void
  setSaveState: (saveState: SaveState) => void
}

/** Builds a fresh empty document. Exported for tests and file-open (M6). */
export function newDocument(name: string): NotepadDocument {
  return {
    id: crypto.randomUUID(),
    name,
    content: '',
    language: detectLanguage(name),
    dirty: false,
    updatedAt: Date.now(),
  }
}

/**
 * First `untitled-N` name not already taken by an open document.
 * Exported for `src/share/importSharedLink.ts` — an inbound shared
 * link has no filename of its own, so it needs the same collision-free
 * naming `createDocument` uses internally.
 */
export function nextUntitledName(documents: NotepadDocument[]): string {
  const taken = new Set(documents.map((doc) => doc.name))
  let n = 1
  while (taken.has(`untitled-${n}`)) {
    n += 1
  }
  return `untitled-${n}`
}

/** Applies a partial update to one document in the list. */
function patchDocument(
  documents: NotepadDocument[],
  id: string,
  patch: Partial<NotepadDocument>,
): NotepadDocument[] {
  return documents.map((doc) => (doc.id === id ? { ...doc, ...patch, updatedAt: Date.now() } : doc))
}

export const useDocumentsStore = create<DocumentsState>()((set) => ({
  documents: [],
  activeId: null,
  hydrated: false,
  saveState: 'idle',

  createDocument: () =>
    set((state) => {
      const doc = newDocument(nextUntitledName(state.documents))
      return { documents: [...state.documents, doc], activeId: doc.id }
    }),

  closeDocument: (id) =>
    set((state) => {
      const remaining = state.documents.filter((doc) => doc.id !== id)
      if (remaining.length === 0) {
        const doc = newDocument('untitled-1')
        return { documents: [doc], activeId: doc.id }
      }
      if (state.activeId !== id) {
        return { documents: remaining }
      }
      // Activate the neighbor that took the closed tab's position,
      // clamped to the end — the behavior tab UIs are expected to have.
      const closedIndex = state.documents.findIndex((doc) => doc.id === id)
      const neighbor = remaining[Math.min(closedIndex, remaining.length - 1)]
      return { documents: remaining, activeId: neighbor?.id ?? null }
    }),

  activateDocument: (id) =>
    set((state) => (state.documents.some((doc) => doc.id === id) ? { activeId: id } : state)),

  renameDocument: (id, name) =>
    set((state) => {
      const trimmed = name.trim()
      if (trimmed === '') {
        return state
      }
      return {
        documents: patchDocument(state.documents, id, {
          name: trimmed,
          language: detectLanguage(trimmed),
        }),
      }
    }),

  updateContent: (id, content) =>
    set((state) => ({
      documents: patchDocument(state.documents, id, { content, dirty: true }),
    })),

  setLanguage: (id, language) =>
    set((state) => ({ documents: patchDocument(state.documents, id, { language }) })),

  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc], activeId: doc.id })),

  replaceDocument: (id, name, content) =>
    set((state) => ({
      documents: patchDocument(state.documents, id, {
        name,
        content,
        language: detectLanguage(name),
        dirty: false,
      }),
    })),

  markSaved: (id, name) =>
    set((state) => ({
      documents: patchDocument(state.documents, id, {
        dirty: false,
        ...(name === undefined ? {} : { name, language: detectLanguage(name) }),
      }),
    })),

  hydrate: (documents, activeId) =>
    set(() => {
      if (documents.length === 0) {
        const doc = newDocument('untitled-1')
        return { documents: [doc], activeId: doc.id, hydrated: true }
      }
      const validActive = documents.some((doc) => doc.id === activeId)
      return {
        documents,
        activeId: validActive ? activeId : (documents[0]?.id ?? null),
        hydrated: true,
      }
    }),

  setSaveState: (saveState) => set({ saveState }),
}))

/** Convenience selector: the document currently shown in the editor. */
export function selectActiveDocument(state: DocumentsState): NotepadDocument | undefined {
  return state.documents.find((doc) => doc.id === state.activeId)
}

/** True for an untouched `untitled-N` tab — safe to overwrite on file open. */
export function isEmptyUntitledDocument(doc: NotepadDocument): boolean {
  return !doc.dirty && doc.content === '' && /^untitled-\d+$/.test(doc.name)
}
