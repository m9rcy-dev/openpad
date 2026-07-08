import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('shows cursor position, counts, and language', () => {
    render(
      <StatusBar
        cursor={{ line: 7, column: 24, selectionLength: 0 }}
        text="hello world"
        language="markdown"
      />,
    )
    const bar = screen.getByRole('status')
    expect(bar).toHaveTextContent('Ln 7, Col 24')
    expect(bar).toHaveTextContent('11 chars · 2 words')
    expect(bar).toHaveTextContent('Markdown')
  })

  it('shows the selection size when text is selected', () => {
    render(
      <StatusBar
        cursor={{ line: 1, column: 1, selectionLength: 5 }}
        text="hello"
        language="plain"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('(5 selected)')
  })

  it('shows a saving indicator', () => {
    render(
      <StatusBar
        cursor={{ line: 1, column: 1, selectionLength: 0 }}
        text=""
        language="plain"
        saveState="saving"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('saving…')
  })

  it('shows an autosaved indicator', () => {
    render(
      <StatusBar
        cursor={{ line: 1, column: 1, selectionLength: 0 }}
        text=""
        language="plain"
        saveState="saved"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('autosaved')
  })

  it('shows a success notice', () => {
    render(
      <StatusBar
        cursor={{ line: 1, column: 1, selectionLength: 0 }}
        text=""
        language="plain"
        notice={{ kind: 'success', text: 'JSON · Format applied to document' }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('applied to document')
  })

  it('shows an error notice', () => {
    render(
      <StatusBar
        cursor={{ line: 1, column: 1, selectionLength: 0 }}
        text=""
        language="plain"
        notice={{ kind: 'error', text: 'JSON · Format: Invalid JSON' }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON')
  })
})
