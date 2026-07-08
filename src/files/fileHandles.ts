/**
 * Associates open documents with the on-disk file they were opened from
 * or saved to, when the browser exposes one (File System Access API).
 *
 * Deliberately NOT persisted to IndexedDB: a `FileSystemFileHandle`'s
 * permission grant does not survive a reload in a way we can rely on
 * without re-prompting the user, and silently reusing a stale handle
 * across sessions is worse than just asking again. So on every reload,
 * every document starts handle-less — the next "Save" behaves like
 * "Save As" once, then remembers the handle for the rest of the session.
 */

const handles = new Map<string, FileSystemFileHandle>()

export function getFileHandle(documentId: string): FileSystemFileHandle | undefined {
  return handles.get(documentId)
}

export function setFileHandle(documentId: string, handle: FileSystemFileHandle): void {
  handles.set(documentId, handle)
}

export function clearFileHandle(documentId: string): void {
  handles.delete(documentId)
}
