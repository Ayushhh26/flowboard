'use client'

import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar } from '@/components/ui/Avatar'
import { focusRingClassName } from '@/lib/ui-colors'
import { cn } from '@/lib/cn'

interface UserMenuProps {
  name: string
  email: string
  avatarUrl?: string | null
}

export function UserMenu({ name, email, avatarUrl }: UserMenuProps) {
  async function handleSignOut(e: Event) {
    // Prevent Radix from closing the menu before the request finishes —
    // closing unmounts the item and would interrupt any inline form submission.
    e.preventDefault()
    await fetch('/auth/sign-out', { method: 'POST', redirect: 'manual' })
    window.location.assign('/login')
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn('cursor-pointer rounded-full', focusRingClassName)}
          aria-label="Open user menu"
        >
          <Avatar name={name} src={avatarUrl} size="md" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[12rem] rounded-lg border border-border bg-surface p-1 text-sm shadow-lg"
        >
          <div className="px-2 py-1.5">
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-foreground/5" />
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className="block cursor-pointer rounded-md px-2 py-1.5 text-foreground outline-none transition-colors duration-200 data-[highlighted]:bg-foreground/5"
            >
              My boards
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleSignOut}
            className="cursor-pointer rounded-md px-2 py-1.5 text-left text-foreground outline-none transition-colors duration-200 data-[highlighted]:bg-foreground/5"
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
