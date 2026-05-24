import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardReadAccess, boardWriteAccess } from '@/lib/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
  }

  const { id: boardId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardReadAccess(user!.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const labels = await db.label.findMany({
    where: { boardId },
    orderBy: { name: 'asc' },
    select: { id: true, boardId: true, name: true, color: true },
  })

  return ok(labels)
}

const LABEL_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#64748b',
]

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireUser()
  } catch (e) {
    if (e instanceof UnauthorizedError) return err('UNAUTHORIZED', 'Sign in required', 401)
  }

  const { id: boardId } = await params
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; color?: unknown }

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return err('VALIDATION_ERROR', 'name is required', 400)
  }

  const name = body.name.trim().slice(0, 50)
  const color =
    typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color)
      ? body.color
      : LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardWriteAccess(user!.id) },
    select: { id: true },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const label = await db.label.create({
    data: { boardId, name, color },
    select: { id: true, boardId: true, name: true, color: true },
  })

  return ok(label, 201)
}
