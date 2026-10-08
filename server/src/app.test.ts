import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from './app.js'
import { AppError } from './errors.js'
import { createValidGraph } from './test-fixtures.js'

describe('GET /api/health', () => {
  it('reports that the API is ready', async () => {
    const response = await request(createApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('POST /api/analyze', () => {
  it('validates and trims the scenario before analysis', async () => {
    const graph = createValidGraph()
    let receivedScenario = ''
    const app = createApp(async (scenario) => {
      receivedScenario = scenario
      return graph
    })

    const response = await request(app)
      .post('/api/analyze')
      .send({ scenario: '  What if universities stopped using written exams?  ' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(graph)
    expect(receivedScenario).toBe('What if universities stopped using written exams?')
  })

  it.each([
    {},
    { scenario: '' },
    { scenario: 'x'.repeat(501) },
    { scenario: 'Valid question', unexpected: true },
  ])('rejects invalid input', async (body) => {
    const response = await request(createApp(async () => createValidGraph()))
      .post('/api/analyze')
      .send(body)

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_REQUEST')
  })

  it('returns stable service errors without leaking causes', async () => {
    const app = createApp(async () => {
      throw new AppError(429, 'AI_RATE_LIMITED', 'The AI service is busy. Please retry shortly.', {
        cause: new Error('sensitive upstream detail'),
      })
    })

    const response = await request(app).post('/api/analyze').send({ scenario: 'What if?' })

    expect(response.status).toBe(429)
    expect(response.body).toEqual({
      error: { code: 'AI_RATE_LIMITED', message: 'The AI service is busy. Please retry shortly.' },
    })
    expect(JSON.stringify(response.body)).not.toContain('sensitive')
  })
})

describe('POST /api/expand', () => {
  it('passes a validated graph and selection to the expander', async () => {
    const graph = createValidGraph()
    let receivedSelection = ''
    const app = createApp(undefined, async (receivedGraph, selectedNodeId) => {
      expect(receivedGraph).toEqual(graph)
      receivedSelection = selectedNodeId
      return graph
    })

    const response = await request(app)
      .post('/api/expand')
      .send({ graph, selectedNodeId: 'n7' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(graph)
    expect(receivedSelection).toBe('n7')
  })

  it('rejects an invalid submitted graph before expansion', async () => {
    const graph = createValidGraph()
    graph.edges[0].target = 'missing'
    const response = await request(createApp(undefined, async () => graph))
      .post('/api/expand')
      .send({ graph, selectedNodeId: 'n7' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_REQUEST')
  })
})
