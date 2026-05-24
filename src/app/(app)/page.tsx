import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserMenu } from '@/components/ui/UserMenu'
import { CreateBoardButton } from '@/components/board/CreateBoardButton'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { displayTitleClassName, interactiveCardClassName } from '@/lib/ui-colors'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type OwnedBoard = {
  id: string
  name: string
  updatedAt: Date
}

type SharedBoard = OwnedBoard & {
  ownerName: string
  role: 'editor' | 'viewer'
}

function formatUpdatedAt(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-sm">
        <h1 className={displayTitleClassName}>Your boards</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        {!hasAny ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-muted">No boards yet</p>
            <p className="max-w-sm text-xs text-muted">
              Create your first board to start tracking work, or ask someone to invite you.
            </p>
            <CreateBoardButton />
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Your boards</h2>
                  <p className="text-xs text-muted">
                    {owned.length} board{owned.length === 1 ? '' : 's'}
                  </p>
                </div>
                <CreateBoardButton />
              </div>
              {owned.length === 0 ? (
                <p className="text-xs text-muted">You haven&apos;t created any boards yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map((board) => (
                    <li key={board.id}>
                      <Link href={`/board/${board.id}`} className={interactiveCardClassName}>
                        <p className="truncate font-medium text-foreground">{board.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          Updated {formatUpdatedAt(board.updatedAt)}
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
                  <h2 className="text-sm font-semibold text-foreground">Shared with you</h2>
                  <p className="text-xs text-muted">
                    {shared.length} board{shared.length === 1 ? '' : 's'}
                  </p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shared.map((board) => (
                    <li key={board.id}>
                      <Link href={`/board/${board.id}`} className={interactiveCardClassName}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-medium text-foreground">{board.name}</p>
                          <RoleBadge role={board.role} />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          By {board.ownerName} · Updated {formatUpdatedAt(board.updatedAt)}
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
