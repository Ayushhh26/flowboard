import { useQuery } from '@tanstack/react-query'
import type { Board } from '@/types/board'
import type { ApiResponse } from '@/types/api'

async function fetchBoard(boardId: string): Promise<Board> {
  const res = await fetch(`/api/boards/${boardId}`)
  const json: ApiResponse<Board> = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.data
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId),
  })
}
