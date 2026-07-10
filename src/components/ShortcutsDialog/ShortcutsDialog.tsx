/**
 * Keyboard-shortcut reference: a small always-available modal listing
 * every shortcut in the app. File, Edit, and Compare entries are
 * hardcoded (they aren't part of the tool registry); tool shortcuts are
 * read straight from `TOOLS`, so a new shortcut there appears here
 * automatically.
 */
import { useEffect, useRef } from 'react'
import { TOOLS } from '../../tools/registry'
import { formatShortcut, redoShortcut } from '../../utils/shortcuts'
import './ShortcutsDialog.css'

export interface ShortcutsDialogProps {
  onClose: () => void
}

interface ShortcutEntry {
  label: string
  /** Omitted for actions with no dedicated key binding (e.g. Replace…). */
  shortcut?: string
}

const FILE_SHORTCUTS: ShortcutEntry[] = [
  { label: 'Open…', shortcut: 'Mod-o' },
  { label: 'Save', shortcut: 'Mod-s' },
  { label: 'Save As…', shortcut: 'Mod-Shift-s' },
]

const VIEW_SHORTCUTS: ShortcutEntry[] = [{ label: 'Compare with…', shortcut: 'Mod-Shift-c' }]

// Redo's key differs by platform (see historyKeymap), so this is built at
// render time rather than as a module-level constant like the others.
function editShortcuts(): ShortcutEntry[] {
  return [
    { label: 'Undo', shortcut: 'Mod-z' },
    { label: 'Redo', shortcut: redoShortcut() },
    { label: 'Find…', shortcut: 'Mod-f' },
    { label: 'Replace…' },
  ]
}

const TOOL_SHORTCUTS: ShortcutEntry[] = TOOLS.filter((tool) => tool.shortcut !== undefined).map(
  (tool) => ({ label: `${tool.category} · ${tool.label}`, shortcut: tool.shortcut ?? '' }),
)

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="shortcuts-dialog-backdrop" onClick={onClose}>
      <div
        className="shortcuts-dialog"
        role="dialog"
        aria-label="Keyboard shortcuts"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcuts-dialog-header">
          <h2 className="shortcuts-dialog-title">Keyboard shortcuts</h2>
          <button
            type="button"
            className="shortcuts-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ShortcutGroup title="File" entries={FILE_SHORTCUTS} />
        <ShortcutGroup title="Edit" entries={editShortcuts()} />
        <ShortcutGroup title="Tools" entries={TOOL_SHORTCUTS} />
        <ShortcutGroup title="View" entries={VIEW_SHORTCUTS} />
      </div>
    </div>
  )
}

function ShortcutGroup({ title, entries }: { title: string; entries: ShortcutEntry[] }) {
  if (entries.length === 0) {
    return null
  }
  return (
    <div className="shortcuts-dialog-group">
      <h3 className="shortcuts-dialog-heading">{title}</h3>
      <dl className="shortcuts-dialog-list">
        {entries.map((entry) => (
          <div className="shortcuts-dialog-row" key={entry.label}>
            <dt>{entry.label}</dt>
            <dd>{entry.shortcut === undefined ? null : formatShortcut(entry.shortcut)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
