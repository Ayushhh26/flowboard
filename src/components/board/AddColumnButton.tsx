'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { cardSurfaceClassName, inputClassName } from '@/lib/ui-colors'
import { Button } from '@/components/ui/Button'
import { useCreateColumn } from '@/hooks/useCreateColumn'

interface AddColumnButtonProps {
  boardId: string
}

export function AddColumnButton({ boardId }: AddColumnButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: createColumn, isPending } = useCreateColumn(boardId)

  const open = () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const close = () => {
    setIsOpen(false)
    setTitle('')
  }

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    createColumn(
      { title: trimmed },
      {
        onSuccess: () => {
          setTitle('')
          inputRef.current?.focus()
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') close()
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        className="flex h-full min-h-[12rem] w-72 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface/80 text-sm font-medium text-muted shadow-sm transition-colors duration-200 hover:border-accent hover:bg-surface hover:text-accent sm:w-80"
      >
        + Add column
      </button>
    )
  }

  return (
    <div className={cn('flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-surface p-3 sm:w-80', cardSurfaceClassName)}>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Column name..."
        className={cn(inputClassName, 'w-full')}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit} isLoading={isPending}>
          Add column
        </Button>
        <Button size="sm" variant="ghost" onClick={close} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
