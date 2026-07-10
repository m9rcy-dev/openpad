/**
 * The Edit dropdown: Undo / Redo / Find… / Replace… / Theme…. Cut/Copy/
 * Paste are deliberately not here — they already work via native OS
 * shortcuts, and wiring a menu click to the Clipboard API would add
 * real cross-browser risk for no functional gain (see
 * docs/openpad-feature-01-plan.md). Theme… opens `ThemeDialog` (see
 * docs/openpad-feature-02-plan.md) rather than living inline, since it
 * needs a live preview surface, not just clickable rows.
 *
 * Undo/Redo's disabled state is read from the live editor once, when the
 * dropdown opens, rather than kept in sync on every keystroke.
 */
import { useRef, useState } from 'react'
import type { EditState } from '../EditorPane/EditorPane'
import { formatShortcut, redoShortcut } from '../../utils/shortcuts'
import { useMenuClose } from './useMenuClose'
import './DropdownMenu.css'

export interface EditMenuProps {
  /** Reads the current Undo/Redo availability from the live editor. */
  getEditState: () => EditState
  onUndo: () => void
  onRedo: () => void
  onFind: () => void
  onReplace: () => void
  onOpenTheme: () => void
}

export function EditMenu({
  getEditState,
  onUndo,
  onRedo,
  onFind,
  onReplace,
  onOpenTheme,
}: EditMenuProps) {
  const [open, setOpen] = useState(false)
  const [editState, setEditState] = useState<EditState>({ canUndo: false, canRedo: false })
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuClose(open, rootRef, () => setOpen(false))

  const toggleOpen = () => {
    if (!open) {
      setEditState(getEditState())
    }
    setOpen((value) => !value)
  }

  const runAndClose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div className="dropdown-menu-root" ref={rootRef}>
      <button
        type="button"
        className={open ? 'menu-trigger menu-trigger-open' : 'menu-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        Edit
      </button>
      {open && (
        <div className="dropdown-menu" role="menu" aria-label="Edit">
          <button
            type="button"
            role="menuitem"
            className="dropdown-menu-item"
            disabled={!editState.canUndo}
            onClick={runAndClose(onUndo)}
          >
            <span>Undo</span>
            <span className="dropdown-menu-shortcut" aria-hidden="true">
              {formatShortcut('Mod-z')}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="dropdown-menu-item"
            disabled={!editState.canRedo}
            onClick={runAndClose(onRedo)}
          >
            <span>Redo</span>
            <span className="dropdown-menu-shortcut" aria-hidden="true">
              {formatShortcut(redoShortcut())}
            </span>
          </button>
          <div className="dropdown-menu-group">
            <button
              type="button"
              role="menuitem"
              className="dropdown-menu-item"
              onClick={runAndClose(onFind)}
            >
              <span>Find…</span>
              <span className="dropdown-menu-shortcut" aria-hidden="true">
                {formatShortcut('Mod-f')}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-menu-item"
              onClick={runAndClose(onReplace)}
            >
              <span>Replace…</span>
            </button>
          </div>
          <div className="dropdown-menu-group">
            <button
              type="button"
              role="menuitem"
              className="dropdown-menu-item"
              onClick={runAndClose(onOpenTheme)}
            >
              <span>Theme…</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
