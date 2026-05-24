import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const { id } = await params

  const deleted = await db.apiToken.deleteMany({
    where: { id, userId: user.id },
  })

  if (deleted.count === 0) {
    return err('NOT_FOUND', 'Token not found', 404)
  }

  return ok({ id })
}
