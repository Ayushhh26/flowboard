'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClassName, focusRingClassName } from '@/lib/ui-colors'
import { LabelChip } from '@/components/ui/LabelChip'
import { Button } from '@/components/ui/Button'
import type { Label } from '@/types/card'

interface LabelPickerProps {
  boardLabels: Label[]
  selectedIds: string[]
  onChange: (labelIds: string[]) => void
  onCreateLabel: (name: string) => void
  disabled?: boolean
}

export function LabelPicker({
  boardLabels,
  selectedIds,
  onChange,
  onCreateLabel,
  disabled,
}: LabelPickerProps) {
  const [newLabelName, setNewLabelName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const toggle = (labelId: string) => {
    if (disabled) return
    if (selectedIds.includes(labelId)) {
      onChange(selectedIds.filter((id) => id !== labelId))
    } else {
      onChange([...selectedIds, labelId])
    }
  }

  const handleCreate = () => {
    const trimmed = newLabelName.trim()
    if (!trimmed) return
    onCreateLabel(trimmed)
    setNewLabelName('')
    setShowCreate(false)
  }

  if (boardLabels.length === 0 && !showCreate) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)} disabled={disabled}>
        + Create first label
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {boardLabels.map((label) => {
          const selected = selectedIds.includes(label.id)
          return (
            <button
              key={label.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(label.id)}
              className={cn(
                'cursor-pointer rounded-md transition-opacity duration-200',
                focusRingClassName,
                !selected && 'opacity-40 hover:opacity-70',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-pressed={selected}
            >
              <LabelChip label={label} size="md" />
            </button>
          )
        })}
      </div>

      {showCreate ? (
        <div className="flex gap-2">
          <input
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setShowCreate(false)
            }}
            placeholder="Label name..."
            className={cn(inputClassName, 'flex-1 text-sm')}
            autoFocus
          />
          <Button size="sm" onClick={handleCreate} disabled={!newLabelName.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCreate(true)}
          className="text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          + New label
        </button>
      )}
    </div>
  )
}
