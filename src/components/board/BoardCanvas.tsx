'use client'

import { useBoard } from '@/hooks/useBoard'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { Column } from './Column'

interface BoardCanvasProps {
  boardId: string
}

function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium text-gray-600">Failed to load board</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Retry
      </button>
    </div>
  )
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { data: board, isLoading, isError, refetch } = useBoard(boardId)

  if (isLoading) return <BoardSkeleton />
  if (isError || !board) return <BoardError onRetry={() => refetch()} />

  return (
    <div className="flex h-full items-start gap-3 overflow-x-auto p-6">
      {board.columns.map((col) => (
        <Column key={col.id} column={col} boardId={boardId} />
      ))}
    </div>
  )
}
