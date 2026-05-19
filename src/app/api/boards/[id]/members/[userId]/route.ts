import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardOwnerAccess } from '@/lib/permissions'
import { MemberRole } from '@/generated/prisma/client'

// PATCH: change a member's role. Owner-only. Cannot target the owner.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id: boardId, userId: targetUserId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardOwnerAccess(user.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  if (targetUserId === user.id) {
    return err('INVALID_OPERATION', "You can't change your own role on a board you own", 400)
  }

  const body = (await req.json().catch(() => ({}))) as { role?: unknown }
  if (body.role !== 'editor' && body.role !== 'viewer') {
    return err('VALIDATION_ERROR', "role must be 'editor' or 'viewer'", 400)
  }

  const updated = await db.boardMember.update({
    where: { boardId_userId: { boardId, userId: targetUserId } },
    data: { role: body.role as MemberRole },
    select: {
      userId: true,
      role: true,
      user: { select: { name: true, email: true, avatarUrl: true } },
    },
  })

  return ok({
    userId: updated.userId,
    name: updated.user.name,
    email: updated.user.email,
    avatarUrl: updated.user.avatarUrl,
    role: updated.role as 'editor' | 'viewer',
  })
}

// DELETE: remove a member. Owner-only. Cannot target the owner.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id: boardId, userId: targetUserId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardOwnerAccess(user.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  if (targetUserId === user.id) {
    return err('INVALID_OPERATION', "You can't remove yourself from a board you own", 400)
  }

  const existing = await db.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: targetUserId } },
    select: { userId: true },
  })
  if (!existing) return err('NOT_FOUND', 'Member not found', 404)

  await db.boardMember.delete({
    where: { boardId_userId: { boardId, userId: targetUserId } },
  })

  return ok({ userId: targetUserId })
}
