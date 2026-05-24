'use client'

import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/Badge'
import { LabelChip } from '@/components/ui/LabelChip'
import { useBoard } from '@/hooks/useBoard'
import { useBoardMembers } from '@/hooks/useBoardMembers'
import { useParseCard } from '@/hooks/useParseCard'
import { useSmartCreateCard } from '@/hooks/useSmartCreateCard'
import { cn } from '@/lib/cn'
import { fieldLabelClassName, inputClassName } from '@/lib/ui-colors'
import type { ParsedCardDraft } from '@/types/agent'

const MAX_TEXT = 2000
const PLACEHOLDER =
  'e.g. fix the login bug on mobile, urgent, assign to Alice, add bug label'

interface SmartAddCardDialogProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'input' | 'preview'

export function SmartAddCardDialog({ boardId, open, onOpenChange }: SmartAddCardDialogProps) {
  const { data: board } = useBoard(boardId)
  const { data: membersData } = useBoardMembers(boardId)
  const parseCard = useParseCard(boardId)
  const createFromDraft = useSmartCreateCard(boardId)

  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<ParsedCardDraft | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  function resetForm() {
    setStep('input')
    setText('')
    setDraft(null)
    setParseError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const columnTitle = useMemo(() => {
    if (!draft || !board) return null
    return board.columns.find((c) => c.id === draft.columnId)?.title ?? 'Unknown column'
  }, [draft, board])

  const assignee = useMemo(() => {
    if (!draft?.assigneeId || !membersData) return null
    return membersData.members.find((m) => m.userId === draft.assigneeId) ?? null
  }, [draft, membersData])

  const draftLabels = useMemo(() => {
    if (!draft || !board) return []
    return board.labels.filter((l) => draft.labelIds.includes(l.id))
  }, [draft, board])

  async function handleParse(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setParseError(null)
    try {
      const result = await parseCard.mutateAsync(trimmed)
      setDraft(result)
      setStep('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not parse card')
    }
  }

  async function handleConfirm() {
    if (!draft) return
    try {
      await createFromDraft.mutateAsync(draft)
      handleOpenChange(false)
    } catch {
      // toast in hook
    }
  }

  const isBusy = parseCard.isPending || createFromDraft.isPending

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
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
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface shadow-xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div>
                    <Dialog.Title className="font-display text-base font-semibold text-foreground">
                      Smart Add
                    </Dialog.Title>
                    <Dialog.Description className="mt-0.5 text-xs text-muted">
                      Describe a card in plain language — we&apos;ll fill in title, column,
                      priority, assignee, and labels.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="cursor-pointer rounded-md p-1 text-muted transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground">
                    <span className="sr-only">Close</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Dialog.Close>
                </div>

                <div className="px-5 py-4">
                  {step === 'input' ? (
                    <form onSubmit={handleParse} className="space-y-3">
                      <div>
                        <label htmlFor="smart-add-text" className={fieldLabelClassName}>
                          What do you need to track?
                        </label>
                        <textarea
                          id="smart-add-text"
                          value={text}
                          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                          placeholder={PLACEHOLDER}
                          rows={4}
                          className={cn(inputClassName, 'mt-1 w-full resize-none')}
                          disabled={isBusy}
                        />
                        <p className="mt-1 text-right text-xs text-muted">
                          {text.length}/{MAX_TEXT}
                        </p>
                      </div>
                      {parseError && (
                        <p className="text-sm text-accent" role="alert">
                          {parseError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenChange(false)}
                          disabled={isBusy}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          isLoading={parseCard.isPending}
                          disabled={!text.trim() || isBusy}
                        >
                          Preview
                        </Button>
                      </div>
                    </form>
                  ) : (
                    draft && (
                      <div className="space-y-4">
                        <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                          <div>
                            <p className={fieldLabelClassName}>Title</p>
                            <p className="mt-0.5 text-sm font-medium text-foreground">
                              {draft.title}
                            </p>
                          </div>
                          {draft.description && (
                            <div>
                              <p className={fieldLabelClassName}>Description</p>
                              <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap">
                                {draft.description}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <p className={fieldLabelClassName}>Column</p>
                              <p className="mt-0.5 text-sm text-foreground">{columnTitle}</p>
                            </div>
                            <div>
                              <p className={fieldLabelClassName}>Priority</p>
                              <div className="mt-1">
                                <PriorityBadge priority={draft.priority} />
                                {draft.priority === 'none' && (
                                  <span className="text-xs text-muted">None</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className={fieldLabelClassName}>Assignee</p>
                            {assignee ? (
                              <div className="mt-1 flex items-center gap-2">
                                <Avatar
                                  name={assignee.name}
                                  src={assignee.avatarUrl}
                                  size="sm"
                                />
                                <span className="text-sm text-foreground">{assignee.name}</span>
                              </div>
                            ) : (
                              <p className="mt-0.5 text-sm text-muted">Unassigned</p>
                            )}
                          </div>
                          {draftLabels.length > 0 && (
                            <div>
                              <p className={fieldLabelClassName}>Labels</p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {draftLabels.map((label) => (
                                  <LabelChip key={label.id} label={label} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStep('input')
                              setParseError(null)
                            }}
                            disabled={isBusy}
                          >
                            Back
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenChange(false)}
                              disabled={isBusy}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleConfirm}
                              isLoading={createFromDraft.isPending}
                              disabled={isBusy}
                            >
                              Add card
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
