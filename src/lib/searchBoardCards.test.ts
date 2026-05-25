import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { searchCardsInBoard } from './searchCardsInBoard'
import type { Card } from '@/types/card'

const baseCard = (overrides: Partial<Card> & Pick<Card, 'id' | 'title'>): Card => ({
  columnId: 'col-1',
  description: null,
  priority: 'none',
  orderIndex: 1,
  assigneeId: null,
  assignee: null,
  labels: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('searchCardsInBoard', () => {
  const columns = [
    {
      id: 'col-1',
      title: 'To Do',
      cards: [
        baseCard({ id: '1', title: 'Fix login bug', priority: 'urgent', assigneeId: 'u1' }),
        baseCard({ id: '2', title: 'Write docs', priority: 'low' }),
      ],
    },
    {
      id: 'col-2',
      title: 'Done',
      cards: [baseCard({ id: '3', title: 'Ship feature', priority: 'high' })],
    },
  ]

  it('returns all cards when no filters are active', () => {
    const { cards, total } = searchCardsInBoard(columns, { search: '', priorities: [], assigneeIds: [], labelIds: [] }, 50)
    assert.equal(total, 3)
    assert.equal(cards.length, 3)
    assert.equal(cards[0].columnTitle, 'To Do')
  })

  it('filters by priority and search text', () => {
    const { cards, total } = searchCardsInBoard(
      columns,
      { search: 'login', priorities: ['urgent'], assigneeIds: [], labelIds: [] },
      50
    )
    assert.equal(total, 1)
    assert.equal(cards[0]?.title, 'Fix login bug')
  })

  it('respects limit while reporting full total', () => {
    const { cards, total } = searchCardsInBoard(
      columns,
      { search: '', priorities: [], assigneeIds: [], labelIds: [] },
      2
    )
    assert.equal(total, 3)
    assert.equal(cards.length, 2)
  })
})
