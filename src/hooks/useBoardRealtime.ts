'use client'

import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isCardMutating } from '@/lib/mutationTracker'
import type { Board } from '@/types/board'
import type { Card, Priority } from '@/types/card'

// The raw row shape that Postgres Changes streams for the Card table.
// No joined `assignee` or `labels` — those live in related tables.
type RawCardRow = {
  id: string
  columnId: string
  title: string
  description: string | null
  priority: Priority
  orderIndex: number
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}

export function useBoardRealtime(boardId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      // RLS on Card only allows the `authenticated` role. We have to push the
      // user's JWT into the Realtime client before subscribing, otherwise the
      // WebSocket joins as anon and the server strips row data with a 401.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session || cancelled) return
      await supabase.realtime.setAuth(session.access_token)
      if (cancelled) return

      channel = supabase
        .channel(`board:${boardId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Card' },
          (payload) => {
            handleInsert(queryClient, boardId, payload.new as RawCardRow)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'Card' },
          (payload) => {
            handleUpdate(queryClient, boardId, payload.new as RawCardRow)
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'Card' },
          (payload) => {
            const oldRow = payload.old as Partial<RawCardRow>
            if (!oldRow.id) return
            handleDelete(queryClient, boardId, oldRow.id)
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [boardId, queryClient])
}

function handleInsert(queryClient: QueryClient, boardId: string, row: RawCardRow) {
  // INSERT skips echo suppression: the originator's optimistic temp card uses
  // a local ID that won't match this row, and we need joined assignee/labels
  // data we don't have here. Invalidate so the next refetch pulls the full row.
  const board = queryClient.getQueryData<Board>(['board', boardId])
  if (!board) return
  if (!isOnThisBoard(board, row.columnId)) return
  queryClient.invalidateQueries({ queryKey: ['board', boardId] })
}

function handleUpdate(queryClient: QueryClient, boardId: string, row: RawCardRow) {
  if (isCardMutating(row.id)) return

  queryClient.setQueryData<Board>(['board', boardId], (old) => {
    if (!old) return old
    if (!isOnThisBoard(old, row.columnId)) return old

    let foundExisting: Card | undefined
    for (const col of old.columns) {
      const c = col.cards.find((c) => c.id === row.id)
      if (c) {
        foundExisting = c
        break
      }
    }
    // If we don't have the card yet (this client just joined, e.g.), invalidate
    // to pick up the full joined data including assignee/labels.
    if (!foundExisting) {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      return old
    }

    // Preserve assignee if the FK didn't change; otherwise null and rely on
    // the next refetch (triggered below) to fill in the joined User object.
    const preservedAssignee =
      foundExisting.assigneeId === row.assigneeId ? foundExisting.assignee : null
    const updatedCard: Card = {
      ...foundExisting,
      title: row.title,
      description: row.description,
      priority: row.priority,
      orderIndex: row.orderIndex,
      assigneeId: row.assigneeId,
      assignee: preservedAssignee,
      columnId: row.columnId,
      updatedAt: row.updatedAt,
    }

    // If the assignee FK changed, schedule a refetch so the joined data
    // reappears. The optimistic update above keeps the UI responsive.
    if (foundExisting.assigneeId !== row.assigneeId) {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    }

    const movedColumns = old.columns.map((col) => {
      const withoutCard = col.cards.filter((c) => c.id !== row.id)
      if (col.id === row.columnId) {
        const next = [...withoutCard, updatedCard]
        next.sort((a, b) => a.orderIndex - b.orderIndex)
        return { ...col, cards: next }
      }
      return { ...col, cards: withoutCard }
    })

    return { ...old, columns: movedColumns }
  })
}

function handleDelete(queryClient: QueryClient, boardId: string, cardId: string) {
  if (isCardMutating(cardId)) return

  queryClient.setQueryData<Board>(['board', boardId], (old) => {
    if (!old) return old
    return {
      ...old,
      columns: old.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }
  })
}

function isOnThisBoard(board: Board, columnId: string): boolean {
  return board.columns.some((col) => col.id === columnId)
}
