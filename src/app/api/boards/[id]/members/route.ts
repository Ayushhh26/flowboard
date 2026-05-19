import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { requireUser, UnauthorizedError } from '@/lib/auth'
import { boardReadAccess, boardOwnerAccess } from '@/lib/permissions'
import { MemberRole } from '@/generated/prisma/client'

type ApiMember = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: 'owner' | 'editor' | 'viewer'
}

type ApiInvitation = {
  id: string
  email: string
  role: 'editor' | 'viewer'
  createdAt: string
}

// GET: list members + (owner-only) pending invitations.
// Anyone on the board can see members. Only the owner sees pending invitations.
export async function GET(
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

  const { id: boardId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardReadAccess(user.id) },
    select: {
      ownerId: true,
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const isOwner = board.ownerId === user.id

  const members: ApiMember[] = [
    {
      userId: board.owner.id,
      name: board.owner.name,
      email: board.owner.email,
      avatarUrl: board.owner.avatarUrl,
      role: 'owner',
    },
    ...board.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role as 'editor' | 'viewer',
    })),
  ]

  let invitations: ApiInvitation[] = []
  if (isOwner) {
    const rows = await db.boardInvitation.findMany({
      where: { boardId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    invitations = rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as 'editor' | 'viewer',
      createdAt: row.createdAt.toISOString(),
    }))
  }

  return ok({ members, invitations })
}

// POST: invite a user by email.
// If the email matches an existing User, insert a BoardMember directly.
// Otherwise insert a BoardInvitation; the auth trigger claims it on signup.
export async function POST(
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

  const { id: boardId } = await params

  const board = await db.board.findFirst({
    where: { id: boardId, ...boardOwnerAccess(user.id) },
    select: { id: true, ownerId: true, owner: { select: { email: true } } },
  })
  if (!board) return err('NOT_FOUND', 'Board not found', 404)

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown
    role?: unknown
  }

  if (!body.email || typeof body.email !== 'string') {
    return err('VALIDATION_ERROR', 'email is required', 400)
  }
  if (body.role !== 'editor' && body.role !== 'viewer') {
    return err('VALIDATION_ERROR', "role must be 'editor' or 'viewer'", 400)
  }

  const email = body.email.trim().toLowerCase()
  const role = body.role as MemberRole

  if (email === board.owner.email.toLowerCase()) {
    return err('INVALID_OPERATION', "You can't invite the board owner", 400)
  }

  const existingUser = await db.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })

  if (existingUser) {
    const alreadyMember = await db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: existingUser.id } },
      select: { userId: true },
    })
    if (alreadyMember) {
      return err('ALREADY_MEMBER', 'This user is already a member of the board', 409)
    }

    await db.boardMember.create({
      data: { boardId, userId: existingUser.id, role },
    })

    return ok(
      {
        kind: 'added' as const,
        member: {
          userId: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          avatarUrl: existingUser.avatarUrl,
          role,
        },
      },
      201
    )
  }

  // No matching user — create or refresh a pending invitation
  const invitation = await db.boardInvitation.upsert({
    where: { boardId_email: { boardId, email } },
    create: { boardId, email, role, invitedBy: user.id },
    update: { role, invitedBy: user.id },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  return ok(
    {
      kind: 'invited' as const,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as 'editor' | 'viewer',
        createdAt: invitation.createdAt.toISOString(),
      },
    },
    201
  )
}
