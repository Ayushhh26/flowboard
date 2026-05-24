'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useDrawerStore } from '@/stores/useDrawerStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateCard } from '@/hooks/useUpdateCard'
import { useMoveCard } from '@/hooks/useMoveCard'
import { useCreateLabel } from '@/hooks/useCreateLabel'
import { useBoardMembers } from '@/hooks/useBoardMembers'
import { useDeleteCard } from '@/hooks/useDeleteCard'
import { useDemoStore } from '@/stores/useDemoStore'
import { computeOrderIndex } from '@/lib/fractionalIndex'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { PriorityBadge } from '@/components/ui/Badge'
import { PrioritySelect } from '@/components/ui/PrioritySelect'
import { Avatar } from '@/components/ui/Avatar'
import { LabelChip } from '@/components/ui/LabelChip'
import { Button } from '@/components/ui/Button'
import { LabelPicker } from './LabelPicker'
import { DeleteCardDialog } from './DeleteCardDialog'
import { cn } from '@/lib/cn'
import { fieldLabelClassName, inputClassName } from '@/lib/ui-colors'
import type { Board } from '@/types/board'

interface CardDrawerProps {
  boardId: string
  canEdit: boolean
}

export function CardDrawer({ boardId, canEdit }: CardDrawerProps) {
  const { openCardId, closeCard, lastOpenedCardId } = useDrawerStore()
  const queryClient = useQueryClient()
  const { data: board } = useBoard(boardId)
  const { data: membersData } = useBoardMembers(boardId)
  const { mutate: updateCard } = useUpdateCard(boardId)
  const { mutate: moveCard } = useMoveCard(boardId)
  const { mutate: createLabel } = useCreateLabel(boardId)
  const { mutate: deleteCard } = useDeleteCard(boardId)

  const card = board?.columns.flatMap((c) => c.cards).find((c) => c.id === openCardId) ?? null
  const currentColumn = board?.columns.find((c) => c.cards.some((card) => card.id === openCardId))

  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Reset draft when switching cards (remount would lose in-progress edits on the same card).
  useEffect(() => {
    if (card) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync description when open card changes
      setDescriptionDraft(card.description ?? '')
    }
  }, [card?.id, card?.description])

  function saveDescription() {
    if (!card || !canEdit) return
    const trimmed = descriptionDraft.trim()
    const next = trimmed === '' ? null : trimmed
    if (next !== card.description) {
      updateCard({ cardId: card.id, description: next })
    }
  }

  function handleStatusChange(targetColumnId: string) {
    if (!card || !board || targetColumnId === currentColumn?.id) return

    const targetCol = board.columns.find((c) => c.id === targetColumnId)
    if (!targetCol) return

    const insertIndex = targetCol.cards.length
    const newOrderIndex = computeOrderIndex(targetCol.cards, insertIndex)
    const preSnapshot = queryClient.getQueryData<Board>(['board', boardId])!

    moveCard({
      cardId: card.id,
      targetColumnId,
      newOrderIndex,
      insertIndex,
      preSnapshot,
      simulateFailure: useDemoStore.getState().simulateFailure,
    })
  }

  function handleAssigneeChange(assigneeId: string) {
    if (!card) return
    const nextId = assigneeId === '' ? null : assigneeId
    if (nextId === card.assigneeId) return

    const member = membersData?.members.find((m) => m.userId === nextId)
    updateCard({
      cardId: card.id,
      assigneeId: nextId,
      assignee: member
        ? { id: member.userId, name: member.name, email: member.email, avatarUrl: member.avatarUrl, createdAt: '' }
        : null,
    })
  }

  function handleLabelsChange(labelIds: string[]) {
    if (!card || !board) return
    const labels = (board.labels ?? []).filter((l) => labelIds.includes(l.id))
    updateCard({ cardId: card.id, labelIds, labels })
  }

  function handleCreateLabel(name: string) {
    createLabel(
      { name },
      {
        onSuccess: (label) => {
          if (card) {
            handleLabelsChange([...card.labels.map((l) => l.id), label.id])
          }
        },
      }
    )
  }

  function handleDeleteConfirm() {
    if (!card) return
    deleteCard({ cardId: card.id })
    setDeleteOpen(false)
    closeCard()
  }

  const members = membersData?.members ?? []
  const boardLabels = board?.labels ?? []

  return (
    <>
      <Dialog.Root
        open={!!openCardId}
        onOpenChange={(open) => {
          if (!open) {
            closeCard()
            requestAnimationFrame(() => {
              if (lastOpenedCardId) {
                document.getElementById(`card-${lastOpenedCardId}`)?.focus()
              }
            })
          }
        }}
      >
        <AnimatePresence>
          {openCardId && card && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-40 bg-black/20"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col border-l border-border bg-surface shadow-2xl max-md:bottom-0 max-md:top-auto max-md:h-[85vh] max-md:w-full max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t"
                >
                  <Dialog.Title className="sr-only">{card.title}</Dialog.Title>

                  <div className="flex items-start gap-2 border-b border-border bg-background/50 px-5 py-4">
                    <div className="flex-1">
                      {canEdit ? (
                        <InlineEdit
                          value={card.title}
                          onSave={(t) => {
                            if (t !== card.title) updateCard({ cardId: card.id, title: t })
                          }}
                          className="text-base font-semibold text-foreground"
                          inputClassName="text-base font-semibold"
                        />
                      ) : (
                        <h2 className="text-base font-semibold text-foreground">{card.title}</h2>
                      )}
                    </div>
                    <Dialog.Close className="mt-0.5 cursor-pointer rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-foreground/5 hover:text-muted">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="sr-only">Close</span>
                    </Dialog.Close>
                  </div>

                  <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
                    <div>
                      <p className={cn('mb-2', fieldLabelClassName)}>Status</p>
                      {canEdit ? (
                        <select
                          value={currentColumn?.id ?? ''}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className={cn(inputClassName, 'cursor-pointer')}
                        >
                          {board?.columns.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-foreground">{currentColumn?.title}</p>
                      )}
                    </div>

                    <div>
                      <p className={cn('mb-2', fieldLabelClassName)}>Assignee</p>
                      {canEdit ? (
                        <select
                          value={card.assigneeId ?? ''}
                          onChange={(e) => handleAssigneeChange(e.target.value)}
                          className={cn(inputClassName, 'cursor-pointer')}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : card.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={card.assignee.name} src={card.assignee.avatarUrl} size="sm" />
                          <span className="text-sm text-foreground">{card.assignee.name}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">Unassigned</p>
                      )}
                    </div>

                    <div>
                      <p className={cn('mb-2', fieldLabelClassName)}>Labels</p>
                      {canEdit ? (
                        <LabelPicker
                          boardLabels={boardLabels}
                          selectedIds={card.labels.map((l) => l.id)}
                          onChange={handleLabelsChange}
                          onCreateLabel={handleCreateLabel}
                        />
                      ) : card.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {card.labels.map((l) => (
                            <LabelChip key={l.id} label={l} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No labels</p>
                      )}
                    </div>

                    <div>
                      <p className={cn('mb-2', fieldLabelClassName)}>Priority</p>
                      {canEdit ? (
                        <PrioritySelect
                          value={card.priority}
                          onChange={(priority) => {
                            if (priority !== card.priority) {
                              updateCard({ cardId: card.id, priority })
                            }
                          }}
                        />
                      ) : card.priority === 'none' ? (
                        <span className="text-sm text-muted">No priority</span>
                      ) : (
                        <PriorityBadge priority={card.priority} />
                      )}
                    </div>

                    <div>
                      <p className={cn('mb-2', fieldLabelClassName)}>Description</p>
                      {canEdit ? (
                        <textarea
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          onBlur={saveDescription}
                          placeholder="Add a description..."
                          rows={6}
                          className={cn(inputClassName, 'resize-y')}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-muted">
                          {card.description ?? (
                            <span className="text-muted italic">No description</span>
                          )}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="border-t border-border pt-4">
                        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                          Delete task
                        </Button>
                      </div>
                    )}

                    <div className="mt-auto border-t border-border pt-4">
                      <p className="text-xs text-muted">
                        Created{' '}
                        {new Date(card.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted">
                        Updated{' '}
                        {new Date(card.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {card && (
        <DeleteCardDialog
          cardTitle={card.title}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}
