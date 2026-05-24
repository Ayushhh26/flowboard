'use client'

import { useState } from 'react'
import { useSmartAddEnabled } from '@/hooks/useSmartAddEnabled'
import { cn } from '@/lib/cn'
import { focusRingClassName } from '@/lib/ui-colors'
import { Tooltip } from '@/components/ui/Tooltip'
import { SmartAddCardDialog } from './SmartAddCardDialog'

interface SmartAddButtonProps {
  boardId: string
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M9.5 2.5 11 8l5.5 1.5L11 11l-1.5 5.5L8 11 2.5 9.5 8 8l1.5-5.5L11 2.5z" />
      <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  )
}

/**
 * Circular AI / chat-style FAB for Smart Add (not a header or column affordance).
 */
export function SmartAddButton({ boardId }: SmartAddButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: enabled } = useSmartAddEnabled()

  if (enabled === false) return null

  return (
    <>
      <Tooltip content="Smart add — describe a task in plain language" side="left">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Smart add — describe a task in plain language"
          className={cn(
            'smart-add-fab group relative absolute bottom-8 right-6 z-40',
            'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full',
            'bg-gradient-to-br from-accent to-accent-hover text-white',
            'ring-4 ring-accent-ring/70 ring-offset-2 ring-offset-canvas',
            'shadow-[0_6px_24px_-4px_color-mix(in_srgb,var(--accent)_55%,transparent)]',
            'transition-[transform,box-shadow,ring-color] duration-200',
            'hover:scale-105 hover:shadow-[0_8px_28px_-2px_color-mix(in_srgb,var(--accent)_60%,transparent)]',
            'active:scale-100',
            'max-md:bottom-6 max-md:right-4 max-md:h-12 max-md:w-12',
            focusRingClassName
          )}
        >
          <SparkleIcon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 max-md:h-5 max-md:w-5" />
        </button>
      </Tooltip>
      <SmartAddCardDialog boardId={boardId} open={open} onOpenChange={setOpen} />
    </>
  )
}
