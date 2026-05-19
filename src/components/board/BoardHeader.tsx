'use client'

import { cn } from '@/lib/cn'
import { useDemoStore } from '@/stores/useDemoStore'
import { UserMenu } from '@/components/ui/UserMenu'
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

export function BoardHeader({ name, boardId, viewerRole, user }: BoardHeaderProps) {
  const { simulateFailure, toggleSimulateFailure } = useDemoStore()
  const canEdit = viewerRole !== 'viewer'
  const isOwner = viewerRole === 'owner'

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
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
