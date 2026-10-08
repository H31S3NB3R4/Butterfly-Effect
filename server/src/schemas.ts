import { z } from 'zod'

export const impactSchema = z.enum(['low', 'medium', 'high'])
export const uncertaintySchema = z.enum(['lower', 'moderate', 'higher'])
export const categorySchema = z.enum([
  'economic',
  'social',
  'technology',
  'environment',
  'political',
  'other',
])

export const consequenceNodeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  depth: z.number().int().min(0).max(5),
  category: categorySchema,
  impact: impactSchema,
  uncertainty: uncertaintySchema,
  assumptions: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
})

export const causalEdgeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  source: z.string().trim().min(1).max(64),
  target: z.string().trim().min(1).max(64),
  explanation: z.string().trim().min(1).max(280),
})

export const scenarioGraphShapeSchema = z.object({
  scenario: z.string().trim().min(1).max(500),
  nodes: z.array(consequenceNodeSchema).min(2).max(35),
  edges: z.array(causalEdgeSchema).min(1).max(70),
})

export const analyzeInputSchema = z.object({
  scenario: z.string().trim().min(1).max(500),
}).strict()

export const expandInputSchema = z.object({
  graph: scenarioGraphShapeSchema,
  selectedNodeId: z.string().trim().min(1).max(64),
}).strict()

export type ConsequenceNode = z.infer<typeof consequenceNodeSchema>
export type CausalEdge = z.infer<typeof causalEdgeSchema>
export type ScenarioGraph = z.infer<typeof scenarioGraphShapeSchema>
export type AnalyzeInput = z.infer<typeof analyzeInputSchema>
export type ExpandInput = z.infer<typeof expandInputSchema>
