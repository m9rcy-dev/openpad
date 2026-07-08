/**
 * Wires the browser file APIs (src/files/fileOperations.ts) to the
 * documents store: opening a file creates or replaces a tab, saving
 * writes the active document out and clears its dirty flag.
 */
import { useCallback } from 'react'
import { isEmptyUntitledDocument, newDocument, useDocumentsStore } from '../store/documentsStore'
import type { NotepadDocument } from '../types/document'
import { clearFileHandle, getFileHandle, setFileHandle } from './fileHandles'
import {
  isFileSystemAccessSupported,
  pickAndReadFile,
  saveFileAs,
  writeToHandle,
} from './fileOperations'

export interface UseFileOperationsResult {
  /** Opens a file picker and loads the result into a tab. */
  openFile: () => Promise<void>
  /** Saves the given document: silently if it has a handle, else Save As. */
  saveDocument: (doc: NotepadDocument) => Promise<void>
  /** Always prompts for a location (or downloads, without a native picker). */
  saveDocumentAs: (doc: NotepadDocument) => Promise<void>
  /** Loads dropped files into new tabs (drag-and-drop target). */
  openDroppedFiles: (files: FileList | File[]) => Promise<void>
}

export function useFileOperations(): UseFileOperationsResult {
  const openFile = useCallback(async () => {
    const opened = await pickAndReadFile()
    if (opened === null) {
      return
    }
    loadIntoTab(opened.name, opened.content, opened.handle)
  }, [])

  const saveDocument = useCallback(async (doc: NotepadDocument) => {
    const handle = getFileHandle(doc.id)
    if (handle !== null && handle !== undefined && isFileSystemAccessSupported()) {
      await writeToHandle(handle, doc.content)
      useDocumentsStore.getState().markSaved(doc.id)
      return
    }
    await saveAs(doc)
  }, [])

  const saveDocumentAs = useCallback(async (doc: NotepadDocument) => {
    await saveAs(doc)
  }, [])

  const openDroppedFiles = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const content = await file.text()
      loadIntoTab(file.name, content, null)
    }
  }, [])

  return { openFile, saveDocument, saveDocumentAs, openDroppedFiles }
}

async function saveAs(doc: NotepadDocument): Promise<void> {
  const result = await saveFileAs(doc.content, doc.name)
  if (result === null) {
    return // user cancelled the native picker
  }
  if (result.handle !== null) {
    setFileHandle(doc.id, result.handle)
  } else {
    clearFileHandle(doc.id)
  }
  useDocumentsStore.getState().markSaved(doc.id, result.name)
}

/**
 * Loads file content into a tab: reuses the sole untouched `untitled-N`
 * tab if that's all that's open, otherwise adds a new tab. Registers the
 * file handle (if any) against whichever document id ends up holding it.
 */
function loadIntoTab(name: string, content: string, handle: FileSystemFileHandle | null): void {
  const store = useDocumentsStore.getState()
  const { documents } = store
  const solitary = documents.length === 1 ? documents[0] : undefined

  let targetId: string
  if (solitary !== undefined && isEmptyUntitledDocument(solitary)) {
    store.replaceDocument(solitary.id, name, content)
    targetId = solitary.id
  } else {
    targetId = addNewDocument(name, content)
  }

  if (handle !== null) {
    setFileHandle(targetId, handle)
  }
}

function addNewDocument(name: string, content: string): string {
  const doc = newDocument(name)
  doc.content = content
  useDocumentsStore.getState().addDocument(doc)
  return doc.id
}
