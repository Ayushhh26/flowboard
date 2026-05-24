'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClassName } from '@/lib/ui-colors'
import { Button } from '@/components/ui/Button'
import { useCreateCard } from '@/hooks/useCreateCard'

interface AddCardInputProps {
  columnId: string
  boardId: string
}

export function AddCardInput({ columnId, boardId }: AddCardInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: createCard, isPending } = useCreateCard(boardId)

  const open = () => {
    setIsOpen(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const close = () => {
    setIsOpen(false)
    setTitle('')
  }

  const submit = () => {
    if (!title.trim()) return
    createCard({ columnId, title: title.trim() })
    setTitle('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      close()
    }
  }

  if (!isOpen) {
    return (
      <div className="px-2 pb-2">
        <button
          onClick={open}
          className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm text-muted transition-colors duration-200 hover:bg-background hover:text-accent"
        >
          + Add a card
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2 border-t border-border p-2')}>
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title..."
        rows={2}
        className={cn(inputClassName, 'resize-none')}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={submit} isLoading={isPending}>
          Add card
        </Button>
        <Button size="sm" variant="ghost" onClick={close} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
