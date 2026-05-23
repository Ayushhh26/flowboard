'use client'

import { forwardRef, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { focusRingClassName } from '@/lib/ui-colors'

export interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export const InlineEdit = forwardRef<HTMLInputElement, InlineEditProps>(function InlineEdit(
  { value, onSave, placeholder = 'Click to edit', className, inputClassName },
  ref
) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setDraft(value)
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    setDraft(trimmed || value)
    setIsEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') cancel()
  }

  if (isEditing) {
    return (
      <input
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full rounded-md border border-indigo-400 bg-white px-1 py-0.5 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100',
          inputClassName
        )}
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') startEditing()
      }}
      className={cn(
        'block min-w-0 cursor-text rounded-md px-1 py-0.5 transition-colors duration-200 hover:bg-slate-100',
        focusRingClassName,
        !value && 'text-slate-400',
        className
      )}
    >
      {value || placeholder}
    </span>
  )
})
