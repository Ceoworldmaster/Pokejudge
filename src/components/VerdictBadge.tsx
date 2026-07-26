import type { Verdict } from '@/types';
import { Pokeball } from './Pokeball';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Zap, Loader2 } from 'lucide-react';

interface Props {
  verdict: Verdict;
  size?: 'sm' | 'lg';
}

const META: Record<Verdict, { label: string; color: string; bg: string; text: string; icon: typeof CheckCircle2; ball?: 'pokeball' | 'greatball' | 'ultraball' | 'masterball' }> = {
  Accepted:              { label: 'Super Effective!',          color: '#34D399', bg: 'bg-emerald-500/15', text: 'text-emerald-300', icon: CheckCircle2, ball: 'pokeball' },
  'Wrong Answer':       { label: 'Attack Missed!',            color: '#EF4444', bg: 'bg-red-500/15',    text: 'text-red-300',    icon: XCircle },
  'Time Limit Exceeded':{ label: 'Pokémon Fainted (TLE)!',    color: '#FACC15', bg: 'bg-yellow-500/15',  text: 'text-yellow-300', icon: Clock },
  'Compile Error':      { label: 'Confusion Status!',         color: '#A855F7', bg: 'bg-violet-500/15',  text: 'text-violet-300', icon: AlertTriangle, ball: 'masterball' },
  'Runtime Error':      { label: 'Pokémon Fainted (RE)!',     color: '#F97316', bg: 'bg-orange-500/15',  text: 'text-orange-300', icon: AlertTriangle },
  Pending:              { label: 'Waiting...',                color: '#94A3B8', bg: 'bg-slate-500/15',   text: 'text-slate-300',  icon: Loader2 },
  Running:              { label: 'Battle in progress...',     color: '#06B6D4', bg: 'bg-cyan-500/15',    text: 'text-cyan-300',   icon: Loader2 },
};

export function VerdictBadge({ verdict, size = 'sm' }: Props) {
  const m = META[verdict];
  const Icon = m.icon;
  const sz = size === 'lg' ? 'px-5 py-2.5 text-base' : 'px-3 py-1.5 text-sm';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold ${m.bg} ${m.text} ring-1 ${sz} animate-scale-in`}
      style={{ boxShadow: `0 0 0 1px ${m.color}33` }}
    >
      {m.ball ? <Pokeball type={m.ball} size={size === 'lg' ? 22 : 16} /> : <Icon className={`h-4 w-4 ${verdict === 'Running' || verdict === 'Pending' ? 'animate-spin' : ''}`} />}
      {verdict === 'Accepted' && <Zap className="h-4 w-4" />}
      <span>{m.label}</span>
      {size === 'lg' && verdict !== 'Pending' && verdict !== 'Running' && (
        <span className="opacity-70 font-mono text-xs">[{verdict}]</span>
      )}
    </span>
  );
}
