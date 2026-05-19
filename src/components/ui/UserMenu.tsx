'use client'

import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar } from '@/components/ui/Avatar'

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
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label="Open user menu"
        >
          <Avatar name={name} src={avatarUrl} size="md" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[12rem] rounded-md border border-gray-200 bg-white p-1 text-sm shadow-md"
        >
          <div className="px-2 py-1.5">
            <p className="truncate font-medium text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className="block cursor-pointer rounded px-2 py-1.5 text-gray-700 outline-none data-[highlighted]:bg-gray-100"
            >
              My boards
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleSignOut}
            className="cursor-pointer rounded px-2 py-1.5 text-left text-gray-700 outline-none data-[highlighted]:bg-gray-100"
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
