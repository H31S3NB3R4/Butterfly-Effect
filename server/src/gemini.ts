import { ApiError, GoogleGenAI } from '@google/genai'

import { AppError } from './errors.js'
import { analyzedScenarioGraphSchema } from './graph-validation.js'
import type { ScenarioGraph } from './schemas.js'

const DEFAULT_MODEL = 'gemini-2.5-flash'
const REQUEST_TIMEOUT_MS = 45_000

const systemInstruction = `You create bounded causal graphs for hypothetical thought experiments.
Describe plausible conditional consequences, never forecasts or certainties.
Return one root node at depth 0 and 9–15 consequence nodes spanning depths 1, 2, and 3.
Every non-root node must be reachable from the root. Every edge must advance exactly one depth.
Use multiple distinct branches, concise causal explanations, plain-language assumptions, and qualitative impact and uncertainty labels.
Avoid sensational claims and detailed instructions for harmful acts. Return JSON only.`

const responseJsonSchema = {
  type: 'object',
  required: ['scenario', 'nodes', 'edges'],
  properties: {
    scenario: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'title',
          'description',
          'depth',
          'category',
          'impact',
          'uncertainty',
          'assumptions',
        ],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          depth: { type: 'integer' },
          category: {
            type: 'string',
            enum: ['economic', 'social', 'technology', 'environment', 'political', 'other'],
          },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          uncertainty: { type: 'string', enum: ['lower', 'moderate', 'higher'] },
          assumptions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'source', 'target', 'explanation'],
        properties: {
          id: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
  },
}

const parseModelGraph = (text: string | undefined): ScenarioGraph => {
  if (!text) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned an empty response.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (cause) {
    throw new SyntaxError('The AI response was not valid JSON.', { cause })
  }

  const result = analyzedScenarioGraphSchema.safeParse(parsed)
  if (!result.success) {
    console.warn(
      'Gemini graph validation failed',
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    )
    throw new AppError(
      502,
      'AI_INVALID_RESPONSE',
      'The AI returned a graph that failed validation.',
      { cause: result.error },
    )
  }
  return result.data
}

const mapGeminiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error
  if (error instanceof Error && error.name === 'AbortError') {
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

export const analyzeScenario = async (scenario: string): Promise<ScenarioGraph> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'The AI service is not configured.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Build a causal graph for this scenario: ${JSON.stringify(scenario)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema,
          temperature: 0.65,
          maxOutputTokens: 8_192,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      })
      return parseModelGraph(response.text)
    } catch (error) {
      if (error instanceof SyntaxError && attempt === 0) continue
      throw mapGeminiError(error)
    }
  }

  throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI returned invalid JSON twice.')
}
