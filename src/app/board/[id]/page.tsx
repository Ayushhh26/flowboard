import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { BoardHeader } from '@/components/board/BoardHeader'
import { BoardCanvas } from '@/components/board/BoardCanvas'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const board = await db.board.findUnique({
    where: { id },
    select: { name: true },
  })

  if (!board) notFound()

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <BoardHeader name={board.name} />
      <div className="min-h-0 flex-1">
        <BoardCanvas boardId={id} />
      </div>
    </div>
  )
}
