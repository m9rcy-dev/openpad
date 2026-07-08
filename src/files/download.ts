/**
 * Download-a-Blob fallback, used when the File System Access API is
 * unavailable (Firefox, Safari) or for the very first save of a new
 * document on browsers without a native "Save As" picker.
 */

/**
 * Triggers a browser download of `content` as `fileName`. Synchronous
 * and always "succeeds" from the page's perspective — the browser owns
 * the rest of the download UI.
 */
export function downloadFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
