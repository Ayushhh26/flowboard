'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import type { Column } from '@/types/column'
import { Button } from '@/components/ui/Button'
import { useDeleteColumn } from '@/hooks/useDeleteColumn'
import { cn } from '@/lib/cn'
import { inputClassName } from '@/lib/ui-colors'

interface DeleteColumnDialogProps {
  column: Column
  otherColumns: Column[]
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteColumnDialog({
  column,
  otherColumns,
  boardId,
  open,
  onOpenChange,
}: DeleteColumnDialogProps) {
  const { mutate: deleteColumn, isPending } = useDeleteColumn(boardId)
  const hasCards = column.cards.length > 0
  const [moveToId, setMoveToId] = useState(otherColumns[0]?.id ?? '')
  const [deleteCards, setDeleteCards] = useState(false)

  const handleDelete = () => {
    deleteColumn(
      {
        columnId: column.id,
        moveCardsToColumnId: hasCards && !deleteCards ? moveToId : undefined,
        deleteCards: hasCards ? deleteCards : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

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
                className="fixed inset-0 z-50 bg-black/20"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-xl"
              >
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Delete &ldquo;{column.title}&rdquo;?
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted">
                  {hasCards
                    ? `This column has ${column.cards.length} task${column.cards.length === 1 ? '' : 's'}. Choose what to do with them.`
                    : 'This column is empty and will be permanently deleted.'}
                </Dialog.Description>

                {hasCards && (
                  <div className="mt-4 space-y-3">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="delete-action"
                        checked={!deleteCards}
                        onChange={() => setDeleteCards(false)}
                        className="mt-1"
                      />
                      <span className="text-sm text-foreground">
                        Move tasks to another column
                        {!deleteCards && otherColumns.length > 0 && (
                          <select
                            value={moveToId}
                            onChange={(e) => setMoveToId(e.target.value)}
                            className={cn(inputClassName, 'mt-1 block w-full text-sm')}
                          >
                            {otherColumns.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="delete-action"
                        checked={deleteCards}
                        onChange={() => setDeleteCards(true)}
                        className="mt-1"
                      />
                      <span className="text-sm text-foreground">Delete all tasks in this column</span>
                    </label>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button variant="secondary" disabled={isPending}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button variant="danger" onClick={handleDelete} isLoading={isPending}>
                    Delete column
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
