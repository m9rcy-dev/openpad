/**
 * Live preview pane: renders the active document as sanitized Markdown
 * HTML, then upgrades diagram placeholders into real diagrams —
 * Mermaid locally (lazy-loaded), PlantUML via the configured server
 * (with an offline fallback notice).
 */
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { DIAGRAM_CLASS, renderMarkdown } from './markdown'
import { renderMermaid } from './mermaid'
import { plantUmlImageUrl } from './plantuml'
import './PreviewPane.css'

/** Imperative surface for scroll syncing from the editor. */
export interface PreviewPaneHandle {
  /** Scrolls the preview to the given 0..1 document ratio. */
  setScrollRatio: (ratio: number) => void
}

export interface PreviewPaneProps {
  /** Markdown source to render. */
  text: string
  /** Effective app theme; mermaid diagrams follow it. */
  theme: 'light' | 'dark'
  ref?: Ref<PreviewPaneHandle>
}

/** Debounces a value; diagram re-rendering on every keystroke is wasteful. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

/** Builds the notice shown where a diagram could not be rendered. */
function diagramNotice(message: string, source: string): HTMLElement {
  const notice = document.createElement('div')
  notice.className = 'diagram-notice'
  const label = document.createElement('p')
  label.textContent = message
  const pre = document.createElement('pre')
  pre.textContent = source
  notice.append(label, pre)
  return notice
}

export function PreviewPane({ text, theme, ref }: PreviewPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedText = useDebouncedValue(text, 250)
  const html = useMemo(() => renderMarkdown(debouncedText), [debouncedText])

  useImperativeHandle(ref, () => ({
    setScrollRatio: (ratio) => {
      const el = containerRef.current
      if (el !== null) {
        el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
      }
    },
  }))

  // Upgrade diagram placeholders after each render. The epoch guard
  // drops async results that arrive after the content changed again.
  const epochRef = useRef(0)
  useEffect(() => {
    epochRef.current += 1
    const epoch = epochRef.current
    const container = containerRef.current
    if (container === null) {
      return
    }

    for (const el of container.querySelectorAll(`.${DIAGRAM_CLASS.mermaid}`)) {
      const source = decodeURIComponent(el.getAttribute('data-diagram') ?? '')
      void renderMermaid(source, theme).then((result) => {
        if (epochRef.current !== epoch) {
          return
        }
        if (result.ok && result.svg !== undefined) {
          el.innerHTML = result.svg
          el.classList.add('diagram-rendered')
        } else {
          el.replaceChildren(diagramNotice(result.error ?? 'Mermaid: unknown error', source))
        }
      })
    }

    for (const el of container.querySelectorAll(`.${DIAGRAM_CLASS.plantuml}`)) {
      const source = decodeURIComponent(el.getAttribute('data-diagram') ?? '')
      if (!navigator.onLine) {
        el.replaceChildren(
          diagramNotice('PlantUML rendering needs a network connection (see README).', source),
        )
        continue
      }
      const img = document.createElement('img')
      img.alt = 'PlantUML diagram'
      img.className = 'diagram-plantuml-image'
      img.src = plantUmlImageUrl(source)
      img.onerror = () => {
        if (epochRef.current === epoch) {
          el.replaceChildren(
            diagramNotice('PlantUML server could not render this diagram.', source),
          )
        }
      }
      el.replaceChildren(img)
      el.classList.add('diagram-rendered')
    }
  }, [html, theme])

  return (
    <div className="preview-pane" ref={containerRef} data-testid="preview-pane">
      <div className="preview-tag" aria-hidden="true">
        <span>Preview · Markdown</span>
      </div>
      {/* Safe by construction: renderMarkdown output is DOMPurify-sanitized. */}
      <div className="preview-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
