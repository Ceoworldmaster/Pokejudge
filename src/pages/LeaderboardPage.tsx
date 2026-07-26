import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Pokeball } from '@/components/Pokeball';
import { Loader2, Trophy, Medal, Crown } from 'lucide-react';

interface LeaderRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  rank_title: string | null;
  role: string | null;
  solved: number;
  total: number;
  badges: number;
}

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url, rank_title, role, badges_count');
      const { data: subs } = await supabase.from('submissions').select('user_id, verdict');

      const map = new Map<string, LeaderRow>();
      for (const p of (profiles ?? []) as any[]) {
        map.set(p.id, {
          user_id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          rank_title: p.rank_title,
          role: p.role,
          solved: 0,
          total: 0,
          badges: p.badges_count ?? 0,
        });
      }
      for (const s of (subs ?? []) as any[]) {
        const row = map.get(s.user_id);
        if (!row) continue;
        row.total++;
        if (s.verdict === 'Accepted') row.solved++;
      }
      const arr = Array.from(map.values()).sort((a, b) => b.solved - a.solved || b.total - a.total);
      setRows(arr);
      setLoading(false);
    })();
  }, []);

  const medal = (i: number) => {
    if (i === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (i === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-slate-500 font-mono">{i + 1}</span>;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" /> Leaderboard
        </h1>
        <p className="text-slate-400 mt-1">The top Trainers in the Pokémon League.</p>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-red-500 inline-block" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Pokeball size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-slate-500">No trainers have registered yet. Be the first!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-left w-16">Rank</th>
                <th className="px-4 py-3 text-left">Trainer</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-right">Solved</th>
                <th className="px-4 py-3 text-right">Submissions</th>
                <th className="px-4 py-3 text-right">Badges</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.user_id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">{medal(i)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
                        {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : <Pokeball size={20} />}
                      </div>
                      <span className="font-semibold text-white">{r.username}</span>
                      {r.role === 'gym_leader' && <span className="text-[10px] font-bold uppercase text-yellow-400">Gym Leader</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.rank_title ?? 'Novice Trainer'}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">{r.solved}</td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">{r.total}</td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-mono">{r.badges}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
