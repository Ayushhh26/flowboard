'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { useDrawerStore } from '@/stores/useDrawerStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateCard } from '@/hooks/useUpdateCard'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { PriorityBadge } from '@/components/ui/Badge'
import { PrioritySelect } from '@/components/ui/PrioritySelect'
import { cn } from '@/lib/cn'
import { fieldLabelClassName, inputClassName } from '@/lib/ui-colors'

interface CardDrawerProps {
  boardId: string
  canEdit: boolean
}

export function CardDrawer({ boardId, canEdit }: CardDrawerProps) {
  const { openCardId, closeCard } = useDrawerStore()
  const { data: board } = useBoard(boardId)
  const { mutate: updateCard } = useUpdateCard(boardId)

  const card = board?.columns.flatMap((c) => c.cards).find((c) => c.id === openCardId) ?? null

  const [descriptionDraft, setDescriptionDraft] = useState('')

  useEffect(() => {
    if (card) setDescriptionDraft(card.description ?? '')
  }, [card?.id, card?.description])

  function saveDescription() {
    if (!card || !canEdit) return
    const trimmed = descriptionDraft.trim()
    const next = trimmed === '' ? null : trimmed
    if (next !== card.description) {
      updateCard({ cardId: card.id, description: next })
    }
  }

  return (
    <Dialog.Root open={!!openCardId} onOpenChange={(open) => !open && closeCard()}>
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
                className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl"
              >
                <Dialog.Title className="sr-only">{card.title}</Dialog.Title>

                <div className="flex items-start gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                  <div className="flex-1">
                    {canEdit ? (
                      <InlineEdit
                        value={card.title}
                        onSave={(t) => {
                          if (t !== card.title) updateCard({ cardId: card.id, title: t })
                        }}
                        className="text-base font-semibold text-slate-900"
                        inputClassName="text-base font-semibold"
                      />
                    ) : (
                      <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
                    )}
                  </div>
                  <Dialog.Close className="mt-0.5 cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </div>

                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
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
                      <span className="text-sm text-slate-500">No priority</span>
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
                      <p className="text-sm leading-relaxed text-slate-600">
                        {card.description ?? (
                          <span className="text-slate-400 italic">No description</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">
                      Created{' '}
                      {new Date(card.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
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
  )
}
