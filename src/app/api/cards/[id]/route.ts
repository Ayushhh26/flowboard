import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const card = await db.card.findUnique({ where: { id }, select: { id: true } })
  if (!card) return err('NOT_FOUND', 'Card not found', 404)

  await db.card.delete({ where: { id } })

  return ok({ id })
}
