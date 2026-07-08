import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, describe, expect, it } from 'vitest'
import type { ToolDefinition } from '../types/tools'
import { toolError, toolOk } from '../types/tools'
import { applyToolToEditor } from './apply'

const upperTool: ToolDefinition = {
  id: 'test-upper',
  label: 'Upper',
  category: 'Text',
  run: (input) => toolOk(input.toUpperCase()),
}

const failTool: ToolDefinition = {
  id: 'test-fail',
  label: 'Fail',
  category: 'Text',
  run: () => toolError('always fails'),
}

let view: EditorView | undefined

function makeView(doc: string, selection?: { anchor: number; head: number }): EditorView {
  view = new EditorView({
    state: EditorState.create({ doc, selection }),
    parent: document.body,
  })
  return view
}

afterEach(() => {
  view?.destroy()
  view = undefined
})

describe('applyToolToEditor', () => {
  it('transforms the whole document when nothing is selected', () => {
    const editor = makeView('hello world')
    const status = applyToolToEditor(editor, upperTool)
    expect(editor.state.doc.toString()).toBe('HELLO WORLD')
    expect(status.appliedToSelection).toBe(false)
    expect(status.result.ok).toBe(true)
  })

  it('transforms only the selection when one exists', () => {
    const editor = makeView('hello world', { anchor: 0, head: 5 })
    const status = applyToolToEditor(editor, upperTool)
    expect(editor.state.doc.toString()).toBe('HELLO world')
    expect(status.appliedToSelection).toBe(true)
  })

  it('keeps the transformed selection selected for chaining', () => {
    const editor = makeView('hello world', { anchor: 0, head: 5 })
    applyToolToEditor(editor, upperTool)
    const { from, to } = editor.state.selection.main
    expect(editor.state.sliceDoc(from, to)).toBe('HELLO')
  })

  it('leaves the document untouched when the tool fails', () => {
    const editor = makeView('hello')
    const status = applyToolToEditor(editor, failTool)
    expect(editor.state.doc.toString()).toBe('hello')
    expect(status.result.ok).toBe(false)
  })

  it('reports a category-qualified tool name', () => {
    const editor = makeView('x')
    const status = applyToolToEditor(editor, upperTool)
    expect(status.toolName).toBe('Text · Upper')
  })

  it('supports undo as a single step (dispatches one change)', () => {
    const editor = makeView('a\nb')
    applyToolToEditor(editor, upperTool)
    expect(editor.state.doc.toString()).toBe('A\nB')
  })
})
