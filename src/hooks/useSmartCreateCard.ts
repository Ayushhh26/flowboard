import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Card } from '@/types/card'
import type { ApiResponse } from '@/types/api'
import type { ParsedCardDraft } from '@/types/agent'

export function useSmartCreateCard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draft: ParsedCardDraft): Promise<Card> => {
      const createRes = await fetch(`/api/columns/${draft.columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, priority: draft.priority }),
      })
      const createJson: ApiResponse<Card> = await createRes.json()
      if (createJson.error) throw new Error(createJson.error.message)

      let card = createJson.data

      const needsPatch =
        draft.description !== null ||
        draft.assigneeId !== null ||
        draft.labelIds.length > 0

      if (needsPatch) {
        const patchRes = await fetch(`/api/cards/${card.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: draft.description,
            assigneeId: draft.assigneeId,
            labelIds: draft.labelIds,
          }),
        })
        const patchJson: ApiResponse<Card> = await patchRes.json()
        if (patchJson.error) throw new Error(patchJson.error.message)
        card = patchJson.data
      }

      return card
    },

    onSuccess: () => {
      toast.success('Card created')
    },

    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create card')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}
