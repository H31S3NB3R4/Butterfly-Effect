import type { ScenarioGraph } from './schemas.js'

export const createValidGraph = (): ScenarioGraph => {
  const depths = [0, 1, 1, 1, 2, 2, 2, 3, 3, 3]
  const parents = ['', 'n0', 'n0', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']

  return {
    scenario: 'What if universities stopped using written exams?',
    nodes: depths.map((depth, index) => ({
      id: `n${index}`,
      title: index === 0 ? 'Universities stop written exams' : `Consequence ${index}`,
      description: `A plausible conditional effect at depth ${depth}.`,
      depth,
      category: index % 2 === 0 ? 'social' : 'technology',
      impact: 'medium',
      uncertainty: 'moderate',
      assumptions: ['Institutions adopt workable alternatives.'],
    })),
    edges: parents.slice(1).map((source, index) => ({
      id: `e${index + 1}`,
      source,
      target: `n${index + 1}`,
      explanation: 'This outcome may contribute to the next consequence.',
    })),
  }
}
