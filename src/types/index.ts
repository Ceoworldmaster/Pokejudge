export type Role = 'trainer' | 'gym_leader';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  role: Role;
  rank_title: string;
  badges_count: number;
  created_at: string;
}

export interface Problem {
  id: string;
  code: string;
  title: string;
  pokemon_element: string;
  difficulty: Difficulty;
  pdf_url: string | null;
  description_markdown: string | null;
  time_limit_ms: number;
  memory_limit_mb: number;
  created_by: string | null;
  created_at: string;
}

export interface TestCase {
  id: string;
  problem_id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_by: string | null;
  created_at: string;
}

export interface ContestProblem {
  contest_id: string;
  problem_id: string;
  order_index: number;
}

export type Verdict =
  | 'Pending'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Compile Error'
  | 'Runtime Error'
  | 'Running';

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  contest_id: string | null;
  language: string;
  code: string;
  verdict: Verdict;
  runtime_ms: number | null;
  memory_kb: number | null;
  passed_test_cases: number;
  total_test_cases: number;
  created_at: string;
}

export interface SubmissionWithProfile extends Submission {
  profiles?: { username: string; avatar_url: string | null } | null;
}
