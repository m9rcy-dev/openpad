import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadFile } from './download'

describe('downloadFile', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock-url')
  const revokeObjectURL = vi.fn()

  afterEach(() => {
    vi.restoreAllMocks()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('creates an object URL, clicks a download link, and revokes the URL', () => {
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadFile('hello world', 'notes.txt')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const [blob] = createObjectURL.mock.calls[0]
    expect(blob.type).toBe('text/plain;charset=utf-8')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('names the download after the given file name', () => {
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    let downloadedName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedName = this.download
    })

    downloadFile('{}', 'payload.json')

    expect(downloadedName).toBe('payload.json')
  })
})
