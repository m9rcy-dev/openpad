/**
 * CodeMirror theme wired to the app-wide design tokens (src/index.css).
 *
 * Colors are referenced as `var(--token)` strings rather than literal hex
 * values, so the editor follows light/dark theme switches automatically —
 * no editor reconfiguration needed when the user toggles the theme.
 */
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

/** Chrome (gutters, selection, cursor, search matches) styling. */
const chromeTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--editor-bg)',
    color: 'var(--ink)',
    fontSize: '13px',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.6',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--gutter)',
    color: 'var(--faint)',
    borderRight: '1px solid var(--line)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--active-line)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--active-line)',
    color: 'var(--muted)',
  },
  // CodeMirror's own base theme hardcodes a focused-selection color
  // (`&light.cm-focused > .cm-scroller > .cm-selectionLayer
  // .cm-selectionBackground { background: #d7d4f0 }` in
  // @codemirror/view) at higher specificity than a plain
  // `.cm-selectionBackground` rule, so it silently wins over this token
  // the moment the editor is focused — `!important` is the standard,
  // documented way to override it (matching the selector exactly is
  // fragile against future CodeMirror internal changes).
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--accent-soft) !important',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--accent-soft)',
    outline: '1px solid var(--accent)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'var(--accent-soft)',
    outline: '1px solid var(--accent)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-on)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--chrome)',
    color: 'var(--ink)',
    borderTop: '1px solid var(--line)',
  },
  '.cm-panels input, .cm-panels button': {
    fontFamily: 'var(--font-mono)',
  },
})

/**
 * Syntax colors. Deliberately restrained: the green accent marks structure
 * (headings, keys, tags), everything else stays close to the ink color, per
 * the design target in docs/ui-mockup.html.
 */
const highlight = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--accent-ink)', fontWeight: '700' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: 'var(--accent-ink)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--muted)' },
  { tag: tags.monospace, color: 'var(--accent-ink)' },
  { tag: tags.quote, color: 'var(--muted)', fontStyle: 'italic' },
  { tag: tags.meta, color: 'var(--faint)' },
  { tag: tags.processingInstruction, color: 'var(--faint)' },
  { tag: tags.propertyName, color: 'var(--accent-ink)' },
  { tag: tags.string, color: 'var(--ink)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--accent-ink)' },
  { tag: tags.keyword, color: 'var(--accent-ink)' },
  { tag: [tags.tagName, tags.angleBracket], color: 'var(--accent-ink)' },
  { tag: tags.attributeName, color: 'var(--muted)' },
  { tag: tags.comment, color: 'var(--faint)', fontStyle: 'italic' },
  { tag: tags.invalid, color: 'var(--danger)' },
])

/** Complete visual theme: chrome + syntax highlighting. */
export function editorTheme(): Extension {
  return [chromeTheme, syntaxHighlighting(highlight)]
}
