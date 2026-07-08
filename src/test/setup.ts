/**
 * Vitest global setup, referenced from vite.config.ts (`test.setupFiles`).
 *
 * Registers @testing-library/jest-dom matchers and fills the DOM API gaps
 * jsdom has that CodeMirror and the theme hook rely on. These stubs only
 * exist in the test environment; real browsers provide the real APIs.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library's automatic DOM cleanup only registers itself when test
// globals are enabled; we run with `globals: false`, so register it here.
afterEach(() => {
  cleanup()
})

// --- CodeMirror requirements ------------------------------------------
// CodeMirror measures text with Range client rects and observes element
// resizing; jsdom implements neither. Zero-size answers are fine for
// tests, which assert on content and behavior, not pixel geometry.

if (typeof Range.prototype.getClientRects !== 'function') {
  Range.prototype.getClientRects = function getClientRects(): DOMRectList {
    return [] as unknown as DOMRectList
  }
  Range.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
    return new DOMRect(0, 0, 0, 0)
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}

// --- Storage -------------------------------------------------------------
// The localStorage exposed in this environment is a method-less stub: Node
// 24+ ships an experimental webstorage global (broken without a
// --localstorage-file flag) that shadows jsdom's implementation. Replace it
// with a small in-memory Storage so code under test gets real semantics.

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
})

// --- Theme hook requirement -------------------------------------------
// jsdom has no matchMedia; report "light" and never notify.

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener(): void {},
      removeEventListener(): void {},
      addListener(): void {},
      removeListener(): void {},
      dispatchEvent(): boolean {
        return false
      },
    }) as MediaQueryList
}
