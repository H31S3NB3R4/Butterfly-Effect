import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { AppError } from './errors.js'
import { scenarioGraphSchema } from './graph-validation.js'
import { categorySchema, impactSchema, uncertaintySchema, type ScenarioGraph } from './schemas.js'

export const expansionCandidateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  category: categorySchema,
  impact: impactSchema,
  uncertainty: uncertaintySchema,
  assumptions: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  explanation: z.string().trim().min(1).max(600),
})

export const expansionCandidatesSchema = z.array(expansionCandidateSchema).min(2).max(3)
export type ExpansionCandidate = z.infer<typeof expansionCandidateSchema>

const normalizedTitle = (title: string) => title.trim().toLocaleLowerCase()

export const assertExpandable = (graph: ScenarioGraph, selectedNodeId: string) => {
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId)
  if (!selectedNode || selectedNode.depth === 0) {
    throw new AppError(400, 'INVALID_SELECTION', 'Select a non-root consequence to expand.')
  }
  if (selectedNode.depth >= 5) {
    throw new AppError(409, 'DEPTH_LIMIT_REACHED', 'This branch has reached the maximum depth of 5.')
  }
  if (graph.nodes.length > 33) {
    throw new AppError(409, 'GRAPH_LIMIT_REACHED', 'The graph has reached its expansion limit.')
  }
  return selectedNode
}

export const mergeExpansion = (
  graph: ScenarioGraph,
  selectedNodeId: string,
  candidates: ExpansionCandidate[],
): ScenarioGraph => {
  const validatedGraph = scenarioGraphSchema.parse(graph)
  const selectedNode = assertExpandable(validatedGraph, selectedNodeId)
  const capacity = 35 - validatedGraph.nodes.length
  const acceptedCandidates = expansionCandidatesSchema.parse(candidates).slice(0, capacity)

  if (acceptedCandidates.length < 2) {
    throw new AppError(409, 'GRAPH_LIMIT_REACHED', 'The graph has reached its expansion limit.')
  }

  const titles = new Set(validatedGraph.nodes.map((node) => normalizedTitle(node.title)))
  for (const candidate of acceptedCandidates) {
    const title = normalizedTitle(candidate.title)
    if (titles.has(title)) {
      throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned duplicate consequences.')
    }
    titles.add(title)
  }

  const newNodes = acceptedCandidates.map((candidate) => ({
    id: `n_${randomUUID()}`,
    title: candidate.title,
    description: candidate.description,
    depth: selectedNode.depth + 1,
    category: candidate.category,
    impact: candidate.impact,
    uncertainty: candidate.uncertainty,
    assumptions: candidate.assumptions,
  }))
  const newEdges = newNodes.map((node, index) => ({
    id: `e_${randomUUID()}`,
    source: selectedNode.id,
    target: node.id,
    explanation: acceptedCandidates[index].explanation,
  }))

  return scenarioGraphSchema.parse({
    ...validatedGraph,
    nodes: [...validatedGraph.nodes, ...newNodes],
    edges: [...validatedGraph.edges, ...newEdges],
  })
}

export const getExpansionContext = (graph: ScenarioGraph, selectedNodeId: string) => {
  const selected = assertExpandable(graph, selectedNodeId)
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const incomingByTarget = new Map(graph.edges.map((edge) => [edge.target, edge.source]))
  const ancestors = []
  let currentId: string | undefined = selected.id

  while (currentId) {
    const node = nodesById.get(currentId)
    if (!node) break
    ancestors.unshift({ title: node.title, depth: node.depth })
    currentId = incomingByTarget.get(currentId)
  }

  return {
    scenario: graph.scenario,
    selected: {
      title: selected.title,
      description: selected.description,
      depth: selected.depth,
      assumptions: selected.assumptions,
    },
    ancestorChain: ancestors,
    existingConsequenceTitles: graph.nodes.map((node) => node.title),
    requestedCount: Math.min(3, 35 - graph.nodes.length),
  }
}
