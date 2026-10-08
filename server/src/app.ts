import express, { type NextFunction, type Request, type Response } from 'express'
import { ZodError } from 'zod'

import { AppError } from './errors.js'
import { analyzeScenario } from './gemini.js'
import { analyzeInputSchema, type ScenarioGraph } from './schemas.js'

export type ScenarioAnalyzer = (scenario: string) => Promise<ScenarioGraph>

export const createApp = (analyzer: ScenarioAnalyzer = analyzeScenario) => {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.post('/api/analyze', async (request, response, next) => {
    try {
      const { scenario } = analyzeInputSchema.parse(request.body)
      response.json(await analyzer(scenario))
    } catch (error) {
      next(error)
    }
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Provide a scenario between 1 and 500 characters.' },
      })
      return
    }
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' },
      })
      return
    }
    if (error instanceof AppError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } })
      return
    }

    console.error('Unhandled API error', error instanceof Error ? error.message : 'Unknown error')
    response.status(500).json({
      error: { code: 'AI_UNAVAILABLE', message: 'Could not generate consequences right now. Please retry.' },
    })
  })

  return app
}
