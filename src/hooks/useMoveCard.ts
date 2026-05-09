import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDemoStore } from '@/stores/useDemoStore'
import type { Board } from '@/types/board'
import type { Card } from '@/types/card'
import type { ApiResponse } from '@/types/api'

interface MoveCardVariables {
  cardId: string
  targetColumnId: string
  newOrderIndex: number
  insertIndex: number
  preSnapshot: Board
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, targetColumnId, newOrderIndex }: MoveCardVariables) => {
      const { simulateFailure } = useDemoStore.getState()
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(simulateFailure && { 'x-simulate-failure': 'true' }),
        },
        body: JSON.stringify({ targetColumnId, newOrderIndex }),
      })
      const json: ApiResponse<Card> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ cardId, targetColumnId, newOrderIndex, insertIndex, preSnapshot }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old

        const movingCard = old.columns.flatMap((c) => c.cards).find((c) => c.id === cardId)
        if (!movingCard) return old

        const withoutCard = {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        }

        return {
          ...withoutCard,
          columns: withoutCard.columns.map((col) => {
            if (col.id !== targetColumnId) return col
            const next = [...col.cards]
            next.splice(insertIndex, 0, { ...movingCard, columnId: targetColumnId, orderIndex: newOrderIndex })
            return { ...col, cards: next }
          }),
        }
      })

      return { preSnapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.preSnapshot) {
        queryClient.setQueryData<Board>(['board', boardId], context.preSnapshot)
      }
      toast.error('Failed to move card')
      const { simulateFailure, toggleSimulateFailure } = useDemoStore.getState()
      if (simulateFailure) toggleSimulateFailure()
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
