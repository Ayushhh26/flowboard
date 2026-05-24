'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface DeleteCardDialogProps {
  cardTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function DeleteCardDialog({
  cardTitle,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteCardDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/20"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
              >
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  Delete task?
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-slate-600">
                  &ldquo;{cardTitle}&rdquo; will be removed. You can undo within 5 seconds.
                </Dialog.Description>
                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button variant="secondary" disabled={isPending}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button variant="danger" onClick={onConfirm} isLoading={isPending}>
                    Delete
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
