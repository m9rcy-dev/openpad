import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EditorPane, type EditorPaneHandle } from './EditorPane'

describe('EditorPane', () => {
  it('mounts a CodeMirror editor showing the document text', () => {
    render(<EditorPane value="hello editor" language="plain" onChange={vi.fn()} />)
    const pane = screen.getByTestId('editor-pane')
    expect(pane.querySelector('.cm-editor')).not.toBeNull()
    expect(pane).toHaveTextContent('hello editor')
  })

  it('reports the initial cursor position', () => {
    const onCursorChange = vi.fn()
    render(
      <EditorPane
        value="line one"
        language="plain"
        onChange={vi.fn()}
        onCursorChange={onCursorChange}
      />,
    )
    expect(onCursorChange).toHaveBeenCalledWith({ line: 1, column: 1, selectionLength: 0 })
  })

  it('renders updated text when the value prop changes externally', () => {
    const { rerender } = render(<EditorPane value="before" language="plain" onChange={vi.fn()} />)
    rerender(<EditorPane value="after" language="plain" onChange={vi.fn()} />)
    expect(screen.getByTestId('editor-pane')).toHaveTextContent('after')
  })

  it('runs a tool via the imperative handle and reports the outcome', () => {
    const ref = createRef<EditorPaneHandle>()
    const onToolStatus = vi.fn()
    render(
      <EditorPane
        ref={ref}
        value='{"a":1}'
        language="json"
        onChange={vi.fn()}
        onToolStatus={onToolStatus}
      />,
    )

    ref.current?.runTool({
      id: 'test-upper',
      label: 'Upper',
      category: 'Text',
      run: (input) => ({ ok: true, output: input.toUpperCase() }),
    })

    expect(screen.getByTestId('editor-pane')).toHaveTextContent('{"A":1}')
    expect(onToolStatus).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'test-upper', appliedToSelection: false }),
    )
  })

  it('moves focus into the editor via the imperative handle', () => {
    const ref = createRef<EditorPaneHandle>()
    render(<EditorPane ref={ref} value="x" language="plain" onChange={vi.fn()} />)
    ref.current?.focus()
    expect(document.activeElement?.closest('[data-testid="editor-pane"]')).not.toBeNull()
  })

  it('reports scroll position for preview sync', () => {
    const onScrollRatio = vi.fn()
    render(
      <EditorPane
        value={Array.from({ length: 200 }, (_, i) => `line ${i}`).join('\n')}
        language="plain"
        onChange={vi.fn()}
        onScrollRatio={onScrollRatio}
      />,
    )

    const scroller = screen.getByTestId('editor-pane').querySelector('.cm-scroller')
    expect(scroller).not.toBeNull()
    Object.defineProperty(scroller as Element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller as Element, 'clientHeight', { value: 500, configurable: true })
    Object.defineProperty(scroller as Element, 'scrollTop', { value: 750, configurable: true })
    fireEvent.scroll(scroller as Element)

    expect(onScrollRatio).toHaveBeenCalledWith(0.5)
  })
})
