import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@google/genai'

import { analyzeScenario, mapGeminiError, parseModelGraph } from './gemini.js'
import { createValidGraph } from './test-fixtures.js'

describe('Gemini configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('fails safely when the API key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')

    await expect(analyzeScenario('What if?')).rejects.toMatchObject({
      status: 503,
      code: 'AI_NOT_CONFIGURED',
      message: 'The AI service is not configured.',
    })
  })
})

describe('Gemini response and failure handling', () => {
  it('rejects malformed model JSON instead of returning a graph', () => {
    expect(() => parseModelGraph('{"nodes":')).toThrow(SyntaxError)
  })

  it('rejects a structurally invalid model graph', () => {
    const graph = createValidGraph()
    graph.edges[0].target = 'missing'
    expect(() => parseModelGraph(JSON.stringify(graph))).toThrowError('failed validation')
  })

  it('maps an upstream rate limit to a safe retryable response', () => {
    const result = mapGeminiError(new ApiError({ status: 429, message: 'private upstream detail' }))
    expect(result).toMatchObject({ status: 429, code: 'AI_RATE_LIMITED' })
    expect(result.message).not.toContain('private upstream detail')
  })

  it.each(['AbortError', 'TimeoutError'])('maps %s to a gateway timeout', (name) => {
    const error = new Error('private upstream detail')
    error.name = name
    expect(mapGeminiError(error)).toMatchObject({ status: 504, code: 'AI_TIMEOUT' })
  })
})
