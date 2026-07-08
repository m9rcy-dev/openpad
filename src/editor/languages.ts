/**
 * Maps {@link DocumentLanguage} values to CodeMirror language extensions
 * and infers a document's language from its file name.
 */
import type { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import type { DocumentLanguage } from '../types/document'

/**
 * Returns the CodeMirror extension(s) for a language. `plain` gets no
 * extension — CodeMirror treats the document as unstructured text.
 */
export function languageExtension(language: DocumentLanguage): Extension {
  switch (language) {
    case 'json':
      return json()
    case 'xml':
      return xml()
    case 'markdown':
      // `base: markdownLanguage` enables GitHub-flavored extensions
      // (task lists, tables, strikethrough) over plain CommonMark.
      return markdown({ base: markdownLanguage })
    case 'plain':
      return []
  }
}

/** File extension (lower-case, without dot) → language. */
const EXTENSION_MAP: Record<string, DocumentLanguage> = {
  md: 'markdown',
  markdown: 'markdown',
  json: 'json',
  xml: 'xml',
  svg: 'xml',
  xsl: 'xml',
  html: 'xml',
  htm: 'xml',
}

/**
 * Infers the document language from a file or tab name by its extension.
 * Unknown or missing extensions fall back to `plain`.
 *
 * @example
 * detectLanguage('notes.md')      // 'markdown'
 * detectLanguage('payload.JSON')  // 'json'
 * detectLanguage('untitled-1')    // 'plain'
 */
export function detectLanguage(fileName: string): DocumentLanguage {
  const dot = fileName.lastIndexOf('.')
  if (dot === -1 || dot === fileName.length - 1) {
    return 'plain'
  }
  const extension = fileName.slice(dot + 1).toLowerCase()
  return EXTENSION_MAP[extension] ?? 'plain'
}
