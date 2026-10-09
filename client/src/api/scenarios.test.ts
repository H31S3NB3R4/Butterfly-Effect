import { afterEach, describe, expect, it, vi } from 'vitest'

import { analyzeScenario } from './scenarios'

describe('scenario API failures', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports a network failure without exposing a low-level exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('private network detail')))

    await expect(analyzeScenario('What if a city banned cars?')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
      message: 'The server could not be reached. Check that it is running and try again.',
    })
  })

  it('preserves a safe rate-limit response from the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 'AI_RATE_LIMITED', message: 'The AI service is busy. Please retry shortly.' } }),
    }))

    await expect(analyzeScenario('What if a city banned cars?')).rejects.toMatchObject({
      code: 'AI_RATE_LIMITED',
      status: 429,
    })
  })
})
