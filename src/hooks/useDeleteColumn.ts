import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Board } from '@/types/board'
import type { ApiResponse } from '@/types/api'

interface DeleteColumnVars {
  columnId: string
  moveCardsToColumnId?: string
  deleteCards?: boolean
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ columnId, moveCardsToColumnId, deleteCards }: DeleteColumnVars) => {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveCardsToColumnId, deleteCards }),
      })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ columnId }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.filter((c) => c.id !== columnId),
        }
      })

      return { previousBoard }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to delete column')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
