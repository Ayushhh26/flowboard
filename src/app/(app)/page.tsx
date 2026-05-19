import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserMenu } from '@/components/ui/UserMenu'
import { CreateBoardButton } from '@/components/board/CreateBoardButton'

type OwnedBoard = {
  id: string
  name: string
  updatedAt: Date
}

type SharedBoard = OwnedBoard & {
  ownerName: string
  role: 'editor' | 'viewer'
}

export default async function BoardsIndexPage() {
  const user = (await getCurrentUser())!

  const [owned, memberships] = await Promise.all([
    db.board.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, updatedAt: true },
    }),
    db.boardMember.findMany({
      where: { userId: user.id },
      orderBy: { board: { updatedAt: 'desc' } },
      select: {
        role: true,
        board: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
            owner: { select: { name: true } },
          },
        },
      },
    }),
  ])

  const shared: SharedBoard[] = memberships.map((m) => ({
    id: m.board.id,
    name: m.board.name,
    updatedAt: m.board.updatedAt,
    ownerName: m.board.owner.name,
    role: m.role as 'editor' | 'viewer',
  }))

  const hasAny = owned.length + shared.length > 0

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Your boards</h1>
        <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        {!hasAny ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-gray-600">No boards yet</p>
            <p className="max-w-sm text-xs text-gray-500">
              Create your first board to start tracking work, or ask someone to invite you.
            </p>
            <CreateBoardButton />
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Your boards</h2>
                  <p className="text-xs text-gray-500">
                    {owned.length} board{owned.length === 1 ? '' : 's'}
                  </p>
                </div>
                <CreateBoardButton />
              </div>
              {owned.length === 0 ? (
                <p className="text-xs text-gray-400">You haven&apos;t created any boards yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map((board) => (
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
              )}
            </section>

            {shared.length > 0 && (
              <section>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Shared with you</h2>
                  <p className="text-xs text-gray-500">
                    {shared.length} board{shared.length === 1 ? '' : 's'}
                  </p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shared.map((board) => (
                    <li key={board.id}>
                      <Link
                        href={`/board/${board.id}`}
                        className="block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-medium text-gray-900">{board.name}</p>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                            {board.role}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          By {board.ownerName} · Updated {new Date(board.updatedAt).toLocaleDateString()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
