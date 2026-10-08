import { describe, expect, it } from 'vitest'

import type { ScenarioGraph } from '../types/graph'
import {
  closeGraph,
  deleteSavedGraph,
  emptyLibrary,
  getActiveGraph,
  openSavedGraph,
  persistLibrary,
  readLibrary,
  saveGraph,
} from './scenarios'

const graph: ScenarioGraph = {
  scenario: 'What if a major city banned private cars?',
  nodes: [
    { id: 'root', title: 'Car ban', description: 'A city bans private cars.', depth: 0, category: 'political', impact: 'high', uncertainty: 'lower', assumptions: ['The ban is enforced.'] },
    { id: 'n1', title: 'Transit demand rises', description: 'More people use transit.', depth: 1, category: 'social', impact: 'high', uncertainty: 'moderate', assumptions: ['Transit remains available.'] },
  ],
  edges: [{ id: 'e1', source: 'root', target: 'n1', explanation: 'Travellers need another option.' }],
}

const memoryStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('scenario library', () => {
  it('restores an expanded graph after saving and reopening', () => {
    const storage = memoryStorage()
    const first = saveGraph(emptyLibrary(), graph)
    const expanded: ScenarioGraph = {
      ...graph,
      nodes: [...graph.nodes, { ...graph.nodes[1], id: 'n2', title: 'Transit investment follows', depth: 2 }],
      edges: [...graph.edges, { id: 'e2', source: 'n1', target: 'n2', explanation: 'Demand encourages investment.' }],
    }
    const saved = saveGraph(first, expanded, first.activeId)
    persistLibrary(saved, storage)

    const restored = readLibrary(storage)
    expect(restored.records).toHaveLength(1)
    expect(getActiveGraph(restored)).toEqual(expanded)
    expect(getActiveGraph(closeGraph(restored))).toBeNull()
    expect(getActiveGraph(openSavedGraph(closeGraph(restored), saved.activeId!))).toEqual(expanded)
  })

  it('deletes a saved scenario', () => {
    const saved = saveGraph(emptyLibrary(), graph)
    const deleted = deleteSavedGraph(saved, saved.activeId!)
    expect(deleted.records).toHaveLength(0)
    expect(deleted.activeId).toBeNull()
  })

  it('ignores corrupted or invalid stored graphs', () => {
    const storage = memoryStorage()
    storage.setItem('butterfly-effect:scenarios:v1', '{bad json')
    expect(readLibrary(storage)).toEqual(emptyLibrary())

    const saved = saveGraph(emptyLibrary(), graph)
    const invalid = structuredClone(saved)
    invalid.records[0].graph.edges[0].target = 'missing'
    persistLibrary(invalid, storage)
    expect(readLibrary(storage)).toEqual(emptyLibrary())
  })
})
