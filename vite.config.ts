/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite build configuration.
 *
 * `base` controls the public path the app is served from. It defaults to `/`
 * for local development. The GitHub Pages deploy workflow sets `VITE_BASE`
 * to `/<repository-name>/` because project pages are served from a subpath
 * (https://<user>.github.io/<repository-name>/). vite-plugin-pwa reads this
 * same `base` to compute the service worker's scope and start_url, so the
 * PWA installs correctly from a Pages subpath too.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') so App.tsx controls the update UX via
      // src/pwa/UpdatePrompt.tsx instead of silently reloading.
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'OpenPad — online notepad',
        short_name: 'OpenPad',
        description:
          'Offline-first notepad with text transform tools and Markdown/Mermaid/PlantUML preview.',
        theme_color: '#2e8b46',
        background_color: '#f6f7f5',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything the build emits, including the lazy-loaded
        // Mermaid chunk — that's what lets diagrams still render offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    // localStorage (used by the theme hook) only exists on real origins,
    // not on jsdom's default about:blank.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    // Playwright owns e2e/**; keep it out of Vitest's default *.spec.ts pickup.
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/test/**',
        'src/**/*.d.ts',
        // App.tsx is thin orchestration wiring (menu callbacks, keyboard
        // shortcuts, drag-and-drop) already exercised end-to-end by the
        // Playwright suite in e2e/ — unit-testing every wiring branch
        // here would just restate what the hooks/components it calls
        // already cover in their own tests.
        'src/App.tsx',
      ],
      thresholds: {
        // A few points below the actual achieved coverage (~96/89/95/97 at
        // time of writing) — enough margin that a normal small change
        // doesn't fail CI, tight enough to catch a real regression.
        lines: 92,
        functions: 90,
        branches: 85,
        statements: 92,
        // The transform tools are the app's core logic and must be
        // exhaustively tested — every branch, every pure function.
        'src/tools/**': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
})
