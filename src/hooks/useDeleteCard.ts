import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { beginCardMutation, endCardMutation } from '@/lib/mutationTracker'
import { usePendingDeleteStore } from '@/stores/usePendingDeleteStore'
import type { Board } from '@/types/board'
import type { Card } from '@/types/card'
import type { ApiResponse } from '@/types/api'

interface DeleteCardVars {
  cardId: string
  immediate?: boolean
}

async function deleteCardApi(cardId: string) {
  const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
  const json: ApiResponse<{ id: string }> = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.data
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient()
  const scheduleDelete = usePendingDeleteStore((s) => s.scheduleDelete)
  const undoDelete = usePendingDeleteStore((s) => s.undoDelete)

  return useMutation({
    mutationFn: async ({ cardId, immediate }: DeleteCardVars) => {
      if (!immediate) return { id: cardId, deferred: true as const }
      return deleteCardApi(cardId)
    },

    onMutate: async ({ cardId, immediate }) => {
      beginCardMutation(cardId)
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      let deletedCard: Card | null = null

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        for (const col of old.columns) {
          const found = col.cards.find((c) => c.id === cardId)
          if (found) {
            deletedCard = found
            break
          }
        }
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        }
      })

      if (immediate || !previousBoard || !deletedCard) {
        return { previousBoard, pending: false as const }
      }

      const snapshot = structuredClone(previousBoard)

      scheduleDelete({
        cardId,
        boardId,
        onUndo: () => {
          queryClient.setQueryData<Board>(['board', boardId], snapshot)
          toast.success('Task restored')
          const el = document.getElementById(`card-${cardId}`)
          el?.focus()
        },
        onCommit: () => {
          deleteCardApi(cardId)
            .catch(() => {
              queryClient.setQueryData<Board>(['board', boardId], snapshot)
              toast.error('Failed to delete card')
            })
            .finally(() => {
              endCardMutation(cardId)
              queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            })
        },
      })

      toast('Task deleted', {
        description: 'Undo within 5 seconds',
        action: {
          label: 'Undo',
          onClick: () => undoDelete(cardId),
        },
        duration: 5000,
      })

      endCardMutation(cardId)
      return { previousBoard, pending: true as const }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId], context.previousBoard)
      }
      toast.error('Failed to delete card')
    },

    onSettled: (_data, _err, vars, context) => {
      if (context?.pending || ( _data && 'deferred' in _data && _data.deferred)) return
      endCardMutation(vars.cardId)
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
