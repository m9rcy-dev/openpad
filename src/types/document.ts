/**
 * Document-related domain types shared across the app.
 */

/**
 * Languages the editor understands. `plain` means no syntax highlighting.
 *
 * Adding a language: extend this union, give it a label in
 * {@link LANGUAGE_LABELS}, wire an extension in `src/editor/languages.ts`,
 * and map its file extensions in `detectLanguage`.
 */
export type DocumentLanguage = 'plain' | 'markdown' | 'json' | 'xml'

/** Human-readable language names, shown in the status bar. */
export const LANGUAGE_LABELS: Record<DocumentLanguage, string> = {
  plain: 'Plain text',
  markdown: 'Markdown',
  json: 'JSON',
  xml: 'XML',
}

/**
 * A single notepad document, i.e. one tab.
 *
 * Documents are continuously autosaved to IndexedDB (src/storage), so
 * `dirty` does not mean "at risk of loss" — it means the content has
 * changed since the document was created, opened from, or saved to a
 * file on disk (file operations arrive in M6). The tab strip shows a
 * dot for dirty documents, like Notepad++.
 */
export interface NotepadDocument {
  /** Stable unique id (crypto.randomUUID()); never shown to users. */
  id: string
  /** Tab title; doubles as the file name for detection and saving. */
  name: string
  content: string
  language: DocumentLanguage
  dirty: boolean
  /** Last modification time (epoch ms), for future "sort by recent". */
  updatedAt: number
}

/**
 * Position of the primary cursor plus selection size, as reported by the
 * editor and displayed in the status bar. Lines and columns are 1-based,
 * matching what users expect from Notepad++.
 */
export interface CursorInfo {
  line: number
  column: number
  /** Number of selected characters; 0 when the selection is empty. */
  selectionLength: number
}
