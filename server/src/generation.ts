import { z } from 'zod'

import { AppError } from './errors.js'
import { analyzedScenarioGraphSchema } from './graph-validation.js'
import { causalEdgeSchema, consequenceNodeSchema, type ScenarioGraph } from './schemas.js'

const contentSchema = consequenceNodeSchema.omit({ id: true, depth: true }).strict()
const stepSchema = contentSchema.extend({ explanation: causalEdgeSchema.shape.explanation })

// The model supplies causal content in order; graph bookkeeping belongs to the server.
export const generatedChainsSchema = z.object({
  root: contentSchema,
  branches: z.array(z.object({ steps: z.array(stepSchema).length(3) }).strict()).length(3),
}).strict()

export const generationResponseJsonSchema = z.toJSONSchema(generatedChainsSchema)
delete generationResponseJsonSchema.$schema

export const parseGeneratedGraph = (text: string | undefined, scenario: string): ScenarioGraph => {
  if (!text) throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned an empty response. Please retry.')

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (cause) {
    throw new SyntaxError('The AI response was not valid JSON.', { cause })
  }

  const result = generatedChainsSchema.safeParse(parsed)
  if (!result.success) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned incomplete consequences. Please retry.', { cause: result.error })
  }

  const graph: ScenarioGraph = {
    scenario,
    nodes: [{ ...result.data.root, id: 'root', depth: 0 }],
    edges: [],
  }
  result.data.branches.forEach((branch, branchIndex) => {
    let parentId = 'root'
    branch.steps.forEach(({ explanation, ...content }, stepIndex) => {
      const id = `b${branchIndex + 1}-d${stepIndex + 1}`
      graph.nodes.push({ ...content, id, depth: stepIndex + 1 })
      graph.edges.push({ id: `e-${id}`, source: parentId, target: id, explanation })
      parentId = id
    })
  })

  return analyzedScenarioGraphSchema.parse(graph)
}
