import { describe, expect, it } from 'vitest'

import { parseGeneratedGraph } from './generation.js'
import { analyzedScenarioGraphSchema } from './graph-validation.js'

const content = {
  title: 'Scenario', description: 'A conditional effect.', category: 'social',
  impact: 'medium', uncertainty: 'moderate', assumptions: ['Conditions remain similar.'],
}
const chains = () => ({
  root: { ...content },
  branches: Array.from({ length: 3 }, (_, branch) => ({
    steps: Array.from({ length: 3 }, (_, step) => ({
      ...content, title: `Branch ${branch} step ${step}`, explanation: `Cause ${branch}/${step}`,
    })),
  })),
})

describe('model chains to validated graph', () => {
  it('preserves model content and causal ordering while assigning valid unique graph references', () => {
    const input = chains()
    const graph = parseGeneratedGraph(JSON.stringify(input), 'Original user question')
    expect(analyzedScenarioGraphSchema.safeParse(graph).success).toBe(true)
    expect(graph.scenario).toBe('Original user question')
    expect(graph.nodes).toHaveLength(10)
    expect(graph.edges).toHaveLength(9)
    input.branches.forEach((branch, branchIndex) => {
      branch.steps.forEach(({ explanation, ...node }, stepIndex) => {
        const id = `b${branchIndex + 1}-d${stepIndex + 1}`
        expect(graph.nodes.find((item) => item.id === id)).toEqual({ ...node, id, depth: stepIndex + 1 })
        expect(graph.edges.find((edge) => edge.target === id)).toMatchObject({
          source: stepIndex === 0 ? 'root' : `b${branchIndex + 1}-d${stepIndex}`, explanation,
        })
      })
    })
  })

  it('rejects malformed JSON', () => {
    expect(() => parseGeneratedGraph('{', 'Question')).toThrow(SyntaxError)
  })

  it.each(['missing branch', 'missing step', 'long title', 'invalid category', 'missing explanation'])('rejects %s without filling in invented content', (kind) => {
    const input = chains()
    if (kind === 'missing branch') input.branches.pop()
    if (kind === 'missing step') input.branches[0].steps.pop()
    if (kind === 'long title') input.root.title = 'x'.repeat(121)
    if (kind === 'invalid category') input.root.category = 'unknown'
    if (kind === 'missing explanation') input.branches[0].steps[0].explanation = ''
    expect(() => parseGeneratedGraph(JSON.stringify(input), 'Question')).toThrow('incomplete consequences')
  })
})
