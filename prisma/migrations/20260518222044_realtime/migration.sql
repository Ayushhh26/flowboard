-- This migration assumes a Supabase-shaped database. It uses auth.uid() and
-- ALTER PUBLICATION supabase_realtime, both of which only exist on Supabase.
-- Running this migration against vanilla Postgres will fail.
--
-- RLS on Card gates *subscription reads* via Realtime. API route writes still
-- go through the Prisma adapter (which connects as a privileged role and
-- bypasses RLS) — ownership on writes is enforced in the API route handlers'
-- nested where filters, not at the database layer.

-- 1. Enable RLS on Card. Required by Supabase Realtime for tables in the
--    supabase_realtime publication.
ALTER TABLE public."Card" ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy: a user can read a card if they own the board it belongs
--    to. The join goes Card.columnId → Column.boardId → Board.ownerId.
CREATE POLICY "card_select_by_board_owner"
  ON public."Card"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."Column" col
      JOIN public."Board" b ON b.id = col."boardId"
      WHERE col.id = public."Card"."columnId"
        AND b."ownerId" = auth.uid()
    )
  );

-- 3. Add Card to the Realtime publication so logical replication streams
--    INSERT / UPDATE / DELETE events to subscribed clients.
ALTER PUBLICATION supabase_realtime ADD TABLE public."Card";
