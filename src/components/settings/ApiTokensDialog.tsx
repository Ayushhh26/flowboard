'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from '@/hooks/useApiTokens'
import { cn } from '@/lib/cn'
import { fieldLabelClassName, inputClassName } from '@/lib/ui-colors'

interface ApiTokensDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiTokensDialog({ open, onOpenChange }: ApiTokensDialogProps) {
  const { data: tokens, isLoading } = useApiTokens()
  const createToken = useCreateApiToken()
  const revokeToken = useRevokeApiToken()

  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const created = await createToken.mutateAsync(trimmed)
      setNewToken(created.token)
      setName('')
    } catch {
      // toast in hook
    }
  }

  function handleClose() {
    setNewToken(null)
    onOpenChange(false)
  }

  async function copyToken() {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-foreground/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <Dialog.Title className="font-display text-lg font-semibold text-foreground">
                  API tokens
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted">
                  Create tokens for MCP clients (Cursor, Claude Code). Tokens use the same board
                  permissions as your account.
                </Dialog.Description>

                {newToken ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Copy your token now</p>
                    <p className="text-xs text-muted">
                      This is the only time the full token is shown. Store it as{' '}
                      <code className="rounded bg-foreground/5 px-1">FLOWBOARD_API_TOKEN</code> in
                      your MCP config.
                    </p>
                    <pre
                      className={cn(
                        'max-h-24 overflow-auto break-all rounded-md border border-border bg-background p-2 text-xs text-foreground'
                      )}
                    >
                      {newToken}
                    </pre>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={copyToken}>
                        Copy token
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setNewToken(null)}>
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreate} className="mt-4 space-y-3">
                    <div>
                      <label htmlFor="token-name" className={fieldLabelClassName}>
                        Token name
                      </label>
                      <input
                        id="token-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Cursor MCP"
                        className={cn(inputClassName, 'mt-1 w-full')}
                        maxLength={100}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={createToken.isPending}
                      disabled={!name.trim()}
                    >
                      Create token
                    </Button>
                  </form>
                )}

                <div className="mt-6 border-t border-border pt-4">
                  <p className={fieldLabelClassName}>Your tokens</p>
                  {isLoading ? (
                    <p className="mt-2 text-sm text-muted">Loading…</p>
                  ) : !tokens?.length ? (
                    <p className="mt-2 text-sm text-muted">No tokens yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {tokens.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{t.name}</p>
                            <p className="text-xs text-muted">
                              Created {new Date(t.createdAt).toLocaleDateString()}
                              {t.lastUsedAt
                                ? ` · Last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-accent"
                            onClick={() => revokeToken.mutate(t.id)}
                            disabled={revokeToken.isPending}
                          >
                            Revoke
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                      Close
                    </Button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
