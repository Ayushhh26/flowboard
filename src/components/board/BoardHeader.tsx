'use client'

import { cn } from '@/lib/cn'
import { useDemoStore } from '@/stores/useDemoStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateBoard } from '@/hooks/useUpdateBoard'
import { AppLogo } from '@/components/ui/AppLogo'
import { UserMenu } from '@/components/ui/UserMenu'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { focusRingClassName } from '@/lib/ui-colors'
import { ShareButton } from './ShareButton'
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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AppLogo className="hidden shrink-0 sm:inline-flex" />
        <AppLogo showWordmark={false} className="shrink-0 sm:hidden" />
        <div className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isOwner ? (
            <InlineEdit
              value={displayName}
              onSave={(next) => {
                if (next !== displayName) updateBoard({ name: next })
              }}
              placeholder="Untitled board"
              className="block min-w-0 truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
              inputClassName="text-lg font-semibold sm:text-xl"
            />
          ) : (
            <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {displayName}
            </h1>
          )}
          {!isOwner && <RoleBadge role={viewerRole} />}
          {viewerRole === 'viewer' && (
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline">
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
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', simulateFailure ? 'bg-red-500' : 'bg-slate-300')}
            />
            {simulateFailure ? 'Demo ON' : 'Demo'}
          </button>
        )}
        {isOwner && <ShareButton boardId={boardId} />}
        {user && <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />}
      </div>
    </header>
  )
}
