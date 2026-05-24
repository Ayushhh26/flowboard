import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Board } from '@/types/board'
import type { Column } from '@/types/column'
import type { ApiResponse } from '@/types/api'

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const json: ApiResponse<Column> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ title }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])

      const tempId = `temp-col-${Date.now()}`
      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        const maxOrder = Math.max(...old.columns.map((c) => c.orderIndex), 0)
        return {
          ...old,
          columns: [
            ...old.columns,
            { id: tempId, boardId, title, orderIndex: maxOrder + 1, cards: [] },
          ],
        }
      })

      return { previousBoard, tempId }
    },

    onSuccess: (data, _vars, context) => {
      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((c) => (c.id === context?.tempId ? { ...data, cards: [] } : c)),
        }
      })
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to create column')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
