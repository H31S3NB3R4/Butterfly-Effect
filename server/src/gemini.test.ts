import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, ThinkingLevel, type GenerateContentParameters, type GenerateContentResponse } from '@google/genai'

import { analyzeScenario, expandScenario, mapGeminiError } from './gemini.js'
import { AppError } from './errors.js'
import { createValidGraph } from './test-fixtures.js'

const generate = vi.hoisted(() => vi.fn<(params: GenerateContentParameters) => Promise<GenerateContentResponse>>())
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@google/genai')>()
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent: generate }
    },
  }
})

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

describe('bounded Gemini requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    generate.mockReset()
    vi.unstubAllEnvs()
  })

  it.each(['analyze', 'expand'])('aborts a stalled %s request at the configured deadline', async (operation) => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.5-flash')
    vi.stubEnv('GEMINI_TIMEOUT_MS', '1000')
    generate.mockImplementation(({ config }) =>
      new Promise((_resolve, reject) => {
        const signal = config!.abortSignal!
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      }),
    )

    const request = operation === 'analyze'
      ? analyzeScenario('What if I eat momos daily?')
      : expandScenario(createValidGraph(), 'n1')
    await expect(request).rejects.toMatchObject({ status: 504, code: 'AI_TIMEOUT' })
    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate.mock.calls[0][0].config?.thinkingConfig?.thinkingLevel).toBe(ThinkingLevel.LOW)
  })

  it('reuses the deadline for its single formatting retry and classifies invalid JSON correctly', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'gemini-2.5-flash')
    generate.mockRejectedValue(new SyntaxError('Invalid JSON'))

    await expect(analyzeScenario('What if?')).rejects.toMatchObject({ status: 502, code: 'AI_INVALID_RESPONSE' })
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate.mock.calls[0][0].config?.abortSignal).toBe(generate.mock.calls[1][0].config?.abortSignal)
    expect(generate.mock.calls[0][0].config?.thinkingConfig).toBeUndefined()
  })

  it('retries an invalid model response once within the same deadline', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    generate.mockRejectedValue(new AppError(502, 'AI_INVALID_RESPONSE', 'Incomplete consequences'))
    await expect(analyzeScenario('What if?')).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' })
    expect(generate).toHaveBeenCalledTimes(2)
    expect(generate.mock.calls[1][0].contents).toContain('previous response was malformed')
    expect(generate.mock.calls[0][0].config?.abortSignal).toBe(generate.mock.calls[1][0].config?.abortSignal)
  })
})

describe('Gemini response and failure handling', () => {
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
