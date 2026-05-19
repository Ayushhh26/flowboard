import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardOwnerAccess } from '@/lib/permissions'

// DELETE: revoke a pending invitation. Owner-only.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id: boardId, invitationId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardOwnerAccess(user.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const invitation = await db.boardInvitation.findFirst({
    where: { id: invitationId, boardId },
    select: { id: true },
  })
  if (!invitation) return err('NOT_FOUND', 'Invitation not found', 404)

  await db.boardInvitation.delete({ where: { id: invitationId } })

  return ok({ id: invitationId })
}
