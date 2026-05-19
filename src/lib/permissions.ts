import 'server-only'
import { db } from '@/lib/db'
import { MemberRole } from '@/generated/prisma/client'

export type ViewerRole = 'owner' | 'editor' | 'viewer'

// Reusable Prisma `where` fragments for Board access.
// Use the helper that matches the operation:
//   - boardReadAccess  → GET / read-only (owner OR any member)
//   - boardWriteAccess → POST/PATCH/DELETE on board contents (owner OR editor member)
//   - boardOwnerAccess → membership management or board deletion (owner only)
export function boardReadAccess(userId: string) {
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  }
}

export function boardWriteAccess(userId: string) {
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId, role: MemberRole.editor } } },
    ],
  }
}

export function boardOwnerAccess(userId: string) {
  return { ownerId: userId }
}

// Resolves the caller's role on a given board for use in API responses and
// SSR pages. Returns null if the caller has no access — callers should treat
// null the same as "board does not exist" (404).
export async function resolveViewerRole(
  boardId: string,
  userId: string
): Promise<ViewerRole | null> {
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: {
      ownerId: true,
      members: { where: { userId }, select: { role: true } },
    },
  })
  if (!board) return null
  if (board.ownerId === userId) return 'owner'
  const membership = board.members[0]
  return membership ? membership.role : null
}
