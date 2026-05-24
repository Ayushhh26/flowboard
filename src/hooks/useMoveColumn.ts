import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Board } from '@/types/board'
import type { ApiResponse } from '@/types/api'

export function useMoveColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      columnId,
      newOrderIndex,
    }: {
      columnId: string
      newOrderIndex: number
    }) => {
      const res = await fetch(`/api/columns/${columnId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrderIndex }),
      })
      const json: ApiResponse<{ id: string; orderIndex: number }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ columnId, newOrderIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((c) =>
            c.id === columnId ? { ...c, orderIndex: newOrderIndex } : c
          ),
        }
      })

      return { previousBoard }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to reorder column')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
