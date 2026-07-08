import plantumlEncoder from 'plantuml-encoder'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_PLANTUML_SERVER,
  PLANTUML_SERVER_KEY,
  getPlantUmlServer,
  plantUmlImageUrl,
  setPlantUmlServer,
} from './plantuml'

afterEach(() => {
  window.localStorage.removeItem(PLANTUML_SERVER_KEY)
})

describe('getPlantUmlServer', () => {
  it('defaults to the public plantuml.com SVG endpoint', () => {
    expect(getPlantUmlServer()).toBe(DEFAULT_PLANTUML_SERVER)
  })

  it('returns a configured server without trailing slashes', () => {
    setPlantUmlServer('https://uml.example.com/svg///')
    expect(getPlantUmlServer()).toBe('https://uml.example.com/svg')
  })

  it('clearing the setting restores the default', () => {
    setPlantUmlServer('https://uml.example.com')
    setPlantUmlServer('')
    expect(getPlantUmlServer()).toBe(DEFAULT_PLANTUML_SERVER)
  })
})

describe('plantUmlImageUrl', () => {
  it('builds <server>/<encoded-source>', () => {
    const source = '@startuml\nA -> B: hi\n@enduml'
    const url = plantUmlImageUrl(source)
    expect(url.startsWith(`${DEFAULT_PLANTUML_SERVER}/`)).toBe(true)
    const encoded = url.slice(DEFAULT_PLANTUML_SERVER.length + 1)
    // The encoding is the official PlantUML scheme and must round-trip.
    expect(plantumlEncoder.decode(encoded)).toBe(source)
  })
})
