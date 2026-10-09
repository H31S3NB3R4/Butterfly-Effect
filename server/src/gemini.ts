import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai'
import { z } from 'zod'

import { AppError } from './errors.js'
import { expansionCandidatesSchema, getExpansionContext, mergeExpansion } from './expansion.js'
import { generationResponseJsonSchema, parseGeneratedGraph } from './generation.js'
import type { ScenarioGraph } from './schemas.js'

const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const timeoutSchema = z.coerce.number().int().min(1_000).max(180_000).catch(90_000)

// Share one deadline across the request and its optional response-format retry.
const requestConfig = (model: string) => ({
  abortSignal: AbortSignal.timeout(timeoutSchema.parse(process.env.GEMINI_TIMEOUT_MS)),
  ...(/^gemini-3[.-]/.test(model)
    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
    : {}),
})

const systemInstruction = `You create bounded causal graphs for hypothetical thought experiments.
Describe plausible conditional consequences, never forecasts or certainties.
Return a root describing the scenario and exactly three distinct branches, each with exactly three ordered steps.
Each branch is a causal chain: its first step follows from the root, its second follows from its first, and its third follows from its second.
Each step's explanation must describe why its immediate predecessor could cause it. Do not output IDs, depths, or edge references.
Use multiple distinct branches, concise causal explanations, plain-language assumptions, and qualitative impact and uncertainty labels.
Keep each description and edge explanation to one short sentence, with 1–2 brief assumptions per node.
Avoid sensational claims and detailed instructions for harmful acts. Return JSON only.`

const expansionResponseJsonSchema = {
  type: 'object',
  required: ['consequences'],
  properties: {
    consequences: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: {
        type: 'object',
        required: ['title', 'description', 'category', 'impact', 'uncertainty', 'assumptions', 'explanation'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['economic', 'social', 'technology', 'environment', 'political', 'other'],
          },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          uncertainty: { type: 'string', enum: ['lower', 'moderate', 'higher'] },
          assumptions: { type: 'array', items: { type: 'string' } },
          explanation: { type: 'string' },
        },
      },
    },
  },
}

const expansionSystemInstruction = `Expand one selected branch in a hypothetical causal graph.
Return exactly the requested number of distinct, concrete consequences that follow directly from the selected node.
Do not repeat or lightly rephrase any existing consequence title.
Keep causal explanations explicit and concise. Treat outcomes as conditional possibilities, not forecasts.
Include plain-language assumptions and qualitative impact and uncertainty labels.
Keep each description and edge explanation to one short sentence, with 1–2 brief assumptions per node.
Avoid detailed instructions for harmful acts. Return JSON only.`

export const mapGeminiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error
  if (error instanceof SyntaxError) {
    return new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned invalid JSON. Please retry.', { cause: error })
  }
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return new AppError(504, 'AI_TIMEOUT', 'The AI request timed out. Please retry.', { cause: error })
  }
  if (error instanceof ApiError && error.status === 429) {
    return new AppError(429, 'AI_RATE_LIMITED', 'The AI service is busy. Please retry shortly.', {
      cause: error,
    })
  }
  return new AppError(503, 'AI_UNAVAILABLE', 'Could not generate consequences right now. Please retry.', {
    cause: error,
  })
}

const parseExpansionCandidates = (text: string | undefined) => {
  if (!text) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned an empty response.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (cause) {
    throw new SyntaxError('The AI response was not valid JSON.', { cause })
  }

  const wrapper = expansionResponseSchema.safeParse(parsed)
  if (!wrapper.success) {
    console.warn(
      'Gemini expansion validation failed',
      wrapper.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    )
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned invalid branch consequences.', {
      cause: wrapper.error,
    })
  }
  return wrapper.data.consequences
}

const expansionResponseSchema = z.object({ consequences: expansionCandidatesSchema })

export const analyzeScenario = async (scenario: string): Promise<ScenarioGraph> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'The AI service is not configured.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const sharedConfig = requestConfig(model)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Build causal chains for this scenario: ${JSON.stringify(scenario)}${attempt > 0 ? '\nThe previous response was malformed. Return the complete required structure with three branches of three steps; respect every field length and enum.' : ''}`,
        config: {
          ...sharedConfig,
          systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: generationResponseJsonSchema,
          maxOutputTokens: 8_192,
        },
      })
      return parseGeneratedGraph(response.text, scenario)
    } catch (error) {
      if (attempt === 0 && !sharedConfig.abortSignal.aborted &&
        (error instanceof SyntaxError || (error instanceof AppError && error.code === 'AI_INVALID_RESPONSE'))) continue
      throw mapGeminiError(error)
    }
  }

  throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned invalid JSON twice.')
}

export const expandScenario = async (
  graph: ScenarioGraph,
  selectedNodeId: string,
): Promise<ScenarioGraph> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'The AI service is not configured.')
  }

  const context = getExpansionContext(graph, selectedNodeId)
  const ai = new GoogleGenAI({ apiKey })
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const sharedConfig = requestConfig(model)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate ${context.requestedCount} direct downstream consequences for this branch context:\n${JSON.stringify(context)}`,
        config: {
          ...sharedConfig,
          systemInstruction: expansionSystemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: expansionResponseJsonSchema,
          maxOutputTokens: 3_072,
        },
      })
      return mergeExpansion(graph, selectedNodeId, parseExpansionCandidates(response.text))
    } catch (error) {
      if (error instanceof SyntaxError && attempt === 0) continue
      throw mapGeminiError(error)
    }
  }

  throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned invalid JSON twice.')
}
