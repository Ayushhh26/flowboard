'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import type { ApiResponse } from '@/types/api'

export function CreateBoardButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function createBoard() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled board' }),
      })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error || !json.data) {
        toast.error(json.error?.message ?? 'Failed to create board')
        setSubmitting(false)
        return
      }
      router.push(`/board/${json.data.id}`)
    } catch {
      toast.error('Failed to create board')
      setSubmitting(false)
    }
  }

  return (
    <Button variant={variant} onClick={createBoard} isLoading={submitting}>
      Create board
    </Button>
  )
}
