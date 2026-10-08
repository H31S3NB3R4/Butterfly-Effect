import { describe, expect, it } from 'vitest'

import type { ScenarioGraph } from '../types/graph'
import { layoutGraph } from './layout'

const graph: ScenarioGraph = {
  scenario: 'What if testing became practical?',
  nodes: [
    { id: 'root', title: 'Root', description: 'Root scenario', depth: 0, category: 'other', impact: 'high', uncertainty: 'lower', assumptions: ['A'] },
    { id: 'a', title: 'A', description: 'First consequence', depth: 1, category: 'social', impact: 'medium', uncertainty: 'moderate', assumptions: ['B'] },
    { id: 'b', title: 'B', description: 'Second consequence', depth: 1, category: 'technology', impact: 'medium', uncertainty: 'moderate', assumptions: ['C'] },
    { id: 'c', title: 'C', description: 'Third consequence', depth: 2, category: 'economic', impact: 'low', uncertainty: 'higher', assumptions: ['D'] },
  ],
  edges: [
    { id: 'e1', source: 'root', target: 'a', explanation: 'Root leads to A.' },
    { id: 'e2', source: 'root', target: 'b', explanation: 'Root leads to B.' },
    { id: 'e3', source: 'a', target: 'c', explanation: 'A leads to C.' },
  ],
}

describe('layoutGraph', () => {
  it('places deeper consequences below their causes deterministically', () => {
    const first = layoutGraph(graph)
    const second = layoutGraph(graph)
    const position = new Map(first.nodes.map((node) => [node.id, node.position]))

    expect(first).toEqual(second)
    expect(position.get('a')!.y).toBeGreaterThan(position.get('root')!.y)
    expect(position.get('b')!.y).toBeGreaterThan(position.get('root')!.y)
    expect(position.get('c')!.y).toBeGreaterThan(position.get('a')!.y)
    expect(first.edges).toHaveLength(3)
  })
})
