/*
# PokéJudge / PokéCode — Initial Schema

1. New Tables
- `profiles`: user profile linked to auth.users. id, username, avatar_url, role ('trainer' | 'gym_leader'), rank_title, badges_count, created_at. First registered user becomes gym_leader (admin); all others trainer.
- `problems`: competitive programming problems. code (unique short id), title, pokemon_element, difficulty, pdf_url, description_markdown, time_limit_ms, memory_limit_mb, created_by.
- `test_cases`: input/expected output pairs per problem, with is_sample flag.
- `contests`: timed contests with start/end times.
- `contest_problems`: join table linking contests to problems with order_index.
- `submissions`: user code submissions with verdict, runtime, memory, pass counts.

2. Security (RLS)
- profiles: readable by all authenticated; update own profile; gym_leader can update any.
- problems: readable by all authenticated; insert/update/delete by gym_leader only.
- test_cases: readable by all authenticated (needed for judging display of samples); insert/update/delete by gym_leader only.
- contests: readable by all authenticated; insert/update/delete by gym_leader only.
- contest_problems: readable by all authenticated; insert/update/delete by gym_leader only.
- submissions: readable by all authenticated (public leaderboard); insert by owner; update/delete by owner or gym_leader.
- Storage bucket `problem-pdfs` created as public; gym_leader can upload.

3. Notes
- Trigger `handle_new_user` auto-creates a profile row on auth signup; first user becomes gym_leader.
- `rank_title` defaults to 'Novice Trainer'.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'trainer' CHECK (role IN ('trainer','gym_leader')),
  rank_title text NOT NULL DEFAULT 'Novice Trainer',
  badges_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- problems ----------
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  pokemon_element text NOT NULL DEFAULT 'Normal',
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard','expert')),
  pdf_url text,
  description_markdown text,
  time_limit_ms integer NOT NULL DEFAULT 1000,
  memory_limit_mb integer NOT NULL DEFAULT 256,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "problems_select_all" ON problems;
CREATE POLICY "problems_select_all" ON problems FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "problems_insert_admin" ON problems;
CREATE POLICY "problems_insert_admin" ON problems FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "problems_update_admin" ON problems;
CREATE POLICY "problems_update_admin" ON problems FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "problems_delete_admin" ON problems;
CREATE POLICY "problems_delete_admin" ON problems FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- test_cases ----------
CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input_data text NOT NULL DEFAULT '',
  expected_output text NOT NULL DEFAULT '',
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "test_cases_select_all" ON test_cases;
CREATE POLICY "test_cases_select_all" ON test_cases FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "test_cases_insert_admin" ON test_cases;
CREATE POLICY "test_cases_insert_admin" ON test_cases FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "test_cases_update_admin" ON test_cases;
CREATE POLICY "test_cases_update_admin" ON test_cases FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "test_cases_delete_admin" ON test_cases;
CREATE POLICY "test_cases_delete_admin" ON test_cases FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- contests ----------
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contests_select_all" ON contests;
CREATE POLICY "contests_select_all" ON contests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "contests_insert_admin" ON contests;
CREATE POLICY "contests_insert_admin" ON contests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "contests_update_admin" ON contests;
CREATE POLICY "contests_update_admin" ON contests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "contests_delete_admin" ON contests;
CREATE POLICY "contests_delete_admin" ON contests FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- contest_problems ----------
CREATE TABLE IF NOT EXISTS contest_problems (
  contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  PRIMARY KEY (contest_id, problem_id)
);
ALTER TABLE contest_problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contest_problems_select_all" ON contest_problems;
CREATE POLICY "contest_problems_select_all" ON contest_problems FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "contest_problems_insert_admin" ON contest_problems;
CREATE POLICY "contest_problems_insert_admin" ON contest_problems FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "contest_problems_update_admin" ON contest_problems;
CREATE POLICY "contest_problems_update_admin" ON contest_problems FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "contest_problems_delete_admin" ON contest_problems;
CREATE POLICY "contest_problems_delete_admin" ON contest_problems FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- submissions ----------
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  contest_id uuid REFERENCES contests(id) ON DELETE SET NULL,
  language text NOT NULL,
  code text NOT NULL DEFAULT '',
  verdict text NOT NULL DEFAULT 'Pending',
  runtime_ms integer,
  memory_kb integer,
  passed_test_cases integer NOT NULL DEFAULT 0,
  total_test_cases integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_select_all" ON submissions;
CREATE POLICY "submissions_select_all" ON submissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;
CREATE POLICY "submissions_insert_own" ON submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "submissions_update_own_admin" ON submissions;
CREATE POLICY "submissions_update_own_admin" ON submissions FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "submissions_delete_own_admin" ON submissions;
CREATE POLICY "submissions_delete_own_admin" ON submissions FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_contest ON submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest ON contest_problems(contest_id);

-- ---------- storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('problem-pdfs', 'problem-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- storage policies ----------
DROP POLICY IF EXISTS "problem_pdfs_read" ON storage.objects;
CREATE POLICY "problem_pdfs_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'problem-pdfs');

DROP POLICY IF EXISTS "problem_pdfs_upload" ON storage.objects;
CREATE POLICY "problem_pdfs_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'problem-pdfs'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "problem_pdfs_update_admin" ON storage.objects;
CREATE POLICY "problem_pdfs_update_admin" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'problem-pdfs'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  ) WITH CHECK (
    bucket_id = 'problem-pdfs'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

DROP POLICY IF EXISTS "problem_pdfs_delete_admin" ON storage.objects;
CREATE POLICY "problem_pdfs_delete_admin" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'problem-pdfs'
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gym_leader')
  );

-- ---------- handle_new_user trigger ----------
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
  -- Determine if this is the first user
  SELECT count(*) = 0 INTO is_first FROM profiles;
  new_role := CASE WHEN is_first THEN 'gym_leader' ELSE 'trainer' END;

  -- Build a unique username from email
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

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
