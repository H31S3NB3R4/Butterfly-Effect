import { z } from 'zod'

export const consequenceNodeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  depth: z.number().int().min(0).max(5),
  category: z.enum(['economic', 'social', 'technology', 'environment', 'political', 'other']),
  impact: z.enum(['low', 'medium', 'high']),
  uncertainty: z.enum(['lower', 'moderate', 'higher']),
  assumptions: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
})

export const causalEdgeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  source: z.string().trim().min(1).max(64),
  target: z.string().trim().min(1).max(64),
  explanation: z.string().trim().min(1).max(600),
})

export const scenarioGraphSchema = z.object({
  scenario: z.string().trim().min(1).max(500),
  nodes: z.array(consequenceNodeSchema).min(2).max(35),
  edges: z.array(causalEdgeSchema).min(1).max(70),
}).superRefine((graph, context) => {
  const nodeIds = new Set(graph.nodes.map((node) => node.id))
  const edgeIds = new Set(graph.edges.map((edge) => edge.id))
  if (nodeIds.size !== graph.nodes.length || edgeIds.size !== graph.edges.length) {
    context.addIssue({ code: 'custom', message: 'Graph IDs must be unique' })
  }
  const rootNodes = graph.nodes.filter((node) => node.depth === 0)
  if (rootNodes.length !== 1) {
    context.addIssue({ code: 'custom', message: 'Graph must have one root' })
    return
  }
  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const children = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target || edge.source === edge.target || target.depth !== source.depth + 1) {
      context.addIssue({ code: 'custom', message: 'Graph has an invalid edge' })
      continue
    }
    children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target])
  }
  const reached = new Set<string>()
  const queue = [rootNodes[0].id]
  for (let index = 0; index < queue.length; index += 1) {
    const id = queue[index]
    if (reached.has(id)) continue
    reached.add(id)
    queue.push(...(children.get(id) ?? []))
  }
  if (reached.size !== graph.nodes.length) {
    context.addIssue({ code: 'custom', message: 'Every graph node must be reachable' })
  }
})

export type ConsequenceNode = z.infer<typeof consequenceNodeSchema>
export type CausalEdge = z.infer<typeof causalEdgeSchema>
export type ScenarioGraph = z.infer<typeof scenarioGraphSchema>
