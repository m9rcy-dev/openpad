/**
 * The tool registry: the single list every tool-facing surface derives
 * from. The Tools menu renders it, the editor keymap binds its shortcuts,
 * and the registry test enforces its invariants (unique ids, unique
 * shortcuts).
 *
 * Adding a tool = one pure function + one entry here + one test file.
 */
import type { ToolCategory, ToolDefinition } from '../types/tools'
import { decodeBase64, encodeBase64 } from './encoding/base64'
import { escapeHtml, unescapeHtml } from './encoding/htmlEntities'
import { decodeUrl, encodeUrl } from './encoding/url'
import { formatJson, minifyJson, validateJson } from './json/json'
import { formatXml, minifyXml, validateXml } from './xml/xml'
import {
  removeDuplicateLines,
  removeEmptyLines,
  sortLinesAscending,
  sortLinesDescending,
  toLowerCase,
  toTitleCase,
  toUpperCase,
  trimTrailingWhitespace,
} from './text/text'

/** All tools, in menu order. */
export const TOOLS: readonly ToolDefinition[] = [
  // Encoding
  { id: 'base64-encode', label: 'Base64 encode', category: 'Encoding', run: encodeBase64 },
  { id: 'base64-decode', label: 'Base64 decode', category: 'Encoding', run: decodeBase64 },
  { id: 'url-encode', label: 'URL encode', category: 'Encoding', run: encodeUrl },
  { id: 'url-decode', label: 'URL decode', category: 'Encoding', run: decodeUrl },
  { id: 'html-escape', label: 'HTML escape', category: 'Encoding', run: escapeHtml },
  { id: 'html-unescape', label: 'HTML unescape', category: 'Encoding', run: unescapeHtml },
  // JSON
  {
    id: 'json-format',
    label: 'Format',
    category: 'JSON',
    shortcut: 'Mod-Shift-f',
    run: formatJson,
  },
  {
    id: 'json-minify',
    label: 'Minify',
    category: 'JSON',
    shortcut: 'Mod-Shift-m',
    run: minifyJson,
  },
  { id: 'json-validate', label: 'Validate', category: 'JSON', run: validateJson },
  // XML
  { id: 'xml-format', label: 'Format', category: 'XML', run: formatXml },
  { id: 'xml-minify', label: 'Minify', category: 'XML', run: minifyXml },
  { id: 'xml-validate', label: 'Validate', category: 'XML', run: validateXml },
  // Text
  { id: 'text-uppercase', label: 'UPPER CASE', category: 'Text', run: toUpperCase },
  { id: 'text-lowercase', label: 'lower case', category: 'Text', run: toLowerCase },
  { id: 'text-titlecase', label: 'Title Case', category: 'Text', run: toTitleCase },
  { id: 'text-sort-asc', label: 'Sort lines A→Z', category: 'Text', run: sortLinesAscending },
  { id: 'text-sort-desc', label: 'Sort lines Z→A', category: 'Text', run: sortLinesDescending },
  {
    id: 'text-dedupe',
    label: 'Remove duplicate lines',
    category: 'Text',
    run: removeDuplicateLines,
  },
  {
    id: 'text-trim-trailing',
    label: 'Trim trailing whitespace',
    category: 'Text',
    run: trimTrailingWhitespace,
  },
  { id: 'text-remove-empty', label: 'Remove empty lines', category: 'Text', run: removeEmptyLines },
]

/** Category display order in the Tools menu. */
export const TOOL_CATEGORIES: readonly ToolCategory[] = ['Encoding', 'JSON', 'XML', 'Text']

/** Tools of one category, in registry order. */
export function toolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.category === category)
}
