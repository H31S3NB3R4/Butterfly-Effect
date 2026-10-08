import { describe, expect, it } from 'vitest'

import { analyzedScenarioGraphSchema, scenarioGraphSchema } from './graph-validation.js'
import { createValidGraph } from './test-fixtures.js'

describe('graph validation', () => {
  it('accepts a connected three-level initial graph', () => {
    expect(analyzedScenarioGraphSchema.safeParse(createValidGraph()).success).toBe(true)
  })

  it.each([
    {
      name: 'duplicate node IDs',
      mutate: () => {
        const graph = createValidGraph()
        graph.nodes[1].id = graph.nodes[0].id
        return graph
      },
    },
    {
      name: 'dangling edge endpoints',
      mutate: () => {
        const graph = createValidGraph()
        graph.edges[0].target = 'missing'
        return graph
      },
    },
    {
      name: 'self-loops',
      mutate: () => {
        const graph = createValidGraph()
        graph.edges[0].target = graph.edges[0].source
        return graph
      },
    },
    {
      name: 'cycles',
      mutate: () => {
        const graph = createValidGraph()
        graph.edges.push({ id: 'cycle', source: 'n7', target: 'n1', explanation: 'Invalid cycle.' })
        return graph
      },
    },
    {
      name: 'unreachable nodes',
      mutate: () => {
        const graph = createValidGraph()
        graph.edges = graph.edges.filter((edge) => edge.target !== 'n7')
        return graph
      },
    },
    {
      name: 'invalid depth progression',
      mutate: () => {
        const graph = createValidGraph()
        graph.nodes[4].depth = 3
        return graph
      },
    },
  ])('rejects $name', ({ mutate }) => {
    expect(scenarioGraphSchema.safeParse(mutate()).success).toBe(false)
  })

  it('enforces the initial graph size cap', () => {
    const graph = createValidGraph()
    for (let index = 10; index < 17; index += 1) {
      graph.nodes.push({
        ...graph.nodes[7],
        id: `n${index}`,
        title: `Consequence ${index}`,
      })
      graph.edges.push({
        id: `e${index}`,
        source: 'n4',
        target: `n${index}`,
        explanation: 'Additional consequence.',
      })
    }
    expect(analyzedScenarioGraphSchema.safeParse(graph).success).toBe(false)
  })
})
