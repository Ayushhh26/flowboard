import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { BoardHeader } from '@/components/board/BoardHeader'
import { BoardCanvas } from '@/components/board/BoardCanvas'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = (await getCurrentUser())!

  const board = await db.board.findFirst({
    where: { id, ownerId: user.id },
    select: { name: true },
  })

  if (!board) notFound()

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <BoardHeader name={board.name} user={user} />
      <div className="min-h-0 flex-1">
        <BoardCanvas boardId={id} />
      </div>
    </div>
  )
}
