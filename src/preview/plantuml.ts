/**
 * PlantUML support.
 *
 * PlantUML is a Java program — there is no practical way to run it in
 * the browser. Diagrams are therefore rendered by a PlantUML *server*:
 * the diagram source is deflate+Base64-encoded into the URL of an <img>
 * (that is the official PlantUML URL scheme, produced here by
 * `plantuml-encoder`). The default is the public plantuml.com server;
 * users can point at a self-hosted one, which is stored in localStorage.
 *
 * This is the app's only network-dependent feature. Offline, the
 * preview shows the diagram source plus a "network required" notice —
 * see PreviewPane.
 */
import plantumlEncoder from 'plantuml-encoder'

/** localStorage key for a custom PlantUML server base URL. */
export const PLANTUML_SERVER_KEY = 'openpad:plantuml-server'

/** Public default server; must render SVG at `<base>/<encoded>`. */
export const DEFAULT_PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/svg'

/** The configured server base URL (no trailing slash). */
export function getPlantUmlServer(): string {
  const stored = window.localStorage.getItem(PLANTUML_SERVER_KEY)?.trim()
  if (stored === undefined || stored === '') {
    return DEFAULT_PLANTUML_SERVER
  }
  return stored.replace(/\/+$/, '')
}

/** Persists a custom server base URL; empty/undefined restores default. */
export function setPlantUmlServer(url: string | undefined): void {
  if (url === undefined || url.trim() === '') {
    window.localStorage.removeItem(PLANTUML_SERVER_KEY)
  } else {
    window.localStorage.setItem(PLANTUML_SERVER_KEY, url.trim())
  }
}

/**
 * Builds the image URL that renders the given PlantUML source.
 *
 * @example
 * plantUmlImageUrl('A -> B')
 * // 'https://www.plantuml.com/plantuml/svg/<encoded>'
 */
export function plantUmlImageUrl(source: string): string {
  return `${getPlantUmlServer()}/${plantumlEncoder.encode(source)}`
}
