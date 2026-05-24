'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClassName, focusRingClassName, PRIORITY_OPTIONS } from '@/lib/ui-colors'
import { LabelChip } from '@/components/ui/LabelChip'
import { Button } from '@/components/ui/Button'
import { useFilterStore } from '@/stores/useFilterStore'
import { hasActiveFilters } from '@/lib/filterCards'
import { useBoardMembers } from '@/hooks/useBoardMembers'
import type { Label } from '@/types/card'

interface FilterBarProps {
  boardId: string
  labels: Label[]
}

export function FilterBar({ boardId, labels }: FilterBarProps) {
  const {
    search,
    setSearch,
    priorities,
    assigneeIds,
    labelIds,
    togglePriority,
    toggleAssignee,
    toggleLabel,
    clearAll,
  } = useFilterStore()

  const [draft, setDraft] = useState(search)
  const { data: membersData } = useBoardMembers(boardId)
  const members = membersData?.members ?? []

  useEffect(() => {
    const t = setTimeout(() => setSearch(draft), 300)
    return () => clearTimeout(t)
  }, [draft, setSearch])

  const filters = { search, priorities, assigneeIds, labelIds }
  const active = hasActiveFilters(filters)

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className={cn(inputClassName, 'max-w-md')}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
          {PRIORITY_OPTIONS.filter((p) => p.value !== 'none').map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => togglePriority(opt.value)}
              className={cn(
                'cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                focusRingClassName,
                priorities.includes(opt.value)
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
              aria-pressed={priorities.includes(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {members.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</span>
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => toggleAssignee(m.userId)}
                className={cn(
                  'cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                  focusRingClassName,
                  assigneeIds.includes(m.userId)
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
                aria-pressed={assigneeIds.includes(m.userId)}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Labels</span>
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={cn(
                  'cursor-pointer rounded-md transition-opacity',
                  focusRingClassName,
                  !labelIds.includes(label.id) && 'opacity-40 hover:opacity-70'
                )}
                aria-pressed={labelIds.includes(label.id)}
              >
                <LabelChip label={label} size="md" />
              </button>
            ))}
          </div>
        )}

        {active && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
