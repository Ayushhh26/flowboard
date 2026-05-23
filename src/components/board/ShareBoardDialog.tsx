'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import {
  useBoardMembers,
  useInviteMember,
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
} from '@/hooks/useBoardMembers'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { cn } from '@/lib/cn'
import { fieldLabelClassName, inputClassName } from '@/lib/ui-colors'

interface ShareBoardDialogProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareBoardDialog({ boardId, open, onOpenChange }: ShareBoardDialogProps) {
  const { data, isLoading } = useBoardMembers(boardId)
  const invite = useInviteMember(boardId)
  const updateRole = useUpdateMemberRole(boardId)
  const removeMember = useRemoveMember(boardId)
  const revokeInvitation = useRevokeInvitation(boardId)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    try {
      await invite.mutateAsync({ email: trimmed, role })
      setEmail('')
    } catch {
      // toast handled in the hook
    }
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
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white shadow-xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold text-gray-900">
                      Share this board
                    </Dialog.Title>
                    <Dialog.Description className="mt-0.5 text-xs text-gray-500">
                      Add collaborators by email. Editors can move cards; viewers are read-only.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleInvite} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="collaborator@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(inputClassName, 'flex-1 py-1.5')}
                      autoComplete="off"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                      className={cn(inputClassName, 'w-auto py-1.5')}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <Button type="submit" variant="primary" size="sm" isLoading={invite.isPending}>
                      Invite
                    </Button>
                  </div>
                </form>

                <div className="border-t border-gray-100 px-5 py-3">
                  <h3 className={fieldLabelClassName}>Members</h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {isLoading && <li className="text-xs text-gray-400">Loading…</li>}
                    {data?.members.map((m) => (
                      <li key={m.userId} className="flex items-center gap-3">
                        <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                          <p className="truncate text-xs text-gray-500">{m.email}</p>
                        </div>
                        {m.role === 'owner' ? (
                          <RoleBadge role="owner" />
                        ) : (
                          <>
                            <select
                              value={m.role}
                              onChange={(e) =>
                                updateRole.mutate({ userId: m.userId, role: e.target.value as 'editor' | 'viewer' })
                              }
                              className={cn(inputClassName, 'w-auto py-1 text-xs')}
                              disabled={updateRole.isPending}
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              onClick={() => removeMember.mutate({ userId: m.userId })}
                              disabled={removeMember.isPending}
                              className={cn(
                                'rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50',
                                removeMember.isPending && 'opacity-50'
                              )}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {data && data.invitations.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 pb-5">
                    <h3 className={fieldLabelClassName}>Pending invitations</h3>
                    <ul className="mt-2 flex flex-col gap-2">
                      {data.invitations.map((inv) => (
                        <li key={inv.id} className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-700">{inv.email}</p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <RoleBadge role="pending" />
                              <RoleBadge role={inv.role} />
                            </div>
                          </div>
                          <button
                            onClick={() => revokeInvitation.mutate({ invitationId: inv.id })}
                            disabled={revokeInvitation.isPending}
                            className={cn(
                              'rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50',
                              revokeInvitation.isPending && 'opacity-50'
                            )}
                          >
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
