import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Board } from '@/types/board'
import type { ApiResponse } from '@/types/api'

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const json: ApiResponse<{ id: string; title: string }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ columnId, title }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
        }
      })

      return { previousBoard }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to rename column')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
