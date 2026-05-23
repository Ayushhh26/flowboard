'use client'

import { cn } from '@/lib/cn'
import { useDemoStore } from '@/stores/useDemoStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateBoard } from '@/hooks/useUpdateBoard'
import { UserMenu } from '@/components/ui/UserMenu'
import { InlineEdit } from '@/components/ui/InlineEdit'
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
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      {isOwner ? (
        <InlineEdit
          value={displayName}
          onSave={(next) => {
            if (next !== displayName) updateBoard({ name: next })
          }}
          placeholder="Untitled board"
          className="text-2xl font-semibold text-gray-900"
          inputClassName="text-2xl font-semibold"
        />
      ) : (
        <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
      )}
      <div className="flex items-center gap-3">
        {canEdit && process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <button
            onClick={toggleSimulateFailure}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              simulateFailure
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', simulateFailure ? 'bg-red-500' : 'bg-gray-300')} />
            {simulateFailure ? 'Demo mode ON' : 'Demo mode'}
          </button>
        )}
        {isOwner && <ShareButton boardId={boardId} />}
        {user && <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />}
      </div>
    </header>
  )
}
