import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// Escape hatch for the rare "JWT valid but no public.User row" state.
// The signup trigger normally prevents this; this route resets the session
// if it ever happens so the user can sign up again cleanly.
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url), { status: 303 })
  }

  const profile = await db.user.findUnique({ where: { id: user.id }, select: { id: true } })

  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/signup', request.url), { status: 303 })
  }

  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
