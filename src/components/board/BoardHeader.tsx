'use client'

import { cn } from '@/lib/cn'
import { useDemoStore } from '@/stores/useDemoStore'

interface BoardHeaderProps {
  name: string
}

export function BoardHeader({ name }: BoardHeaderProps) {
  const { simulateFailure, toggleSimulateFailure } = useDemoStore()

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
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
    </header>
  )
}
