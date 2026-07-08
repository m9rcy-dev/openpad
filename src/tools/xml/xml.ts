/**
 * XML tools: format (pretty-print), minify, and validate.
 *
 * Parsing uses the browser's native DOMParser — no third-party XML
 * dependency. Serialization is a small recursive writer that handles
 * elements, attributes, text, CDATA, comments, and processing
 * instructions, escaping everything it emits. An XML declaration
 * (`<?xml …?>`) at the start of the input is preserved.
 *
 * Limitation (documented deliberately): internal DTD subsets are not
 * preserved by DOMParser and will be dropped from formatted output.
 */
import { toolError, toolOk, type ToolResult } from '../../types/tools'

const INDENT = '  '

/** Escapes text content: `&` and angle brackets. */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Escapes attribute values (double-quoted). */
function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

type ParsedXml = { ok: true; document: XMLDocument } | { ok: false; error: string }

function parse(input: string): ParsedXml {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty — nothing to parse.' }
  }
  const parsed = new DOMParser().parseFromString(input, 'application/xml')
  const parseError = parsed.getElementsByTagName('parsererror')[0]
  if (parseError !== undefined) {
    // Browsers put a human-readable description inside <parsererror>;
    // formats differ per engine, so pass the text through as-is.
    // Element.textContent is spec-guaranteed non-null; only its content varies.
    const detail = parseError.textContent.trim().split('\n')[0]
    return { ok: false, error: `Invalid XML: ${detail}` }
  }
  return { ok: true, document: parsed }
}

/** True when the node contains only text/CDATA children (e.g. <t>hi</t>). */
function hasOnlyTextChildren(node: Node): boolean {
  return Array.from(node.childNodes).every(
    (child) => child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE,
  )
}

/** Serializes one node at the given depth. Returns [] for droppable whitespace. */
function serializeNode(node: Node, depth: number, pretty: boolean): string[] {
  const pad = pretty ? INDENT.repeat(depth) : ''

  switch (node.nodeType) {
    // Text, CDATASection, and Comment are all CharacterData: unlike the
    // general Node.textContent, CharacterData.textContent is never null.
    case Node.TEXT_NODE: {
      const text = (node as CharacterData).textContent
      if (text.trim() === '') {
        return [] // inter-element whitespace: regenerated (format) or dropped (minify)
      }
      return [pad + escapeText(pretty ? text.trim() : text)]
    }
    case Node.CDATA_SECTION_NODE:
      return [`${pad}<![CDATA[${(node as CharacterData).textContent}]]>`]
    case Node.COMMENT_NODE:
      return [`${pad}<!--${(node as CharacterData).textContent}-->`]
    case Node.PROCESSING_INSTRUCTION_NODE: {
      const pi = node as ProcessingInstruction
      return [`${pad}<?${pi.target} ${pi.data}?>`]
    }
    case Node.ELEMENT_NODE:
      return serializeElement(node as Element, depth, pretty)
    default:
      return []
  }
}

function serializeElement(element: Element, depth: number, pretty: boolean): string[] {
  const pad = pretty ? INDENT.repeat(depth) : ''
  const attributes = Array.from(element.attributes)
    .map((attr) => ` ${attr.name}="${escapeAttribute(attr.value)}"`)
    .join('')
  const open = `${element.tagName}${attributes}`

  if (element.childNodes.length === 0) {
    return [`${pad}<${open}/>`]
  }

  // Text-only elements stay on one line: <name>value</name>
  if (hasOnlyTextChildren(element)) {
    const text = Array.from(element.childNodes)
      .map((node) => {
        // hasOnlyTextChildren guarantees Text or CDATASection here, both
        // CharacterData, whose textContent is never null.
        const child = node as CharacterData
        return child.nodeType === Node.CDATA_SECTION_NODE
          ? `<![CDATA[${child.textContent}]]>`
          : escapeText(pretty ? child.textContent.trim() : child.textContent)
      })
      .join('')
    return [`${pad}<${open}>${text}</${element.tagName}>`]
  }

  const children = Array.from(element.childNodes).flatMap((child) =>
    serializeNode(child, depth + 1, pretty),
  )
  if (pretty) {
    return [`${pad}<${open}>`, ...children, `${pad}</${element.tagName}>`]
  }
  return [`<${open}>`, ...children, `</${element.tagName}>`]
}

/** Re-emits the input's XML declaration, if it has one. */
function xmlDeclaration(input: string): string | undefined {
  const match = /^\s*(<\?xml[^?]*\?>)/.exec(input)
  return match?.[1]
}

/**
 * Pretty-prints XML with 2-space indentation.
 *
 * @example
 * formatXml('<a><b>hi</b></a>')
 * // { ok: true, output: '<a>\n  <b>hi</b>\n</a>' }
 */
export function formatXml(input: string): ToolResult {
  const parsed = parse(input)
  if (!parsed.ok) {
    return toolError(parsed.error)
  }
  const lines = Array.from(parsed.document.childNodes).flatMap((node) =>
    serializeNode(node, 0, true),
  )
  const declaration = xmlDeclaration(input)
  return toolOk((declaration === undefined ? lines : [declaration, ...lines]).join('\n'))
}

/**
 * Minifies XML by dropping inter-element whitespace and newlines.
 *
 * @example
 * minifyXml('<a>\n  <b>hi</b>\n</a>') // { ok: true, output: '<a><b>hi</b></a>' }
 */
export function minifyXml(input: string): ToolResult {
  const parsed = parse(input)
  if (!parsed.ok) {
    return toolError(parsed.error)
  }
  const parts = Array.from(parsed.document.childNodes).flatMap((node) =>
    serializeNode(node, 0, false),
  )
  const declaration = xmlDeclaration(input)
  return toolOk((declaration === undefined ? '' : declaration) + parts.join(''))
}

/**
 * Validates XML without changing the document: the output is the input.
 *
 * @example
 * validateXml('<a/>')  // { ok: true, output: '<a/>', message: 'Valid XML' }
 * validateXml('<a>')   // { ok: false, error: 'Invalid XML: …' }
 */
export function validateXml(input: string): ToolResult {
  const parsed = parse(input)
  if (!parsed.ok) {
    return toolError(parsed.error)
  }
  return toolOk(input, 'Valid XML')
}
