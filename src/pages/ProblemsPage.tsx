import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MOCK_PROBLEMS } from '@/lib/mockData';
import { ELEMENTS, ELEMENT_LIST, DIFFICULTIES } from '@/lib/constants';
import type { Problem, Difficulty } from '@/types';
import { ElementBadge, DifficultyBadge } from '@/components/Badges';
import { Pokeball } from '@/components/Pokeball';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProblemStats {
  total: number;
  accepted: number;
}

export function ProblemsPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Record<string, ProblemStats>>({});
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [elemFilter, setElemFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('problems').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      const dbProblems = (data as Problem[]) ?? [];
      const all = [...dbProblems, ...MOCK_PROBLEMS.filter((m) => !dbProblems.some((d) => d.code === m.code))];
      setProblems(all);

      // Stats
      const { data: subData } = await supabase
        .from('submissions')
        .select('problem_id, verdict');
      if (cancelled) return;
      const statMap: Record<string, ProblemStats> = {};
      const solved = new Set<string>();
      const attempted = new Set<string>();
      for (const s of subData ?? []) {
        const pid = s.problem_id as string;
        if (!statMap[pid]) statMap[pid] = { total: 0, accepted: 0 };
        statMap[pid].total++;
        if (s.verdict === 'Accepted') {
          statMap[pid].accepted++;
          solved.add(pid);
        } else {
          attempted.add(pid);
        }
      }
      // Mock stats
      for (const p of MOCK_PROBLEMS) {
        if (!statMap[p.id]) {
          statMap[p.id] = {
            total: 100 + Math.floor(Math.random() * 400),
            accepted: 40 + Math.floor(Math.random() * 200),
          };
        }
      }
      setStats(statMap);
      setSolvedIds(solved);
      setAttemptedIds(new Set([...attempted].filter((id) => !solved.has(id))));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (search && !`${p.code} ${p.title}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;
      if (elemFilter !== 'all' && p.pokemon_element !== elemFilter) return false;
      if (statusFilter === 'solved' && !solvedIds.has(p.id)) return false;
      if (statusFilter === 'unsolved' && solvedIds.has(p.id)) return false;
      return true;
    });
  }, [problems, search, diffFilter, elemFilter, statusFilter, solvedIds]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Pokeball size={32} /> Pokédex
        </h1>
        <p className="text-slate-400 mt-1">Browse the problem set. Catch them all.</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or title..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value as Difficulty | 'all')} className="input-field w-auto">
            <option value="all">All Difficulties</option>
            {Object.values(DIFFICULTIES).map((d) => (
              <option key={d.name} value={d.name}>{d.label}</option>
            ))}
          </select>
          <select value={elemFilter} onChange={(e) => setElemFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Elements</option>
            {ELEMENT_LIST.map((el) => (
              <option key={el} value={el}>{el} — {ELEMENTS[el].topic}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'solved' | 'unsolved')} className="input-field w-auto">
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-900/40 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 w-12 text-center">Status</th>
                <th className="px-4 py-3 w-28">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-32">Element</th>
                <th className="px-4 py-3 w-40">Difficulty</th>
                <th className="px-4 py-3 w-40 text-right">AC Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                    Loading problems...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Filter className="h-6 w-6 inline-block mr-2" />
                    No problems match your filters.
                  </td>
                </tr>
              )}
              {!loading && filtered.map((p) => {
                const st = stats[p.id] ?? { total: 0, accepted: 0 };
                const rate = st.total > 0 ? ((st.accepted / st.total) * 100).toFixed(1) : '0.0';
                const isSolved = solvedIds.has(p.id);
                const isAttempted = attemptedIds.has(p.id);
                const elMeta = ELEMENTS[p.pokemon_element] ?? ELEMENTS.Normal;
                return (
                  <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors" style={{ borderLeft: `3px solid ${elMeta.color}60` }}>
                    <td className="px-4 py-3 text-center">
                      {isSolved ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 inline-block" />
                      ) : isAttempted ? (
                        <Circle className="h-5 w-5 text-yellow-400/70 inline-block" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-700 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-300">{p.code}</td>
                    <td className="px-4 py-3">
                      <Link to={`/problems/${p.id}`} className="text-slate-100 hover:text-red-400 font-medium transition-colors">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><ElementBadge element={p.pokemon_element} /></td>
                    <td className="px-4 py-3"><DifficultyBadge difficulty={p.difficulty} /></td>
                    <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs">
                      {st.accepted} / {st.total} <span className="text-slate-600">({rate}%)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
