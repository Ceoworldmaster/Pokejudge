/*
# Auto-create profile on signup

1. Changes
- Creates a `handle_new_user` trigger function that inserts a row into `profiles`
  whenever a new user is created in `auth.users`. The username is taken from the
  user's `raw_user_meta_data` (set during signUp), defaulting to the email prefix.
- Attaches the function to a trigger on `auth.users` AFTER INSERT.
- Backfills any existing auth.users that don't yet have a profile row.

2. Security
- The trigger function runs with SECURITY DEFINER so it can write to `profiles`
  (which has RLS enabled) regardless of the caller's role.
- No changes to existing RLS policies.

3. Important notes
- This fixes the bug where signed-in users see an empty Trainer Card because
  `loadProfile()` returns null (no profile row exists for their user id).
- The `signUp` code in AuthContext previously tried to UPDATE a non-existent row;
  the trigger now handles creation, and the UPDATE in signUp will set the
  username on the freshly-created row.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, v_username)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any existing auth.users that are missing one
INSERT INTO public.profiles (id, username)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
