'use client'

import { cn } from '@/lib/cn'
import { useDemoStore } from '@/stores/useDemoStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateBoard } from '@/hooks/useUpdateBoard'
import { AppLogo } from '@/components/ui/AppLogo'
import { UserMenu } from '@/components/ui/UserMenu'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { displayTitleClassName, focusRingClassName } from '@/lib/ui-colors'
import { ShareButton } from './ShareButton'
import { SmartAddButton } from './SmartAddButton'
import type { ViewerRole } from '@/types/board'

interface BoardHeaderUser {
  name: string
  email: string
  avatarUrl: string | null
}

interface BoardHeaderProps {
  name: string
  boardId: string
  viewerRole: ViewerRole
  user?: BoardHeaderUser
}

export function BoardHeader({ name: initialName, boardId, viewerRole, user }: BoardHeaderProps) {
  const { simulateFailure, toggleSimulateFailure } = useDemoStore()
  const { data: board } = useBoard(boardId)
  const { mutate: updateBoard } = useUpdateBoard(boardId)
  const canEdit = viewerRole !== 'viewer'
  const isOwner = viewerRole === 'owner'

  const displayName = board?.name ?? initialName

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 shadow-sm sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AppLogo className="hidden shrink-0 sm:inline-flex" />
        <AppLogo showWordmark={false} className="shrink-0 sm:hidden" />
        <div className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isOwner ? (
            <InlineEdit
              value={displayName}
              onSave={(next) => {
                if (next !== displayName) updateBoard({ name: next })
              }}
              placeholder="Untitled board"
              className={cn('block min-w-0 truncate', displayTitleClassName)}
              inputClassName="font-display text-lg font-semibold sm:text-xl"
            />
          ) : (
            <h1 className={cn('min-w-0 truncate', displayTitleClassName)}>{displayName}</h1>
          )}
          {!isOwner && <RoleBadge role={viewerRole} />}
          {viewerRole === 'viewer' && (
            <span className="hidden rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted sm:inline">
              Read-only
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {canEdit && process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <button
            type="button"
            onClick={toggleSimulateFailure}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200',
              focusRingClassName,
              simulateFailure
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300'
                : 'border-border bg-surface text-muted hover:bg-foreground/5'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                simulateFailure ? 'bg-red-500' : 'bg-muted'
              )}
            />
            {simulateFailure ? 'Demo ON' : 'Demo'}
          </button>
        )}
        <ThemeToggle />
        {canEdit && <SmartAddButton boardId={boardId} />}
        {isOwner && <ShareButton boardId={boardId} />}
        {user && <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />}
      </div>
    </header>
  )
}
