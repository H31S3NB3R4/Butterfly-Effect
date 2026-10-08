import { z } from 'zod'

import { scenarioGraphShapeSchema, type ScenarioGraph } from './schemas.js'

export type GraphIssue = {
  path: Array<string | number>
  message: string
}

export const findGraphIssues = (graph: ScenarioGraph): GraphIssue[] => {
  const issues: GraphIssue[] = []
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()

  graph.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      issues.push({ path: ['nodes', index, 'id'], message: `Duplicate node id: ${node.id}` })
    }
    nodeIds.add(node.id)
  })

  graph.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      issues.push({ path: ['edges', index, 'id'], message: `Duplicate edge id: ${edge.id}` })
    }
    edgeIds.add(edge.id)

    if (edge.source === edge.target) {
      issues.push({ path: ['edges', index], message: 'Self-loops are not allowed' })
    }
    if (!nodeIds.has(edge.source)) {
      issues.push({ path: ['edges', index, 'source'], message: `Unknown source: ${edge.source}` })
    }
    if (!nodeIds.has(edge.target)) {
      issues.push({ path: ['edges', index, 'target'], message: `Unknown target: ${edge.target}` })
    }
  })

  const roots = graph.nodes.filter((node) => node.depth === 0)
  if (roots.length !== 1) {
    issues.push({ path: ['nodes'], message: 'Graph must contain exactly one depth-0 root' })
    return issues
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const adjacency = new Map<string, string[]>()
  graph.edges.forEach((edge, index) => {
    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) return

    if (target.depth !== source.depth + 1) {
      issues.push({
        path: ['edges', index],
        message: 'Edges must advance exactly one causal depth',
      })
    }
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target])
  })

  const visited = new Set<string>()
  const active = new Set<string>()
  const visit = (id: string) => {
    if (active.has(id)) {
      issues.push({ path: ['edges'], message: 'Graph must not contain cycles' })
      return
    }
    if (visited.has(id)) return
    active.add(id)
    for (const target of adjacency.get(id) ?? []) visit(target)
    active.delete(id)
    visited.add(id)
  }
  visit(roots[0].id)

  graph.nodes.forEach((node, index) => {
    if (!visited.has(node.id)) {
      issues.push({ path: ['nodes', index], message: `Node is unreachable from root: ${node.id}` })
    }
  })

  return issues
}

const withGraphIntegrity = <T extends z.ZodType<ScenarioGraph>>(schema: T) =>
  schema.superRefine((graph, context) => {
    for (const issue of findGraphIssues(graph)) {
      context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  })

export const scenarioGraphSchema = withGraphIntegrity(scenarioGraphShapeSchema)

export const analyzedScenarioGraphSchema = withGraphIntegrity(
  scenarioGraphShapeSchema.superRefine((graph, context) => {
    if (graph.nodes.length < 10 || graph.nodes.length > 16) {
      context.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'Initial graph must contain one root and 9–15 consequences',
      })
    }
    for (const depth of [1, 2, 3]) {
      if (!graph.nodes.some((node) => node.depth === depth)) {
        context.addIssue({
          code: 'custom',
          path: ['nodes'],
          message: `Initial graph must include depth ${depth}`,
        })
      }
    }
    if (graph.nodes.some((node) => node.depth > 3)) {
      context.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'Initial graph cannot exceed depth 3',
      })
    }
  }),
)
