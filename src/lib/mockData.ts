import type { Problem, TestCase, Contest } from '@/types';

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'mock-pkm01',
    code: 'PKM01',
    title: 'Pikachu Lightning Charge',
    pokemon_element: 'Electric',
    difficulty: 'easy',
    pdf_url: null,
    description_markdown: `# Pikachu Lightning Charge

Pikachu needs to charge up by absorbing **N** lightning bolts. Given a list of bolt energies, output the total charge.

## Input
- First line: integer **N** ($1 \\le N \\le 10^5$)
- Second line: **N** space-separated integers $a_i$ ($1 \\le a_i \\le 10^9$)

## Output
- A single integer: the sum of all bolt energies.

## Sample
| Input | Output |
|-------|--------|
| \`3\n1 2 3\` | \`6\` |

## Constraints
- $1 \\le N \\le 10^5$
- $1 \\le a_i \\le 10^9$`,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'mock-fire02',
    code: 'FIRE02',
    title: 'Charmander Greedy Flame',
    pokemon_element: 'Fire',
    difficulty: 'medium',
    pdf_url: null,
    description_markdown: `# Charmander Greedy Flame

Charmander has **N** logs of varying lengths. He can merge two adjacent logs with cost equal to their combined length. Find the minimum total cost to merge all logs into one.

This is the classic **optimal merge** — use a min-heap (greedy).

## Input
- First line: integer **N**
- Second line: **N** integers (log lengths)

## Output
- Minimum total merge cost.

## Sample
| Input | Output |
|-------|--------|
| \`4\n4 3 2 6\` | \`29\` |`,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'mock-water03',
    code: 'WTR03',
    title: 'Squirtle Two-Pointer Splash',
    pokemon_element: 'Water',
    difficulty: 'medium',
    pdf_url: null,
    description_markdown: `# Squirtle Two-Pointer Splash

Given a sorted array, count the number of pairs $(i, j)$ such that $a_i + a_j = K$.

Use the **two-pointer** technique.

## Input
- First line: **N** and **K**
- Second line: **N** sorted integers

## Output
- Number of valid pairs.

## Sample
| Input | Output |
|-------|--------|
| \`5 6\n1 2 3 4 5\` | \`2\``,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'mock-psy04',
    code: 'PSY04',
    title: 'Mewtwo Psychic Knapsack',
    pokemon_element: 'Psychic',
    difficulty: 'hard',
    pdf_url: null,
    description_markdown: `# Mewtwo Psychic Knapsack

Solve the **0/1 Knapsack** problem. Given **N** items with weights $w_i$ and values $v_i$, and capacity **W**, maximize total value.

Classic **dynamic programming**.

## Input
- First line: **N** and **W**
- Next **N** lines: $w_i$ $v_i$

## Output
- Maximum value.

## Sample
| Input | Output |
|-------|--------|
| \`3 50\n10 60\n20 100\n30 120\` | \`220\``,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'mock-drg05',
    code: 'DRG05',
    title: 'Dragonite Segment Tree Legend',
    pokemon_element: 'Dragon',
    difficulty: 'expert',
    pdf_url: null,
    description_markdown: `# Dragonite Segment Tree Legend

Given an array of **N** integers, process **Q** queries:
- \`1 l r\` — range sum query
- \`2 i x\` — point update $a_i = x$

Use a **segment tree** or **Fenwick tree**.

## Input
- First line: **N**
- Second line: **N** integers
- Third line: **Q**
- Next **Q** lines: queries

## Output
- One line per type-1 query.

## Constraints
- $1 \\le N, Q \\le 2 \\cdot 10^5$`,
    time_limit_ms: 2000,
    memory_limit_mb: 512,
    created_by: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-grs06',
    code: 'GRS06',
    title: 'Bulbasaur Graph Forest',
    pokemon_element: 'Grass',
    difficulty: 'easy',
    pdf_url: null,
    description_markdown: `# Bulbasaur Graph Forest

Given an undirected graph, count the number of connected components using **DFS/BFS**.

## Input
- First line: **N** (nodes) and **M** (edges)
- Next **M** lines: edge $u$ $v$

## Output
- Number of connected components.

## Sample
| Input | Output |
|-------|--------|
| \`5 3\n1 2\n2 3\n4 5\` | \`2\``,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    created_by: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const MOCK_TEST_CASES: Record<string, TestCase[]> = {
  'mock-pkm01': [
    { id: 't1', problem_id: 'mock-pkm01', input_data: '3\n1 2 3', expected_output: '6', is_sample: true },
    { id: 't2', problem_id: 'mock-pkm01', input_data: '5\n10 20 30 40 50', expected_output: '150', is_sample: false },
    { id: 't3', problem_id: 'mock-pkm01', input_data: '1\n1000000000', expected_output: '1000000000', is_sample: false },
  ],
  'mock-fire02': [
    { id: 't1', problem_id: 'mock-fire02', input_data: '4\n4 3 2 6', expected_output: '29', is_sample: true },
    { id: 't2', problem_id: 'mock-fire02', input_data: '3\n1 2 3', expected_output: '9', is_sample: false },
  ],
  'mock-water03': [
    { id: 't1', problem_id: 'mock-water03', input_data: '5 6\n1 2 3 4 5', expected_output: '2', is_sample: true },
    { id: 't2', problem_id: 'mock-water03', input_data: '4 10\n1 2 8 9', expected_output: '1', is_sample: false },
  ],
  'mock-psy04': [
    { id: 't1', problem_id: 'mock-psy04', input_data: '3 50\n10 60\n20 100\n30 120', expected_output: '220', is_sample: true },
  ],
  'mock-drg05': [
    { id: 't1', problem_id: 'mock-drg05', input_data: '4\n1 2 3 4\n3\n1 1 4\n2 2 10\n1 1 4', expected_output: '10\n18', is_sample: true },
  ],
  'mock-grs06': [
    { id: 't1', problem_id: 'mock-grs06', input_data: '5 3\n1 2\n2 3\n4 5', expected_output: '2', is_sample: true },
  ],
};

export const MOCK_CONTESTS: Contest[] = [
  {
    id: 'mock-c1',
    title: 'Indigo League Showdown',
    description: 'A 2-hour contest covering arrays, greedy, and DP. Prove you are a true Pokémon Trainer!',
    start_time: new Date(Date.now() + 3600000 * 2).toISOString(),
    end_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    created_by: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-c2',
    title: 'Cerulean Gym Live',
    description: 'Live now! Water-type problems and two-pointer challenges.',
    start_time: new Date(Date.now() - 3600000).toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'mock-c3',
    title: 'Elite Four Classics',
    description: 'Past showdown — relive the legendary battles.',
    start_time: new Date(Date.now() - 86400000 * 7).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 6).toISOString(),
    created_by: null,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export const MOCK_CONTEST_PROBLEMS: Record<string, { problem_id: string; order_index: number }[]> = {
  'mock-c1': [
    { problem_id: 'mock-pkm01', order_index: 0 },
    { problem_id: 'mock-fire02', order_index: 1 },
    { problem_id: 'mock-psy04', order_index: 2 },
  ],
  'mock-c2': [
    { problem_id: 'mock-water03', order_index: 0 },
    { problem_id: 'mock-grs06', order_index: 1 },
  ],
  'mock-c3': [
    { problem_id: 'mock-drg05', order_index: 0 },
    { problem_id: 'mock-psy04', order_index: 1 },
  ],
};
