import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserMenu } from '@/components/ui/UserMenu'
import { CreateBoardButton } from '@/components/board/CreateBoardButton'

export default async function BoardsIndexPage() {
  const user = (await getCurrentUser())!

  const boards = await db.board.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, updatedAt: true },
  })

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Your boards</h1>
        <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        {boards.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-gray-600">No boards yet</p>
            <p className="max-w-sm text-xs text-gray-500">
              Create your first board to start tracking work.
            </p>
            <CreateBoardButton />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{boards.length} board{boards.length === 1 ? '' : 's'}</p>
              <CreateBoardButton />
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/board/${board.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <p className="truncate font-medium text-gray-900">{board.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Updated {new Date(board.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
