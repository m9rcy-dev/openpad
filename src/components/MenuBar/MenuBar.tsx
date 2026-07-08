/**
 * Top application bar: brand, menus, and global controls.
 * Carries the File menu (open/save), Tools menu (registry-driven), and
 * the theme toggle (see docs/ui-mockup.html for the final layout).
 */
import type { ToolDefinition } from '../../types/tools'
import { FileMenu } from './FileMenu'
import { ToolsMenu } from './ToolsMenu'
import './DropdownMenu.css' // reuses the .menu-trigger button style for Compare
import './MenuBar.css'

export interface MenuBarProps {
  /** Effective theme, used to label the toggle for screen readers. */
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  /** Runs a tool against the active editor. */
  onRunTool: (tool: ToolDefinition) => void
  /** Whether the preview pane is showing. */
  previewVisible: boolean
  onTogglePreview: () => void
  /** Whether the active document has unsaved changes. */
  activeDocumentDirty: boolean
  onOpenFile: () => void
  onSaveFile: () => void
  onSaveFileAs: () => void
  onOpenCompare: () => void
  onOpenShortcuts: () => void
}

export function MenuBar({
  theme,
  onToggleTheme,
  onRunTool,
  previewVisible,
  onTogglePreview,
  activeDocumentDirty,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onOpenCompare,
  onOpenShortcuts,
}: MenuBarProps) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <header className="menu-bar">
      <span className="menu-bar-brand">
        <span className="menu-bar-logo" aria-hidden="true">
          O
        </span>
        OpenPad
      </span>
      <FileMenu
        dirty={activeDocumentDirty}
        onOpen={onOpenFile}
        onSave={onSaveFile}
        onSaveAs={onSaveFileAs}
      />
      <ToolsMenu onRunTool={onRunTool} />
      <button type="button" className="menu-trigger" onClick={onOpenCompare}>
        Compare…
      </button>
      <span className="menu-bar-right">
        <button
          type="button"
          className={previewVisible ? 'menu-bar-button menu-bar-button-active' : 'menu-bar-button'}
          onClick={onTogglePreview}
          aria-pressed={previewVisible}
          aria-label={previewVisible ? 'Hide preview' : 'Show preview'}
          title={previewVisible ? 'Hide preview' : 'Show preview'}
        >
          ◫
        </button>
        <button
          type="button"
          className="menu-bar-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          ◐
        </button>
        <button
          type="button"
          className="menu-bar-button"
          onClick={onOpenShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          ?
        </button>
      </span>
    </header>
  )
}
