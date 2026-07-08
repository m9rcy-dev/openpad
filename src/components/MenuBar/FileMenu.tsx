/**
 * The File dropdown: Open / Save / Save As. Actual I/O lives in
 * src/files (File System Access API with a download/hidden-input
 * fallback); this component only wires clicks to it.
 */
import { useRef, useState } from 'react'
import { formatShortcut } from '../../utils/shortcuts'
import { useMenuClose } from './useMenuClose'
import './DropdownMenu.css'

export interface FileMenuProps {
  /** Whether the active document has unsaved changes. */
  dirty: boolean
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
}

export function FileMenu({ dirty, onOpen, onSave, onSaveAs }: FileMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuClose(open, rootRef, () => setOpen(false))

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
        onClick={() => setOpen((value) => !value)}
      >
        File
      </button>
      {open && (
        <div className="dropdown-menu" role="menu" aria-label="File">
          <button
            type="button"
            role="menuitem"
            className="dropdown-menu-item"
            onClick={runAndClose(onOpen)}
          >
            <span>Open…</span>
            <span className="dropdown-menu-shortcut" aria-hidden="true">
              {formatShortcut('Mod-o')}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="dropdown-menu-item"
            disabled={!dirty}
            onClick={runAndClose(onSave)}
          >
            <span>Save</span>
            <span className="dropdown-menu-shortcut" aria-hidden="true">
              {formatShortcut('Mod-s')}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="dropdown-menu-item"
            onClick={runAndClose(onSaveAs)}
          >
            <span>Save As…</span>
            <span className="dropdown-menu-shortcut" aria-hidden="true">
              {formatShortcut('Mod-Shift-s')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
