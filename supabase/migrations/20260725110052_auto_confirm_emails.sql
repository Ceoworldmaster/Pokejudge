/*
# Auto-confirm user emails

1. Changes
- Updates the `handle_new_user` trigger function to set `email_confirmed_at` on the newly created auth.users row, so users are immediately confirmed upon signup (no email verification required).
- Confirms any existing unconfirmed users retroactively.
- Note: `confirmed_at` is a generated column derived from `email_confirmed_at`, so we only set the latter.

2. Security
- No RLS changes.
- This makes email confirmation effectively OFF for this project, which is the intended behavior.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first boolean;
  new_role text;
  base_username text;
  candidate text;
  suffix integer;
BEGIN
  SELECT count(*) = 0 INTO is_first FROM profiles;
  new_role := CASE WHEN is_first THEN 'gym_leader' ELSE 'trainer' END;

  base_username := split_part(new.email, '@', 1);
  candidate := base_username;
  suffix := 1;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  END LOOP;

  INSERT INTO profiles (id, username, role, rank_title)
  VALUES (new.id, candidate, new_role,
    CASE WHEN is_first THEN 'Gym Leader' ELSE 'Novice Trainer' END);

  -- Auto-confirm the email so the user can sign in immediately
  IF new.email_confirmed_at IS NULL THEN
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirm any existing unconfirmed users retroactively
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
