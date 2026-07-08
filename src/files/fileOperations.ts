/**
 * File open/save, using the File System Access API where the browser
 * supports it (Chrome, Edge) and falling back to a hidden `<input
 * type="file">` for opening and a Blob download for saving elsewhere
 * (Firefox, Safari). Callers never need to branch on support — every
 * exported function here already does.
 */
import { downloadFile } from './download'

export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

export interface OpenedFile {
  name: string
  content: string
  /** Present only when the File System Access API supplied one. */
  handle: FileSystemFileHandle | null
}

/** Text-like extensions accepted by both the native picker and the fallback. */
const OPEN_FILE_TYPES: FilePickerAcceptType = {
  description: 'Text files',
  accept: {
    'text/plain': ['.txt', '.md', '.markdown', '.json', '.xml', '.svg', '.html', '.puml', '.mmd'],
  },
}

/**
 * Opens a file picker and reads the chosen file as text.
 * Resolves to `null` if the user cancels.
 */
export async function pickAndReadFile(): Promise<OpenedFile | null> {
  if (isFileSystemAccessSupported()) {
    return pickWithFileSystemAccess()
  }
  return pickWithHiddenInput()
}

async function pickWithFileSystemAccess(): Promise<OpenedFile | null> {
  try {
    const [handle] = await window.showOpenFilePicker({ types: [OPEN_FILE_TYPES] })
    if (handle === undefined) {
      return null
    }
    const file = await handle.getFile()
    return { name: file.name, content: await file.text(), handle }
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null // user cancelled the picker
    }
    throw caught
  }
}

/**
 * Fallback file picker for browsers without the File System Access API.
 * A detached `<input type="file">` is the only way to open a native file
 * dialog outside that API, so one is created, clicked, and torn down
 * without ever touching the visible DOM.
 */
function pickWithHiddenInput(): Promise<OpenedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.markdown,.json,.xml,.svg,.html,.puml,.mmd,text/plain'
    input.style.display = 'none'

    const cleanup = () => {
      input.removeEventListener('change', onChange)
      input.removeEventListener('cancel', onCancel)
      input.remove()
    }
    const onChange = () => {
      const file = input.files?.[0]
      cleanup()
      if (file === undefined) {
        resolve(null)
        return
      }
      void file.text().then((content) => resolve({ name: file.name, content, handle: null }))
    }
    const onCancel = () => {
      cleanup()
      resolve(null)
    }

    input.addEventListener('change', onChange)
    input.addEventListener('cancel', onCancel)
    document.body.append(input)
    input.click()
  })
}

/** Writes `content` to an already-granted file handle, overwriting it. */
export async function writeToHandle(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

export interface SavedFile {
  name: string
  /** Present only when the File System Access API supplied one. */
  handle: FileSystemFileHandle | null
}

/**
 * Prompts for a save location and writes `content`. On browsers without
 * the File System Access API this downloads the file instead — the
 * browser's download UI stands in for the save dialog, and the returned
 * handle is `null` (later saves of that document repeat this flow).
 * Resolves to `null` only if the native picker was cancelled.
 */
export async function saveFileAs(
  content: string,
  suggestedName: string,
): Promise<SavedFile | null> {
  if (!isFileSystemAccessSupported()) {
    downloadFile(content, suggestedName)
    return { name: suggestedName, handle: null }
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [OPEN_FILE_TYPES],
    })
    await writeToHandle(handle, content)
    return { name: handle.name, handle }
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null // user cancelled the picker
    }
    throw caught
  }
}
