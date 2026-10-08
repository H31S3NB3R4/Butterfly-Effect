import { scenarioGraphSchema, type ScenarioGraph } from '../types/graph'

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    status = 500,
  ) {
    super(message)
    this.code = code
    this.status = status
  }
}

export const analyzeScenario = async (scenario: string): Promise<ScenarioGraph> => {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
  } catch {
    throw new ApiError('The server could not be reached. Check that it is running and try again.', 'NETWORK_ERROR', 0)
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(
      body.error?.message ?? 'Consequences could not be generated. Please try again.',
      body.error?.code,
      response.status,
    )
  }

  const parsed = scenarioGraphSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new ApiError('The server returned an invalid graph. Please try again.', 'INVALID_RESPONSE', 502)
  }
  return parsed.data
}
