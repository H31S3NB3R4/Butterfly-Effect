import { describe, expect, it } from 'vitest'

import { assertExpandable, mergeExpansion, type ExpansionCandidate } from './expansion.js'
import { createValidGraph } from './test-fixtures.js'

const candidates: ExpansionCandidate[] = [
  {
    title: 'Employers change screening practices',
    description: 'Employers may rely more on portfolios and practical interviews.',
    category: 'economic',
    impact: 'medium',
    uncertainty: 'moderate',
    assumptions: ['Employers consider grades less comparable.'],
    explanation: 'Different assessment records may make traditional grade screening less useful.',
  },
  {
    title: 'Accreditation criteria evolve',
    description: 'Accreditors may introduce standards for alternative assessment evidence.',
    category: 'political',
    impact: 'medium',
    uncertainty: 'higher',
    assumptions: ['Accreditors accept non-exam evidence.'],
    explanation: 'New assessment formats may require updated quality standards.',
  },
]

describe('branch expansion', () => {
  it('assigns safe IDs and merges new direct children', () => {
    const graph = createValidGraph()
    const merged = mergeExpansion(graph, 'n7', candidates)
    const newNodes = merged.nodes.slice(graph.nodes.length)
    const newEdges = merged.edges.slice(graph.edges.length)

    expect(merged.nodes).toHaveLength(graph.nodes.length + 2)
    expect(new Set(merged.nodes.map((node) => node.id)).size).toBe(merged.nodes.length)
    expect(newNodes.every((node) => node.depth === 4)).toBe(true)
    expect(newEdges.every((edge) => edge.source === 'n7')).toBe(true)
    expect(newEdges.map((edge) => edge.target)).toEqual(newNodes.map((node) => node.id))
  })

  it('supports two successive leaf expansions through depth 5', () => {
    const first = mergeExpansion(createValidGraph(), 'n7', candidates)
    const firstNewNode = first.nodes.at(-2)!
    const second = mergeExpansion(first, firstNewNode.id, [
      { ...candidates[0], title: 'Portfolio standards emerge' },
      { ...candidates[1], title: 'Interview training expands' },
    ])

    expect(second.nodes).toHaveLength(14)
    expect(second.nodes.slice(-2).every((node) => node.depth === 5)).toBe(true)
  })

  it('rejects duplicate consequence titles', () => {
    const graph = createValidGraph()
    expect(() => mergeExpansion(graph, 'n7', [
      { ...candidates[0], title: graph.nodes[2].title },
      candidates[1],
    ])).toThrow('duplicate consequences')
  })

  it('rejects expansion at depth 5', () => {
    const graph = createValidGraph()
    graph.nodes.push(
      { ...graph.nodes[7], id: 'n10', title: 'Depth four', depth: 4 },
      { ...graph.nodes[7], id: 'n11', title: 'Depth five', depth: 5 },
    )
    graph.edges.push(
      { id: 'e10', source: 'n7', target: 'n10', explanation: 'Continues to depth four.' },
      { id: 'e11', source: 'n10', target: 'n11', explanation: 'Continues to depth five.' },
    )

    expect(() => mergeExpansion(graph, 'n11', candidates)).toThrow('maximum depth')
  })

  it('rejects graphs without room for two consequences', () => {
    const graph = createValidGraph()
    for (let index = 10; index < 34; index += 1) {
      graph.nodes.push({ ...graph.nodes[7], id: `extra-${index}`, title: `Extra ${index}` })
      graph.edges.push({ id: `extra-edge-${index}`, source: 'n4', target: `extra-${index}`, explanation: 'Extra valid branch.' })
    }

    expect(() => assertExpandable(graph, 'n1')).toThrow('expansion limit')
  })
})
