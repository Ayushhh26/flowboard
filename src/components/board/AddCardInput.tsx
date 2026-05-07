'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useCreateCard } from '@/hooks/useCreateCard'

interface AddCardInputProps {
  columnId: string
  boardId: string
}

export function AddCardInput({ columnId, boardId }: AddCardInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: createCard } = useCreateCard(boardId)

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
          className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          + Add a card
        </button>
      </div>
    )
  }

  return (
    <div className={cn('border-t border-gray-100 p-2 flex flex-col gap-2')}>
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title..."
        rows={2}
        className="w-full resize-none rounded-lg border border-blue-400 p-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          Add card
        </button>
        <button
          onClick={close}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
