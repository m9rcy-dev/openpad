/**
 * The Tools dropdown: renders the tool registry grouped by category.
 * Purely registry-driven — new tools appear here with no UI changes.
 */
import { useRef, useState } from 'react'
import type { ToolDefinition } from '../../types/tools'
import { TOOL_CATEGORIES, toolsByCategory } from '../../tools/registry'
import { formatShortcut } from '../../utils/shortcuts'
import { useMenuClose } from './useMenuClose'
import './DropdownMenu.css'

export interface ToolsMenuProps {
  onRunTool: (tool: ToolDefinition) => void
}

export function ToolsMenu({ onRunTool }: ToolsMenuProps) {
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
        </div>
      )}
    </div>
  )
}
