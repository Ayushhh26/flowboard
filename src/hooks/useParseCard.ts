import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiResponse } from '@/types/api'
import type { ParsedCardDraft } from '@/types/agent'

export function useParseCard(boardId: string) {
  return useMutation({
    mutationFn: async (text: string): Promise<ParsedCardDraft> => {
      const res = await fetch(`/api/boards/${boardId}/cards/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json: ApiResponse<ParsedCardDraft> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not parse card')
    },
  })
}
