'use client'

import { forwardRef, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

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
    if (e.key === 'Enter') { e.preventDefault(); commit() }
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
          'w-full rounded border border-blue-400 bg-white px-1 py-0.5 outline-none',
          'focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditing() }}
      className={cn(
        'cursor-text rounded px-1 py-0.5 hover:bg-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        !value && 'text-gray-400',
        className
      )}
    >
      {value || placeholder}
    </span>
  )
})
