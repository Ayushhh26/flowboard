import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { beginCardMutation, endCardMutation } from '@/lib/mutationTracker'
import type { Board } from '@/types/board'
import type { Card, Label, Priority, User } from '@/types/card'
import type { ApiResponse } from '@/types/api'

interface UpdateCardVars {
  cardId: string
  title?: string
  description?: string | null
  priority?: Priority
  assigneeId?: string | null
  assignee?: User | null
  labelIds?: string[]
  labels?: Label[]
}

export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, assignee: _assignee, labels: _labels, ...payload }: UpdateCardVars & { cardId: string }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json: ApiResponse<Card> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ cardId, ...updates }) => {
      beginCardMutation(cardId)
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
          })),
        }
      })

      return { previousBoard }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to update card')
    },

    onSettled: (_data, _err, vars) => {
      endCardMutation(vars.cardId)
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
