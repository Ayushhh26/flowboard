'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClassName, focusRingClassName, PRIORITY_OPTIONS, PRIORITY_STYLES } from '@/lib/ui-colors'
import { LabelChip } from '@/components/ui/LabelChip'
import { Button } from '@/components/ui/Button'
import { useFilterStore } from '@/stores/useFilterStore'
import { hasActiveFilters } from '@/lib/filterCards'
import { useBoardMembers } from '@/hooks/useBoardMembers'
import type { Label } from '@/types/card'
import type { Priority } from '@/types/card'

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
    <div className="border-b border-border bg-surface px-4 py-3 shadow-sm sm:px-6">
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
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Priority</span>
          {PRIORITY_OPTIONS.filter((p) => p.value !== 'none').map((opt) => {
            const p = opt.value as Priority
            const styles = PRIORITY_STYLES[p]
            const isOn = priorities.includes(p)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePriority(p)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                  focusRingClassName,
                  isOn ? styles.filterActive : 'border-border bg-surface text-muted hover:bg-background'
                )}
                aria-pressed={isOn}
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', styles.dot)} aria-hidden />
                {opt.label}
              </button>
            )
          })}
        </div>

        {members.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Assignee</span>
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => toggleAssignee(m.userId)}
                className={cn(
                  'cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                  focusRingClassName,
                  assigneeIds.includes(m.userId)
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-border bg-surface text-muted hover:bg-background'
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
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Labels</span>
            {labels.map((label) => {
              const isOn = labelIds.includes(label.id)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    'cursor-pointer rounded-md transition-all',
                    focusRingClassName,
                    !isOn && 'opacity-60 saturate-75 hover:opacity-100 hover:saturate-100'
                  )}
                  aria-pressed={isOn}
                >
                  <LabelChip label={label} size="md" />
                </button>
              )
            })}
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
