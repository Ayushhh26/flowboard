import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function Home() {
  const board = await db.board.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  if (board) redirect(`/board/${board.id}`)

  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      No boards found. Run <code className="mx-1 font-mono">npm run seed</code> to get started.
    </div>
  )
}
