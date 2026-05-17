-- This migration requires a Supabase-shaped database. It references auth.users,
-- which only exists when Supabase Auth is installed. `prisma migrate reset` runs
-- every migration in order, so against a vanilla Postgres (e.g. CI) it will fail
-- here. The project's only target environment is Supabase — see README for setup.
--
-- IMPORTANT: if the User table grows another required column without a default,
-- this trigger must be updated in the same migration or signup will fail with a
-- NULL violation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "createdAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
