import { expect, test, type Page } from '@playwright/test'

/**
 * End-to-end smoke tests against a production build. These exercise the
 * golden path across milestones — the unit/component suite (`npm test`)
 * covers logic and edge cases in isolation; this suite proves the pieces
 * actually work wired together in a real browser.
 */

/** Every test starts from a clean IndexedDB workspace. */
async function resetWorkspace(page: Page) {
  await page.goto('/')
  await page.evaluate(() => indexedDB.deleteDatabase('keyval-store'))
  await page.reload()
  await expect(page.getByTestId('editor-pane')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await resetWorkspace(page)
})

test('loads with a single empty untitled tab', async ({ page }) => {
  await expect(page.getByRole('tab', { name: /untitled-1/ })).toBeVisible()
  await expect(page.getByTestId('status-bar')).toContainText('0 chars')
})

test('typing autosaves and survives a reload', async ({ page }) => {
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('persisted across reload')
  await expect(page.getByTestId('status-bar')).toContainText('autosaved')

  await page.reload()
  await expect(page.getByTestId('editor-pane')).toContainText('persisted across reload')
})

test('JSON format tool transforms the document via the Tools menu', async ({ page }) => {
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('{"b":2,"a":1}')

  await page.getByRole('button', { name: 'Tools' }).click()
  await page.getByRole('menuitem', { name: 'Format' }).first().click()

  await expect(page.getByTestId('editor-pane')).toContainText('"a": 1')
  await expect(page.getByTestId('status-bar')).toContainText('applied to document')
})

test('the ? shortcut opens the keyboard-shortcuts dialog, but not while typing', async ({
  page,
}) => {
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Typing a literal '?' into the document must not reopen it.
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('what?')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByTestId('editor-pane')).toContainText('what?')
})

test('JSON format also runs via its keyboard shortcut', async ({ page }) => {
  // CodeMirror's keymap dispatch isn't reliably simulated in jsdom, so
  // this real-keyboard path is verified here rather than in a unit test.
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('{"b":2,"a":1}')
  await page.keyboard.press('ControlOrMeta+Shift+F')

  await expect(page.getByTestId('editor-pane')).toContainText('"a": 1')
})

test('Base64 encode round-trips through decode', async ({ page }) => {
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('hello world')

  await page.getByRole('button', { name: 'Tools' }).click()
  await page.getByRole('menuitem', { name: 'Base64 encode' }).click()
  await expect(page.getByTestId('editor-pane')).toContainText('aGVsbG8gd29ybGQ=')

  await page.getByRole('button', { name: 'Tools' }).click()
  await page.getByRole('menuitem', { name: 'Base64 decode' }).click()
  await expect(page.getByTestId('editor-pane')).toContainText('hello world')
})

test('Markdown preview renders a heading and a Mermaid diagram', async ({ page }) => {
  await page.getByRole('tab', { name: /untitled-1/ }).dblclick()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('notes.md')
  await page.keyboard.press('Enter')

  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('# Hello\n\n```mermaid\nflowchart LR\nA-->B\n```')

  await expect(
    page.getByTestId('preview-pane').getByRole('heading', { name: 'Hello' }),
  ).toBeVisible()
  await expect(page.getByTestId('preview-pane').locator('svg')).toBeVisible({ timeout: 10_000 })
})

test('compare mode shows a side-by-side diff between two tabs', async ({ page }) => {
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('alpha\nbeta')

  await page.getByRole('button', { name: 'New document' }).click()
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('alpha\nBETA')

  await page.getByRole('button', { name: 'Compare…' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'untitled-1', exact: true }).click()

  await expect(page.getByText(/Compare: untitled-2.*untitled-1/)).toBeVisible()
  await expect(page.getByTestId('compare-panes').locator('.cm-editor')).toHaveCount(2)

  await page.getByRole('button', { name: /Close/ }).click()
  await expect(page.getByTestId('editor-pane')).toBeVisible()
  await expect(page.getByRole('tab', { name: /untitled-1/ })).toBeVisible()
  await expect(page.getByRole('tab', { name: /untitled-2/ })).toBeVisible()
})

test('offline: the app still loads with the network cut off', async ({ page, context }) => {
  // Service worker install/activate/control can take a few seconds,
  // more under parallel test workers sharing one preview server. A
  // registration reporting "active" doesn't guarantee this page is
  // controlled yet — reload once more and wait for that too, or an
  // offline reload can race ahead of the SW and hit the dead network.
  test.setTimeout(45_000)
  await page.waitForTimeout(3000)
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 30_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByTestId('editor-pane')).toBeVisible()
  await page.getByTestId('editor-pane').click()
  await page.keyboard.type('works offline')
  await expect(page.getByTestId('editor-pane')).toContainText('works offline')

  await context.setOffline(false)
})
