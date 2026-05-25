import 'server-only'

import { db } from '@/lib/db'
import type { ParsedCardDraft } from '@/types/agent'

/**
 * Atomically create a card from a validated draft.
 *
 * The draft must already pass `validateDraftAgainstBoard` (the parse pipeline does this),
 * so column / assignee / label IDs are guaranteed to belong to the same board.
 */
export async function createCardFromDraft(draft: ParsedCardDraft) {
  return db.$transaction(async (tx) => {
    const lastCard = await tx.card.findFirst({
      where: { columnId: draft.columnId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const orderIndex = (lastCard?.orderIndex ?? 0) + 1.0

    const card = await tx.card.create({
      data: {
        columnId: draft.columnId,
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        assigneeId: draft.assigneeId,
        orderIndex,
        ...(draft.labelIds.length > 0
          ? { labels: { create: draft.labelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      include: {
        assignee: true,
        labels: { include: { label: true } },
      },
    })

    return { ...card, labels: card.labels.map((cl) => cl.label) }
  })
}
