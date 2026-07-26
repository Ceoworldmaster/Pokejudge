import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MOCK_CONTESTS, MOCK_CONTEST_PROBLEMS, MOCK_PROBLEMS } from '@/lib/mockData';
import type { Contest, Problem } from '@/types';
import { ElementBadge, DifficultyBadge } from '@/components/Badges';
import { Pokeball } from '@/components/Pokeball';
import { Trophy, Clock, Loader2, ChevronLeft, Medal, Target, Timer } from 'lucide-react';

interface Standing {
  user_id: string;
  username: string;
  avatar_url: string | null;
  solved: number;
  penalty: number;
}

export function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const contestId = id ?? '';
      const { data: dbC } = await supabase.from('contests').select('*').eq('id', contestId).maybeSingle();
      let c: Contest | null = dbC as Contest | null;
      if (!c) c = MOCK_CONTESTS.find((m) => m.id === contestId) ?? null;
      if (cancelled) return;
      setContest(c);

      // Problems
      let probIds: { problem_id: string; order_index: number }[] = [];
      if (dbC) {
        const { data: cp } = await supabase.from('contest_problems').select('*').eq('contest_id', contestId).order('order_index');
        probIds = (cp ?? []) as { problem_id: string; order_index: number }[];
      } else {
        probIds = MOCK_CONTEST_PROBLEMS[contestId] ?? [];
      }
      if (cancelled) return;

      const { data: dbProbs } = await supabase.from('problems').select('*').in('id', probIds.map((p) => p.problem_id));
      const mockProbs = MOCK_PROBLEMS.filter((m) => probIds.some((pp) => pp.problem_id === m.id));
      const allProbs = [...((dbProbs as Problem[]) ?? []), ...mockProbs];
      const ordered = probIds
        .map((pp) => allProbs.find((p) => p.id === pp.problem_id))
        .filter((p): p is Problem => Boolean(p));
      setProblems(ordered);

      // Standings
      const { data: subs } = await supabase
        .from('submissions')
        .select('user_id, problem_id, verdict, created_at, profiles(username, avatar_url)')
        .eq('contest_id', contestId);
      if (cancelled) return;
      computeStandings((subs as any[]) ?? [], c);
      setLoading(false);
    })();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [id]);

  function computeStandings(subs: any[], c: Contest | null) {
    const map = new Map<string, Standing>();
    const firstAcTime = new Map<string, number>();
    const wrongPerProblem = new Map<string, number>();
    const contestStart = c ? new Date(c.start_time).getTime() : 0;

    for (const s of subs) {
      if (!s.user_id) continue;
      const key = `${s.user_id}|${s.problem_id}`;
      if (!map.has(s.user_id)) {
        map.set(s.user_id, {
          user_id: s.user_id,
          username: s.profiles?.username ?? 'Trainer',
          avatar_url: s.profiles?.avatar_url ?? null,
          solved: 0,
          penalty: 0,
        });
      }
      const standing = map.get(s.user_id)!;
      if (s.verdict === 'Accepted' && !firstAcTime.has(key)) {
        firstAcTime.set(key, new Date(s.created_at).getTime());
        const wrongs = wrongPerProblem.get(key) ?? 0;
        const solveTime = Math.max(0, (new Date(s.created_at).getTime() - contestStart) / 60000);
        standing.solved += 1;
        standing.penalty += Math.round(solveTime) + wrongs * 20;
      } else if (s.verdict !== 'Accepted' && !firstAcTime.has(key)) {
        wrongPerProblem.set(key, (wrongPerProblem.get(key) ?? 0) + 1);
      }
    }
    const arr = Array.from(map.values()).sort((a, b) => b.solved - a.solved || a.penalty - b.penalty);
    setStandings(arr);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>;
  }
  if (!contest) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Pokeball size={64} className="mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-white">Contest not found</h1>
        <Link to="/contests" className="btn-ghost mt-4 inline-flex">Back to League</Link>
      </div>
    );
  }

  const start = new Date(contest.start_time).getTime();
  const end = new Date(contest.end_time).getTime();
  const isLive = start <= now && end > now;
  const isPast = end <= now;
  const isUpcoming = start > now;
  const remaining = end - now;
  const untilStart = start - now;

  const fmt = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Link to="/contests" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to League
      </Link>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-7 w-7 text-yellow-400" />
              {isLive && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-300 ring-1 ring-red-500/40"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>}
              {isPast && <span className="rounded-full bg-slate-700/40 px-2.5 py-0.5 text-xs font-semibold text-slate-400">Ended</span>}
              {isUpcoming && <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/40">Upcoming</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{contest.title}</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">{contest.description}</p>
          </div>
          <div className="text-right">
            {isLive && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-1 flex items-center gap-1 justify-end"><Timer className="h-3 w-3" /> Time Remaining</p>
                <p className="text-3xl font-mono font-bold text-red-400 tabular-nums">{fmt(remaining)}</p>
              </div>
            )}
            {isUpcoming && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-1 flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> Starts In</p>
                <p className="text-3xl font-mono font-bold text-cyan-400 tabular-nums">{fmt(untilStart)}</p>
              </div>
            )}
            {isPast && <p className="text-sm text-slate-500">Final standings</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-red-400" /> Problems</h2>
          {isUpcoming ? (
            <div className="glass rounded-xl p-8 text-center text-slate-500">
              <Pokeball size={48} className="mx-auto mb-3 opacity-40" />
              Problems are locked until the contest starts.
            </div>
          ) : problems.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-500">No problems assigned to this contest yet.</div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              {problems.map((p, i) => (
                <Link key={p.id} to={`/problems/${p.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-sm font-bold text-red-400 ring-1 ring-red-500/30">{String.fromCharCode(65 + i)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-slate-500">{p.code}</p>
                    <p className="font-semibold text-white truncate">{p.title}</p>
                  </div>
                  <ElementBadge element={p.pokemon_element} />
                  <DifficultyBadge difficulty={p.difficulty} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Medal className="h-5 w-5 text-yellow-400" /> Standings</h2>
          <div className="glass rounded-xl overflow-hidden">
            {standings.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No submissions yet. Be the first to battle!</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Trainer</th>
                    <th className="px-3 py-2 text-right">Solved</th>
                    <th className="px-3 py-2 text-right">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.user_id} className="border-b border-slate-800 last:border-0">
                      <td className="px-3 py-2 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-slate-200 font-medium">{s.username}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-400">{s.solved}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">{s.penalty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">ICPC-style: solved count first, then time penalty (+20 min per wrong submission).</p>
        </div>
      </div>
    </div>
  );
}
