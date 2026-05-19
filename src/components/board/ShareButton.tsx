'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ShareBoardDialog } from './ShareBoardDialog'

interface ShareButtonProps {
  boardId: string
}

export function ShareButton({ boardId }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Share
      </Button>
      <ShareBoardDialog boardId={boardId} open={open} onOpenChange={setOpen} />
    </>
  )
}
