import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Board } from '@/types/board'
import type { Card, Priority } from '@/types/card'
import type { ApiResponse } from '@/types/api'

interface CreateCardVars {
  columnId: string
  title: string
  priority?: Priority
}

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ columnId, title, priority }: CreateCardVars) => {
      const res = await fetch(`/api/columns/${columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority }),
      })
      const json: ApiResponse<Card> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ columnId, title, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      const tempCard: Card = {
        id: `temp-${Date.now()}`,
        columnId,
        title,
        description: null,
        priority: priority ?? 'none',
        orderIndex: 999999,
        assigneeId: null,
        assignee: null,
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId
              ? { ...col, cards: [...col.cards, tempCard] }
              : col
          ),
        }
      })

      return { previousBoard }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to create card')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
