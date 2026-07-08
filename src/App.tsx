/**
 * Application root: menu bar, tab strip, editor, status bar.
 *
 * Document state lives in the Zustand documents store; this component
 * wires the store to the UI and owns user-facing decisions such as the
 * "discard unsaved changes?" confirmation on tab close. Layout and
 * visuals follow docs/ui-mockup.html.
 */
import { useEffect, useRef, useState } from 'react'
import { CompareDialog } from './compare/CompareDialog'
import { CompareView, type CompareSide } from './compare/CompareView'
import { EditorPane, type EditorPaneHandle } from './components/EditorPane/EditorPane'
import { MenuBar } from './components/MenuBar/MenuBar'
import { StatusBar, type StatusNotice } from './components/StatusBar/StatusBar'
import { TabBar } from './components/TabBar/TabBar'
import { useFileOperations } from './files/useFileOperations'
import { PreviewPane, type PreviewPaneHandle } from './preview/PreviewPane'
import { UpdatePrompt } from './pwa/UpdatePrompt'
import { ShortcutsDialog } from './components/ShortcutsDialog/ShortcutsDialog'
import { selectActiveDocument, useDocumentsStore } from './store/documentsStore'
import { hydrateDocumentsStore } from './storage/persistence'
import { useTheme } from './theme/useTheme'
import type { CursorInfo, NotepadDocument } from './types/document'
import type { ToolRunStatus } from './tools/apply'
import './App.css'

const INITIAL_CURSOR: CursorInfo = { line: 1, column: 1, selectionLength: 0 }

/** Turns a tool outcome into the status-bar message users see. */
function noticeFromToolStatus(status: ToolRunStatus): StatusNotice {
  if (!status.result.ok) {
    const position = status.result.position
    const where = position === undefined ? '' : ` (line ${position.line}, col ${position.column})`
    return { kind: 'error', text: `${status.toolName}: ${status.result.error}${where}` }
  }
  const scope = status.appliedToSelection ? 'selection' : 'document'
  return {
    kind: 'success',
    text: status.result.message ?? `${status.toolName} applied to ${scope}`,
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [cursor, setCursor] = useState<CursorInfo>(INITIAL_CURSOR)
  const [notice, setNotice] = useState<StatusNotice | null>(null)
  const editorRef = useRef<EditorPaneHandle>(null)
  const previewRef = useRef<PreviewPaneHandle>(null)
  // Manual preview toggle for one specific document; when the active
  // document has no override the preview defaults to "on for Markdown".
  const [previewOverride, setPreviewOverride] = useState<{ id: string; visible: boolean } | null>(
    null,
  )
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [compareState, setCompareState] = useState<{
    left: CompareSide
    right: CompareSide
  } | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const documents = useDocumentsStore((state) => state.documents)
  const activeId = useDocumentsStore((state) => state.activeId)
  const hydrated = useDocumentsStore((state) => state.hydrated)
  const saveState = useDocumentsStore((state) => state.saveState)
  const activeDocument = useDocumentsStore(selectActiveDocument)
  const createDocument = useDocumentsStore((state) => state.createDocument)
  const closeDocument = useDocumentsStore((state) => state.closeDocument)
  const activateDocument = useDocumentsStore((state) => state.activateDocument)
  const renameDocument = useDocumentsStore((state) => state.renameDocument)
  const updateContent = useDocumentsStore((state) => state.updateContent)
  const { openFile, saveDocument, saveDocumentAs, openDroppedFiles } = useFileOperations()

  // Load the persisted workspace once, then autosave for the app lifetime.
  useEffect(() => {
    let cancelled = false
    let stopAutosave: (() => void) | undefined
    void hydrateDocumentsStore().then((stop) => {
      if (cancelled) {
        stop()
      } else {
        stopAutosave = stop
      }
    })
    return () => {
      cancelled = true
      stopAutosave?.()
    }
  }, [])

  const previewVisible =
    previewOverride !== null && previewOverride.id === activeDocument?.id
      ? previewOverride.visible
      : activeDocument?.language === 'markdown'

  /** Close with a confirmation when edits would be discarded. */
  const requestClose = (id: string) => {
    const doc = documents.find((candidate) => candidate.id === id)
    if (doc === undefined) {
      return
    }
    const losesContent = doc.dirty && doc.content.trim() !== ''
    if (losesContent && !window.confirm(`Close "${doc.name}" and discard its content?`)) {
      return
    }
    closeDocument(id)
  }

  /** Reports a failed file operation the same way tool failures are shown. */
  const reportFileError = (action: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    setNotice({ kind: 'error', text: `${action} failed: ${message}` })
  }

  const handleOpenFile = () => {
    openFile().catch((error: unknown) => reportFileError('Open', error))
  }

  /** Reads the current name back from the store — Save As may have renamed the tab. */
  const nameAfterSave = (id: string): string =>
    useDocumentsStore.getState().documents.find((doc) => doc.id === id)?.name ?? ''

  const handleSaveFile = (doc: NotepadDocument) => {
    saveDocument(doc)
      .then(() => setNotice({ kind: 'success', text: `Saved ${nameAfterSave(doc.id)}` }))
      .catch((error: unknown) => reportFileError('Save', error))
  }

  const handleSaveFileAs = (doc: NotepadDocument) => {
    saveDocumentAs(doc)
      .then(() => setNotice({ kind: 'success', text: `Saved as ${nameAfterSave(doc.id)}` }))
      .catch((error: unknown) => reportFileError('Save', error))
  }

  // activeDocument changes on every keystroke; a ref keeps the shortcut
  // listener from being torn down and re-attached on every render.
  const activeDocumentRef = useRef(activeDocument)
  useEffect(() => {
    activeDocumentRef.current = activeDocument
  }, [activeDocument])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = event.metaKey || event.ctrlKey
      if (!modifierPressed) {
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'o') {
        event.preventDefault()
        handleOpenFile()
      } else if (key === 's') {
        event.preventDefault()
        const doc = activeDocumentRef.current
        if (doc === undefined) {
          return
        }
        if (event.shiftKey) {
          handleSaveFileAs(doc)
        } else {
          handleSaveFile(doc)
        }
      } else if (key === 'c' && event.shiftKey) {
        event.preventDefault()
        setCompareDialogOpen(true)
      }
    }
    // '?' (Shift+/) opens the shortcuts help — no modifier required, so
    // it's handled separately from the Mod-based shortcuts above. Skipped
    // while typing in the editor or a rename field, where '?' is just a
    // character the user is entering, not a shortcut.
    const onQuestionMark = (event: KeyboardEvent) => {
      if (event.key !== '?' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target
      if (target instanceof Element && target.closest('.cm-editor, input, textarea')) {
        return
      }
      event.preventDefault()
      setShortcutsOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keydown', onQuestionMark)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onQuestionMark)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer.files.length > 0) {
      openDroppedFiles(event.dataTransfer.files).catch((error: unknown) =>
        reportFileError('Open', error),
      )
    }
  }

  if (!hydrated || activeDocument === undefined) {
    // One frame at most; avoids flashing an editor that is about to be
    // replaced by restored documents.
    return <div className="app" aria-busy="true" />
  }

  return (
    <div className="app" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <MenuBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onRunTool={(tool) => editorRef.current?.runTool(tool)}
        previewVisible={previewVisible}
        onTogglePreview={() =>
          setPreviewOverride({ id: activeDocument.id, visible: !previewVisible })
        }
        activeDocumentDirty={activeDocument.dirty}
        onOpenFile={handleOpenFile}
        onSaveFile={() => handleSaveFile(activeDocument)}
        onSaveFileAs={() => handleSaveFileAs(activeDocument)}
        onOpenCompare={() => setCompareDialogOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      {compareState !== null ? (
        <CompareView
          left={compareState.left}
          right={compareState.right}
          onClose={() => setCompareState(null)}
        />
      ) : (
        <>
          <TabBar
            documents={documents}
            activeId={activeId}
            onActivate={(id) => {
              setNotice(null)
              activateDocument(id)
            }}
            onCreate={createDocument}
            onClose={requestClose}
            onRename={renameDocument}
          />
          <div className={previewVisible ? 'app-main app-main-split' : 'app-main'}>
            <div className="app-editor">
              <EditorPane
                key={activeDocument.id}
                ref={editorRef}
                value={activeDocument.content}
                language={activeDocument.language}
                onChange={(text) => {
                  setNotice(null)
                  updateContent(activeDocument.id, text)
                }}
                onCursorChange={setCursor}
                onToolStatus={(status) => setNotice(noticeFromToolStatus(status))}
                onScrollRatio={(ratio) => previewRef.current?.setScrollRatio(ratio)}
              />
            </div>
            {previewVisible && (
              <PreviewPane ref={previewRef} text={activeDocument.content} theme={theme} />
            )}
          </div>
          <StatusBar
            cursor={cursor}
            text={activeDocument.content}
            language={activeDocument.language}
            saveState={saveState}
            notice={notice}
          />
        </>
      )}
      {compareDialogOpen && (
        <CompareDialog
          otherDocuments={documents.filter((doc) => doc.id !== activeDocument.id)}
          onPick={(right) => {
            setCompareDialogOpen(false)
            setCompareState({
              left: {
                name: activeDocument.name,
                content: activeDocument.content,
                language: activeDocument.language,
              },
              right,
            })
          }}
          onCancel={() => setCompareDialogOpen(false)}
        />
      )}
      {shortcutsOpen && <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />}
      <UpdatePrompt />
    </div>
  )
}
