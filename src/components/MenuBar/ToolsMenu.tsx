/**
 * The Tools dropdown: renders the tool registry grouped by category,
 * plus one fixed, non-registry entry — Share… — below it. Share isn't a
 * text transform (it doesn't touch the document), so it doesn't belong
 * in `src/tools/**`'s registry; it's gated by `shareDisabled`, computed
 * from the active document's length (see docs/openpad-feature-02-plan.md
 * Part B, Design decision 1) the same way `FileMenu`'s Save is gated by
 * `dirty`.
 */
import { useRef, useState } from 'react'
import type { ToolDefinition } from '../../types/tools'
import { TOOL_CATEGORIES, toolsByCategory } from '../../tools/registry'
import { MAX_SHARE_CHARS } from '../../share/shareLink'
import { formatShortcut } from '../../utils/shortcuts'
import { useMenuClose } from './useMenuClose'
import './DropdownMenu.css'

export interface ToolsMenuProps {
  onRunTool: (tool: ToolDefinition) => void
  onOpenShare: () => void
  /** True when the active document is too long to generate a share link for. */
  shareDisabled: boolean
}

export function ToolsMenu({ onRunTool, onOpenShare, shareDisabled }: ToolsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuClose(open, rootRef, () => setOpen(false))

  return (
    <div className="dropdown-menu-root" ref={rootRef}>
      <button
        type="button"
        className={open ? 'menu-trigger menu-trigger-open' : 'menu-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Tools
      </button>
      {open && (
        <div className="dropdown-menu" role="menu" aria-label="Tools">
          {TOOL_CATEGORIES.map((category) => (
            <div key={category} className="dropdown-menu-group">
              <div className="dropdown-menu-heading" aria-hidden="true">
                {category}
              </div>
              {toolsByCategory(category).map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  role="menuitem"
                  className="dropdown-menu-item"
                  onClick={() => {
                    setOpen(false)
                    onRunTool(tool)
                  }}
                >
                  <span>{tool.label}</span>
                  {tool.shortcut !== undefined && (
                    <span className="dropdown-menu-shortcut" aria-hidden="true">
                      {formatShortcut(tool.shortcut)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <div className="dropdown-menu-group">
            <button
              type="button"
              role="menuitem"
              className="dropdown-menu-item"
              disabled={shareDisabled}
              title={
                shareDisabled
                  ? `Document is over ${MAX_SHARE_CHARS.toLocaleString()} characters — Share isn't available for documents this long.`
                  : undefined
              }
              onClick={() => {
                setOpen(false)
                onOpenShare()
              }}
            >
              <span>Share…</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
