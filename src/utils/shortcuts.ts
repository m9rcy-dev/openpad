/**
 * Keyboard-shortcut display formatting.
 */

function isMacPlatform(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform)
}

/**
 * Renders a CodeMirror shortcut (`Mod-Shift-f`) for display:
 * `⌘⇧F` on macOS, `Ctrl+Shift+F` elsewhere.
 *
 * @example
 * formatShortcut('Mod-Shift-f') // 'Ctrl+Shift+F' (on Windows/Linux)
 */
export function formatShortcut(shortcut: string): string {
  const isMac = isMacPlatform()
  const parts = shortcut.split('-')
  // split() on a non-empty string always yields at least one element.
  const key = parts[parts.length - 1].toUpperCase()
  const mods = parts.slice(0, -1)
  if (isMac) {
    const symbols: Record<string, string> = { Mod: '⌘', Shift: '⇧', Alt: '⌥', Ctrl: '⌃' }
    return mods.map((mod) => symbols[mod] ?? mod).join('') + key
  }
  const names: Record<string, string> = { Mod: 'Ctrl' }
  return [...mods.map((mod) => names[mod] ?? mod), key].join('+')
}

/**
 * Redo's key binding differs by platform (see `@codemirror/commands`'
 * `historyKeymap`): `Cmd+Shift+Z` on macOS, `Ctrl+Y` elsewhere. Pass the
 * result straight to {@link formatShortcut} for display.
 *
 * @example
 * formatShortcut(redoShortcut()) // '⌘⇧Z' on macOS, 'Ctrl+Y' elsewhere
 */
export function redoShortcut(): string {
  return isMacPlatform() ? 'Mod-Shift-z' : 'Mod-y'
}
