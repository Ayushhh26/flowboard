import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateDraftAgainstBoard } from './parseCardDraft.js'
import type { BoardParseContext, ParsedCardDraft } from '../../types/agent.js'

const context: BoardParseContext = {
  columns: [
    { id: '11111111-1111-4111-8111-111111111111', title: 'To Do' },
    { id: '22222222-2222-4222-8222-222222222222', title: 'Done' },
  ],
  members: [
    {
      userId: '33333333-3333-4333-8333-333333333333',
      name: 'Alice',
      email: 'alice@example.com',
    },
  ],
  labels: [{ id: '44444444-4444-4444-8444-444444444444', name: 'bug' }],
  defaults: {
    columnId: '11111111-1111-4111-8111-111111111111',
    priority: 'none',
  },
}

const validDraft: ParsedCardDraft = {
  title: 'Fix login',
  description: null,
  priority: 'urgent',
  columnId: '11111111-1111-4111-8111-111111111111',
  assigneeId: '33333333-3333-4333-8333-333333333333',
  labelIds: ['44444444-4444-4444-8444-444444444444'],
}

describe('validateDraftAgainstBoard', () => {
  it('accepts a draft with valid board references', () => {
    assert.doesNotThrow(() => validateDraftAgainstBoard(validDraft, context))
  })

  it('rejects unknown columnId', () => {
    assert.throws(
      () =>
        validateDraftAgainstBoard(
          { ...validDraft, columnId: '99999999-9999-4999-8999-999999999999' },
          context
        ),
      /columnId/
    )
  })

  it('rejects unknown assigneeId', () => {
    assert.throws(
      () =>
        validateDraftAgainstBoard(
          { ...validDraft, assigneeId: '99999999-9999-4999-8999-999999999999' },
          context
        ),
      /assigneeId/
    )
  })

  it('rejects unknown labelIds', () => {
    assert.throws(
      () =>
        validateDraftAgainstBoard(
          { ...validDraft, labelIds: ['99999999-9999-4999-8999-999999999999'] },
          context
        ),
      /labelIds/
    )
  })
})
