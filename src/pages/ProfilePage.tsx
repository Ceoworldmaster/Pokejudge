import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ELEMENTS } from '@/lib/constants';
import { Pokeball } from '@/components/Pokeball';
import { VerdictBadge } from '@/components/VerdictBadge';
import { ElementBadge } from '@/components/Badges';
import type { Submission, Problem } from '@/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
} from 'recharts';
import { UserCircle, Loader2, Code2, Award, Calendar, Zap, X } from 'lucide-react';

export function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((subs as Submission[]) ?? []);
      const probIds = Array.from(new Set((subs ?? []).map((s: any) => s.problem_id)));
      if (probIds.length) {
        const { data: probs } = await supabase.from('problems').select('*').in('id', probIds);
        setProblems((probs as Problem[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  const solvedIds = useMemo(() => {
    const s = new Set<string>();
    for (const sub of submissions) {
      if (sub.verdict === 'Accepted') s.add(sub.problem_id);
    }
    return s;
  }, [submissions]);

  const elementDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const p of problems) {
      if (solvedIds.has(p.id)) {
        dist[p.pokemon_element] = (dist[p.pokemon_element] ?? 0) + 1;
      }
    }
    return Object.entries(dist).map(([name, value]) => ({ name, value, color: ELEMENTS[name]?.color ?? '#888' }));
  }, [problems, solvedIds]);

  const heatmap = useMemo(() => {
    const days: Record<string, number> = {};
    for (const s of submissions) {
      const d = new Date(s.created_at).toISOString().slice(0, 10);
      days[d] = (days[d] ?? 0) + 1;
    }
    const today = new Date();
    const cells: { date: string; count: number }[] = [];
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, count: days[key] ?? 0 });
    }
    return cells;
  }, [submissions]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>;
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <UserCircle className="h-12 w-12 mx-auto mb-4 text-slate-600" />
        <h1 className="text-2xl font-bold text-white">Sign in to view your Trainer Card</h1>
        <Link to="/auth" className="btn-primary mt-4 inline-flex">Sign In</Link>
      </div>
    );
  }

  const heatColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/60';
    if (count <= 1) return 'bg-red-500/30';
    if (count <= 3) return 'bg-red-500/55';
    if (count <= 5) return 'bg-red-500/80';
    return 'bg-red-500';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Trainer Card */}
      <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <Pokeball size={160} />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-24 w-24 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-red-500/40 shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Pokeball size={56} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white">{profile.username}</h1>
              {profile.role === 'gym_leader' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-bold uppercase text-yellow-400 ring-1 ring-yellow-500/40">
                  <Zap className="h-3 w-3" /> Gym Leader
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-1 flex items-center gap-2"><Award className="h-4 w-4 text-yellow-400" /> {profile.rank_title}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{solvedIds.size}</p>
                <p className="text-xs text-slate-500 uppercase">Solved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-200">{submissions.length}</p>
                <p className="text-xs text-slate-500 uppercase">Submissions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{profile.badges_count}</p>
                <p className="text-xs text-slate-500 uppercase">Badges</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{new Date(profile.created_at).getFullYear()}</p>
                <p className="text-xs text-slate-500 uppercase">Joined</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity heatmap */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Calendar className="h-5 w-5 text-red-400" /> Activity (90 days)</h2>
          <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
            {heatmap.map((c) => (
              <div
                key={c.date}
                title={`${c.date}: ${c.count} submissions`}
                className={`h-3 w-3 rounded-sm ${heatColor(c.count)}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            Less
            <div className="h-3 w-3 rounded-sm bg-slate-800/60" />
            <div className="h-3 w-3 rounded-sm bg-red-500/30" />
            <div className="h-3 w-3 rounded-sm bg-red-500/55" />
            <div className="h-3 w-3 rounded-sm bg-red-500/80" />
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            More
          </div>
        </div>

        {/* Element distribution */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-3">Solved by Element</h2>
          {elementDist.length === 0 ? (
            <p className="text-slate-500 text-sm py-12 text-center">Solve a problem to see your element distribution.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={elementDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {elementDist.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Submission history */}
      <div className="glass rounded-2xl p-5 mt-6">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Code2 className="h-5 w-5 text-red-400" /> Submission History</h2>
        {submissions.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">No submissions yet. <Link to="/problems" className="text-red-400 hover:text-red-300">Start solving!</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Verdict</th>
                  <th className="px-3 py-2 text-left">Language</th>
                  <th className="px-3 py-2 text-left">Result</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-3 py-2"><VerdictBadge verdict={s.verdict} /></td>
                    <td className="px-3 py-2 font-mono text-slate-400">{s.language}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{s.passed_test_cases}/{s.total_test_cases}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setViewing(s)} className="text-red-400 hover:text-red-300 text-xs font-semibold">View Code</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code modal */}
      {viewing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={viewing.verdict} />
                <span className="text-sm text-slate-400 font-mono">{viewing.language}</span>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 bg-slate-950/60 whitespace-pre">{viewing.code}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
