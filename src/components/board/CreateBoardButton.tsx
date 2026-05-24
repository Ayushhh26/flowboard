'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { inputClassName } from '@/lib/ui-colors'
import type { ApiResponse } from '@/types/api'

export function CreateBoardButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setName('')
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error || !json.data) {
        toast.error(json.error?.message ?? 'Failed to create board')
        setSubmitting(false)
        return
      }
      handleOpenChange(false)
      router.push(`/board/${json.data.id}`)
    } catch {
      toast.error('Failed to create board')
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant={variant}>Create board</Button>
      </Dialog.Trigger>
      <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-40 bg-black/40"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-xl"
                >
                  <Dialog.Title className="text-base font-semibold text-foreground">
                    Create a board
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted">
                    Give your board a name. You can change it later from the board header.
                  </Dialog.Description>
                  <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-foreground">Board name</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sprint planning"
                        autoFocus
                        maxLength={200}
                        className={inputClassName}
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={submitting} disabled={!name.trim()}>
                        Create
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
