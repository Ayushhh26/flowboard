'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { useDrawerStore } from '@/stores/useDrawerStore'
import { useBoard } from '@/hooks/useBoard'
import { useUpdateCard } from '@/hooks/useUpdateCard'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { PriorityBadge } from '@/components/ui/Badge'

interface CardDrawerProps {
  boardId: string
}

export function CardDrawer({ boardId }: CardDrawerProps) {
  const { openCardId, closeCard } = useDrawerStore()
  const { data: board } = useBoard(boardId)
  const { mutate: updateCard } = useUpdateCard(boardId)

  const card = board?.columns.flatMap((c) => c.cards).find((c) => c.id === openCardId) ?? null

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
                className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col bg-white shadow-xl"
              >
                <Dialog.Title className="sr-only">{card.title}</Dialog.Title>

                {/* Header */}
                <div className="flex items-start gap-2 border-b border-gray-100 px-5 py-4">
                  <div className="flex-1">
                    <InlineEdit
                      value={card.title}
                      onSave={(t) => {
                        if (t !== card.title) updateCard({ cardId: card.id, title: t })
                      }}
                      className="text-base font-semibold text-gray-900"
                      inputClassName="text-base font-semibold"
                    />
                  </div>
                  <Dialog.Close className="mt-0.5 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
                  {/* Priority */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Priority</p>
                    <div className="flex items-center">
                      {card.priority === 'none' ? (
                        <span className="text-sm text-gray-400">No priority</span>
                      ) : (
                        <PriorityBadge priority={card.priority} />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                    <p className="text-sm text-gray-600">
                      {card.description ?? <span className="text-gray-400 italic">No description</span>}
                    </p>
                  </div>

                  {/* Timestamps */}
                  <div className="mt-auto border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                      Created {new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated {new Date(card.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
