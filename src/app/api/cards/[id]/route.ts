import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import type { UpdateCardPayload } from '@/types/card'

export async function PATCH(
  req: Request,
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
  const body: UpdateCardPayload = await req.json()

  const card = await db.card.findFirst({
    where: { id, column: { board: { ownerId: user.id } } },
    select: { id: true },
  })
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  const updated = await db.card.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
    include: { assignee: true, labels: { include: { label: true } } },
  })

  return ok({ ...updated, labels: updated.labels.map((cl) => cl.label) })
}

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

  const card = await db.card.findFirst({
    where: { id, column: { board: { ownerId: user.id } } },
    select: { id: true },
  })
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  await db.card.delete({ where: { id } })

  return ok({ id })
}
