/**
 * The Theme picker: three curated accent presets plus a native color
 * input for anything else. Selecting a preset or picking a custom color
 * applies immediately (see `useAccentTheme`) — this dialog has no
 * Apply/OK step and stays open after a pick so choices can be compared,
 * closing only via Close / Escape / backdrop click, like
 * `ShortcutsDialog`.
 */
import { useEffect, useRef } from 'react'
import { ACCENT_PRESETS, type AccentPresetId } from '../../theme/accentPresets'
import type { AccentChoice } from '../../theme/useAccentTheme'
import './ThemeDialog.css'

export interface ThemeDialogProps {
  choice: AccentChoice
  onSelectPreset: (id: AccentPresetId) => void
  onSelectCustom: (hex: string) => void
  onClose: () => void
}

export function ThemeDialog({ choice, onSelectPreset, onSelectCustom, onClose }: ThemeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

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

  const customHex = choice.type === 'custom' ? choice.hex : undefined

  return (
    <div className="theme-dialog-backdrop" onClick={onClose}>
      <div
        className="theme-dialog"
        role="dialog"
        aria-label="Theme"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="theme-dialog-header">
          <h2 className="theme-dialog-title">Theme</h2>
          <button type="button" className="theme-dialog-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="theme-dialog-grid">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="theme-swatch"
              aria-pressed={choice.type === 'preset' && choice.id === preset.id}
              onClick={() => onSelectPreset(preset.id)}
            >
              <span
                className="theme-swatch-color"
                style={{ background: preset.swatch }}
                aria-hidden="true"
              />
              <span className="theme-swatch-label">{preset.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="theme-swatch"
            aria-pressed={choice.type === 'custom'}
            onClick={() => colorInputRef.current?.click()}
          >
            <span
              className={
                customHex === undefined
                  ? 'theme-swatch-color theme-swatch-custom'
                  : 'theme-swatch-color'
              }
              style={customHex === undefined ? undefined : { background: customHex }}
              aria-hidden="true"
            />
            <span className="theme-swatch-label">Custom…</span>
          </button>
        </div>
        <input
          ref={colorInputRef}
          type="color"
          className="theme-dialog-color-input"
          value={customHex ?? '#000000'}
          onChange={(event) => onSelectCustom(event.target.value)}
          aria-label="Custom accent color"
        />
      </div>
    </div>
  )
}
