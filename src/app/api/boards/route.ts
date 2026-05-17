import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'

export async function POST(req: Request) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
    throw e
  }

  const body = (await req.json().catch(() => ({}))) as { name?: unknown }
  const name =
    typeof body.name === 'string' && body.name.trim() !== ''
      ? body.name.trim().slice(0, 200)
      : 'Untitled board'

  const board = await db.board.create({
    data: {
      name,
      ownerId: user.id,
      columns: {
        create: [
          { title: 'To Do', orderIndex: 1.0 },
          { title: 'In Progress', orderIndex: 2.0 },
          { title: 'Done', orderIndex: 3.0 },
        ],
      },
    },
    select: { id: true },
  })

  return ok({ id: board.id }, 201)
}
