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

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
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

  const hasAssigneeFilters = members.length > 0
  const hasLabelFilters = labels.length > 0

  return (
    <div
      role="toolbar"
      aria-label="Board filters"
      className="shrink-0 border-b border-border bg-surface px-4 py-2.5 shadow-sm sm:px-6"
    >
      {/* Row 1: search (standard primary toolbar control, left) + clear (right) */}
      <div className="flex flex-wrap items-center gap-2 gap-y-2 sm:gap-3">
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className={cn(inputClassName, 'min-w-[12rem] flex-1 sm:max-w-md')}
        />
        {active && (
          <Button size="sm" variant="ghost" onClick={clearAll} className="shrink-0 sm:ml-auto">
            Clear filters
          </Button>
        )}
      </div>

      {/* Row 2: filter dimensions in one toolbar strip (Trello / Linear-style) */}
      <div
        className={cn(
          'mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-2',
          'sm:gap-x-6'
        )}
      >
          <FilterGroup label="Priority">
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
          </FilterGroup>

          {hasAssigneeFilters && (
            <>
              <span
                className="hidden h-4 w-px shrink-0 bg-border sm:block"
                aria-hidden
              />
              <FilterGroup label="Assignee">
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
              </FilterGroup>
            </>
          )}

          {hasLabelFilters && (
            <>
              <span
                className="hidden h-4 w-px shrink-0 bg-border sm:block"
                aria-hidden
              />
              <FilterGroup label="Labels">
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
              </FilterGroup>
            </>
          )}
      </div>
    </div>
  )
}
