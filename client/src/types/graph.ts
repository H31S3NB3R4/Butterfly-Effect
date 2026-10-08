import { z } from 'zod'

export const consequenceNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  depth: z.number().int().min(0).max(5),
  category: z.enum(['economic', 'social', 'technology', 'environment', 'political', 'other']),
  impact: z.enum(['low', 'medium', 'high']),
  uncertainty: z.enum(['lower', 'moderate', 'higher']),
  assumptions: z.array(z.string()),
})

export const causalEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  explanation: z.string(),
})

export const scenarioGraphSchema = z.object({
  scenario: z.string(),
  nodes: z.array(consequenceNodeSchema),
  edges: z.array(causalEdgeSchema),
})

export type ConsequenceNode = z.infer<typeof consequenceNodeSchema>
export type CausalEdge = z.infer<typeof causalEdgeSchema>
export type ScenarioGraph = z.infer<typeof scenarioGraphSchema>
