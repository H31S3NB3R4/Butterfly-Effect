import { afterEach, describe, expect, it, vi } from 'vitest'

import { analyzeScenario } from './gemini.js'

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
