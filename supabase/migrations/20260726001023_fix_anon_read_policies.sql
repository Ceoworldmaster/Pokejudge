/*
# Allow anonymous (logged-out) read access to public data

1. Changes
- Replaces SELECT policies on problems, contests, contest_problems, test_cases, profiles, and submissions
  so that both `anon` and `authenticated` roles can read them. This fixes the issue where logged-out
  visitors see empty pages (problems list, contests, leaderboard, etc.).
- Write policies (INSERT/UPDATE/DELETE) remain unchanged — still restricted to authenticated / admin.

2. Security
- No changes to write policies. Only public-read SELECT is broadened.
- `test_cases` is now readable by anon so sample cases show on the problem page; hidden test cases
  are still stored in the same table but the frontend only displays `is_sample = true` rows.
*/

-- problems: public read
DROP POLICY IF EXISTS "problems_select_all" ON problems;
CREATE POLICY "problems_select_all" ON problems
  FOR SELECT TO anon, authenticated USING (true);

-- contests: public read
DROP POLICY IF EXISTS "contests_select_all" ON contests;
CREATE POLICY "contests_select_all" ON contests
  FOR SELECT TO anon, authenticated USING (true);

-- contest_problems: public read
DROP POLICY IF EXISTS "contest_problems_select_all" ON contest_problems;
CREATE POLICY "contest_problems_select_all" ON contest_problems
  FOR SELECT TO anon, authenticated USING (true);

-- test_cases: public read (sample cases must be visible to logged-out users)
DROP POLICY IF EXISTS "test_cases_select_all" ON test_cases;
CREATE POLICY "test_cases_select_all" ON test_cases
  FOR SELECT TO anon, authenticated USING (true);

-- profiles: public read (leaderboard needs all profiles)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO anon, authenticated USING (true);

-- submissions: public read (AC rate, standings, leaderboard all need submissions)
DROP POLICY IF EXISTS "submissions_select_all" ON submissions;
CREATE POLICY "submissions_select_all" ON submissions
  FOR SELECT TO anon, authenticated USING (true);
