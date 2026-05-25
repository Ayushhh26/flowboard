import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { FlowboardApiError, FlowboardClient } from './client.js'
import { buildBoardSummary } from './summary.js'

describe('FlowboardClient', () => {
  it('returns data on success', async () => {
    const client = new FlowboardClient({
      baseUrl: 'http://localhost:3000',
      apiToken: 'fb_test',
      fetchImpl: async () =>
        new Response(JSON.stringify({ data: { id: 'b1', name: 'Demo' }, error: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    const board = await client.get<{ id: string; name: string }>('/api/boards/b1')
    assert.equal(board.id, 'b1')
    assert.equal(board.name, 'Demo')
  })

  it('throws FlowboardApiError on API error envelope', async () => {
    const client = new FlowboardClient({
      baseUrl: 'http://localhost:3000',
      apiToken: 'fb_bad',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ data: null, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
    })

    await assert.rejects(
      () => client.get('/api/boards/x'),
      (err: unknown) => {
        assert.ok(err instanceof FlowboardApiError)
        assert.equal(err.code, 'UNAUTHORIZED')
        assert.equal(err.status, 401)
        return true
      }
    )
  })

  it('sends Bearer token and JSON body on POST', async () => {
    let auth = ''
    let body = ''
    const client = new FlowboardClient({
      baseUrl: 'http://localhost:3000/',
      apiToken: 'fb_secret',
      fetchImpl: async (_url, init) => {
        auth = String(init?.headers && (init.headers as Record<string, string>).Authorization)
        body = String(init?.body)
        return new Response(JSON.stringify({ data: { id: 'c1' }, error: null }), { status: 201 })
      },
    })

    await client.post('/api/columns/col/cards', { title: 'Test' })
    assert.equal(auth, 'Bearer fb_secret')
    assert.deepEqual(JSON.parse(body), { title: 'Test' })
  })
})

describe('buildBoardSummary', () => {
  it('aggregates column and priority counts', () => {
    const summary = buildBoardSummary({
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Sprint',
      columns: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'To Do',
          cards: [
            { id: '550e8400-e29b-41d4-a716-446655440003', title: 'A', priority: 'urgent' },
            { id: '550e8400-e29b-41d4-a716-446655440004', title: 'B', priority: 'low' },
          ],
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          title: 'Done',
          cards: [{ id: '550e8400-e29b-41d4-a716-446655440006', title: 'C', priority: 'none' }],
        },
      ],
    })

    assert.equal(summary.totalCards, 3)
    assert.equal(summary.byColumn[0]?.count, 2)
    assert.equal(summary.urgentCards.length, 1)
    assert.equal(summary.urgentCards[0]?.title, 'A')
  })
})
