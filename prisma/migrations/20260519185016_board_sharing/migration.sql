-- This migration assumes a Supabase-shaped database. It updates auth.users
-- trigger and references the supabase_realtime publication's existing RLS
-- policies. Running against vanilla Postgres will fail.
--
-- Two new tables:
--   - BoardMember: user-on-board access with MemberRole (editor | viewer)
--   - BoardInvitation: pending invites keyed by email; claimed by the auth
--     trigger when the invitee signs up
--
-- The Card RLS SELECT policy is broadened to OR in member access so Realtime
-- delivers events to editors and viewers, not just owners.
--
-- GRANT SELECT on BoardMember is REQUIRED for the broadened RLS policy's
-- EXISTS subquery to succeed under the authenticated role — without it,
-- Realtime silently drops events (same failure mode as the original realtime
-- migration). NO GRANT on BoardInvitation: it would expose all pending invites
-- to any logged-in client; reads happen via API only.

-- 1. Enum
CREATE TYPE "MemberRole" AS ENUM ('editor', 'viewer');

-- 2. BoardMember table
CREATE TABLE "BoardMember" (
    "boardId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("boardId", "userId")
);

CREATE INDEX "BoardMember_userId_idx" ON "BoardMember"("userId");

ALTER TABLE "BoardMember"
  ADD CONSTRAINT "BoardMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BoardMember"
  ADD CONSTRAINT "BoardMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. BoardInvitation table
CREATE TABLE "BoardInvitation" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "MemberRole" NOT NULL,
    "invitedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoardInvitation_boardId_email_key" ON "BoardInvitation"("boardId", "email");
CREATE INDEX "BoardInvitation_email_idx" ON "BoardInvitation"("email");

ALTER TABLE "BoardInvitation"
  ADD CONSTRAINT "BoardInvitation_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BoardInvitation"
  ADD CONSTRAINT "BoardInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. GRANTs — BoardMember only (BoardInvitation stays server-only)
GRANT SELECT ON public."BoardMember" TO authenticated;

-- 5. Extend Card SELECT policy to include members
DROP POLICY IF EXISTS "card_select_by_board_owner" ON public."Card";

CREATE POLICY "card_select_by_board_access"
  ON public."Card"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Column" col
      JOIN public."Board" b ON b.id = col."boardId"
      WHERE col.id = public."Card"."columnId"
        AND (
          b."ownerId" = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public."BoardMember" bm
            WHERE bm."boardId" = b.id AND bm."userId" = auth.uid()
          )
        )
    )
  );

-- 6. Update handle_new_user() to also claim pending invitations.
-- The on_auth_user_created trigger itself doesn't change — same trigger,
-- new function body.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mirror the auth user into public."User"
  INSERT INTO public."User" (id, email, name, "createdAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    now()
  );

  -- Claim any pending invitations matching this email (case-insensitive)
  INSERT INTO public."BoardMember" ("boardId", "userId", role, "createdAt")
  SELECT inv."boardId", NEW.id, inv.role, now()
  FROM public."BoardInvitation" inv
  WHERE lower(inv.email) = lower(NEW.email)
  ON CONFLICT ("boardId", "userId") DO NOTHING;

  DELETE FROM public."BoardInvitation"
  WHERE lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$$;
