/**
 * Service-worker lifecycle banner: tells the user once the app is cached
 * for offline use, and offers a one-click reload when a new version has
 * been installed in the background (registerType: 'prompt' in
 * vite.config.ts — we control this UX rather than silently reloading
 * out from under the user, who may have unsaved edits).
 *
 * Renders nothing in dev (the service worker is only built for
 * production) and nothing once dismissed.
 */
import { useRegisterSW } from 'virtual:pwa-register/react'
import './UpdatePrompt.css'

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) {
    return null
  }

  const dismiss = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="update-prompt" role="status">
      <span>
        {needRefresh
          ? 'A new version of OpenPad is available.'
          : 'OpenPad is ready to work offline.'}
      </span>
      {needRefresh && (
        <button
          type="button"
          className="update-prompt-action"
          onClick={() => {
            void updateServiceWorker(true)
          }}
        >
          Reload
        </button>
      )}
      <button
        type="button"
        className="update-prompt-dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
