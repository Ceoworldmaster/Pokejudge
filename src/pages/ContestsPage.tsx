import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MOCK_CONTESTS } from '@/lib/mockData';
import type { Contest } from '@/types';
import { Pokeball } from '@/components/Pokeball';
import { Trophy, Clock, Play, CheckCircle2, Loader2, Calendar } from 'lucide-react';

type Tab = 'upcoming' | 'live' | 'past';

export function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('live');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('contests').select('*').order('start_time', { ascending: false });
      if (cancelled) return;
      const dbC = (data as Contest[]) ?? [];
      const all = [...dbC, ...MOCK_CONTESTS.filter((m) => !dbC.some((d) => d.id === m.id))];
      setContests(all);
      setLoading(false);
    })();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const live = contests.filter((c) => new Date(c.start_time).getTime() <= now && new Date(c.end_time).getTime() > now);
  const upcoming = contests.filter((c) => new Date(c.start_time).getTime() > now);
  const past = contests.filter((c) => new Date(c.end_time).getTime() <= now);

  const list = tab === 'live' ? live : tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" /> Pokémon League
        </h1>
        <p className="text-slate-400 mt-1">Compete in live contests. Prove you are a Champion.</p>
      </div>

      <div className="flex gap-1 mb-6 rounded-lg bg-slate-900/60 p-1 w-full sm:w-auto sm:inline-flex">
        {([
          { id: 'live', label: 'Live Leagues', count: live.length, color: 'text-red-400' },
          { id: 'upcoming', label: 'Upcoming', count: upcoming.length, color: 'text-cyan-400' },
          { id: 'past', label: 'Past Showdowns', count: past.length, color: 'text-slate-400' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.id === 'live' && t.count > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            {t.label}
            <span className={`text-xs ${tab === t.id ? 'text-white/70' : t.color}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-500 inline-block" /></div>
      ) : list.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-slate-500">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
          No {tab} contests.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const start = new Date(c.start_time).getTime();
            const end = new Date(c.end_time).getTime();
            const isLive = start <= now && end > now;
            const isPast = end <= now;
            return (
              <Link
                key={c.id}
                to={`/contests/${c.id}`}
                className="glass rounded-2xl p-5 hover:scale-[1.02] transition-transform group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Pokeball type={isLive ? 'pokeball' : isPast ? 'ultraball' : 'greatball'} size={28} />
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-300 ring-1 ring-red-500/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                    </span>
                  )}
                  {isPast && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/40 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                      <CheckCircle2 className="h-3 w-3" /> Ended
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{c.title}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Start: {new Date(c.start_time).toLocaleString()}</p>
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> End: {new Date(c.end_time).toLocaleString()}</p>
                </div>
                {isLive && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <Play className="h-3.5 w-3.5" /> Enter Arena
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
