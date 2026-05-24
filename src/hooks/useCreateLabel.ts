import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Label } from '@/types/card'
import type { Board } from '@/types/board'
import type { ApiResponse } from '@/types/api'

export function useCreateLabel(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      const json: ApiResponse<Label> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },

    onMutate: async ({ name, color }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] })
      const previousBoard = queryClient.getQueryData<Board>(['board', boardId])
      const tempId = `temp-label-${Date.now()}`

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          labels: [...(old.labels ?? []), { id: tempId, boardId, name, color: color ?? '#6366f1' }],
        }
      })

      return { previousBoard, tempId }
    },

    onSuccess: (data, _vars, context) => {
      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          labels: (old.labels ?? []).map((l) => (l.id === context?.tempId ? data : l)),
        }
      })
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['board', boardId], context?.previousBoard)
      toast.error('Failed to create label')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
