'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useSmartAddEnabled } from '@/hooks/useSmartAddEnabled'
import { SmartAddCardDialog } from './SmartAddCardDialog'

interface SmartAddButtonProps {
  boardId: string
}

export function SmartAddButton({ boardId }: SmartAddButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: enabled } = useSmartAddEnabled()

  if (enabled === false) return null

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Smart Add
      </Button>
      <SmartAddCardDialog boardId={boardId} open={open} onOpenChange={setOpen} />
    </>
  )
}
