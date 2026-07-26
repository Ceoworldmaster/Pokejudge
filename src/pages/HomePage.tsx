import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pokeball } from '@/components/Pokeball';
import {
  BookOpen, Trophy, Zap, Code2, Swords, ArrowRight,
  Activity, Clock, ChevronRight, Star, Medal,
} from 'lucide-react';

/* ── Pokémon sprite URLs from PokeAPI (public CDN) ── */
const PKM = {
  charizard: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
  pikachu:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  bulbasaur: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  squirtle:  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  mewtwo:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
  gengar:    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
  dragonite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png',
  eevee:     'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
  snorlax:   'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',
};

const TIER_PROBLEMS = [
  { type: 'Fire',     color: '#F08030', glow: '#F87171', label: 'Fire-type DP',                sub: 'Fire-type DP · Search',             img: PKM.charizard },
  { type: 'Electric', color: '#F8D030', glow: '#FACC15', label: 'Fire e-type Problems',        sub: 'Electric-type → Problems',           img: PKM.pikachu },
  { type: 'Electric', color: '#F8D030', glow: '#FACC15', label: 'Electric-type Binary Search', sub: 'Electric-type = Binary Search',     img: PKM.pikachu },
  { type: 'Grass',    color: '#78C850', glow: '#4ADE80', label: 'Grass-type Bulbasaur',        sub: 'Grass = type !!! Bulbasaur',         img: PKM.bulbasaur },
  { type: 'Water',    color: '#6890F0', glow: '#60A5FA', label: 'Water-type Task 1',           sub: 'Pre-type DP · Binary Search',        img: PKM.squirtle },
  { type: 'Fire',     color: '#F08030', glow: '#F87171', label: 'Fire-type Submatend',         sub: '',                                   img: PKM.charizard },
];

const BATTLE_LOG = [
  { user: 'TrainerRED',  problem: 'Binary Search',    verdict: 'AC',  msg: 'Super Effective!' },
  { user: 'TrainerRED',  problem: 'Binary Search',    verdict: 'AC',  msg: 'Super Effective!' },
  { user: 'TrainerBLUE', problem: 'Segment Tree',     verdict: 'WA',  msg: 'Attack Missed!' },
  { user: 'AshK',        problem: 'DP Knapsack',      verdict: 'AC',  msg: 'Super Effective!' },
  { user: 'MistyW',      problem: 'Two Pointer',      verdict: 'TLE', msg: 'No PP left!' },
  { user: 'TrainerRED',  problem: 'Binary Search',    verdict: 'AC',  msg: 'Super Effective!' },
  { user: 'GaryO',       problem: 'Graph BFS',        verdict: 'AC',  msg: 'Super Effective!' },
];

const FLOATING_PKMS = [
  { img: PKM.gengar,    dur: 5.5, delay: 0,   top: 8,  left: 3,  size: 80 },
  { img: PKM.mewtwo,    dur: 6.5, delay: 1.2, top: 60, left: 6,  size: 90 },
  { img: PKM.dragonite, dur: 7,   delay: 0.5, top: 15, left: 88, size: 85 },
  { img: PKM.eevee,     dur: 5,   delay: 2,   top: 72, left: 85, size: 70 },
  { img: PKM.snorlax,   dur: 8,   delay: 1.5, top: 40, left: 93, size: 95 },
];

const PATH_NODES = [
  { icon: '🏆', label: 'Champion',  color: '#FACC15', glow: '#FDE68A' },
  { icon: '💎', label: 'Master',    color: '#A855F7', glow: '#C084FC' },
  { icon: '🌊', label: 'Expert',    color: '#3B82F6', glow: '#93C5FD' },
  { icon: '⭐', label: 'Trainer',   color: '#34D399', glow: '#6EE7B7' },
];

function useCountdown() {
  const [rem, setRem] = useState('00:12:19');
  useEffect(() => {
    const end = Date.now() + 12 * 60 * 1000 + 19 * 1000;
    const id = setInterval(() => {
      const d = Math.max(0, end - Date.now());
      const m = Math.floor(d / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setRem(`00:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      if (d === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return rem;
}

/* Pokéball SVG background pattern */
const PKBALL_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='28' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='2'/%3E%3Cpath d='M12 40 h56' stroke='rgba(255,255,255,0.04)' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='8' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='2'/%3E%3C/svg%3E")`;

export function HomePage() {
  const countdown = useCountdown();
  const [logIdx, setLogIdx] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLogIdx(p => (p + 1) % BATTLE_LOG.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#08080f' }}>

      {/* ── Pokéball tiled background ── */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: PKBALL_BG, backgroundSize: '80px 80px' }} />

      {/* ── Fire glow (left side) ── */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[45%]"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(240,80,30,0.22) 0%, rgba(239,68,68,0.08) 50%, transparent 80%)' }} />
      {/* ── Water/electric glow (right side) ── */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%]"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 100% 50%, rgba(34,211,238,0.18) 0%, rgba(96,165,250,0.08) 50%, transparent 80%)' }} />

      {/* ── Floating Pokémon sprites ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {FLOATING_PKMS.map((p, i) => (
          <img
            key={i}
            src={p.img}
            alt=""
            draggable={false}
            className="absolute select-none pokemon-float"
            style={{
              top: `${p.top}%`, left: `${p.left}%`,
              width: p.size, height: p.size,
              imageRendering: 'pixelated',
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              filter: 'drop-shadow(0 0 16px rgba(239,68,68,0.35)) brightness(1.1)',
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* ════════════════════════════════════════
          HERO — 3-col grid
      ════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 pt-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 items-start">

          {/* ── LEFT: Problem Tier-list ── */}
          <aside className="reveal-left">
            <div className="rounded-2xl overflow-hidden border border-white/10"
              style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.95),rgba(15,15,28,0.92))', backdropFilter: 'blur(12px)', boxShadow: '0 0 40px rgba(240,80,30,0.12), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              {/* header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10"
                style={{ background: 'linear-gradient(90deg, rgba(240,80,30,0.15), transparent)' }}>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-2 text-sm font-bold text-white tracking-wide">Problem Tier-list</span>
                <div className="ml-auto flex gap-1">
                  <Pokeball size={16} type="pokeball" />
                  <Pokeball size={16} type="greatball" />
                </div>
              </div>

              {/* rows */}
              <div className="divide-y divide-white/5">
                {TIER_PROBLEMS.map((p, i) => (
                  <Link
                    key={i}
                    to="/problems"
                    className="tier-card-row tier-row group flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    style={{ animationDelay: `${0.25 + i * 0.07}s` }}
                  >
                    {/* type stripe */}
                    <div className="shrink-0 w-1 h-10 rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.glow}` }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate group-hover:text-yellow-300 transition-colors">{p.label}</p>
                      {p.sub && <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.sub}</p>}
                    </div>

                    {/* pokemon sprite */}
                    <img
                      src={p.img} alt=""
                      className="shrink-0 w-10 h-10 object-contain group-hover:scale-125 transition-transform duration-300"
                      style={{ imageRendering: 'pixelated', filter: `drop-shadow(0 0 6px ${p.glow}55)` }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ── CENTER: Hero ── */}
          <div className="flex flex-col items-center justify-start text-center reveal-up delay-200 pt-2">

            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 px-4 py-1.5 mb-6"
              style={{ background: 'rgba(250,204,21,0.08)', boxShadow: '0 0 20px rgba(250,204,21,0.1)' }}>
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300 tracking-widest uppercase">Gamified Competitive Programming</span>
            </div>

            {/* title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">Catch problems,</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg,#F08030 0%,#F8D030 30%,#78C850 60%,#6890F0 90%)', WebkitBackgroundClip: 'text' }}
              >
                Become a Champion.
              </span>
            </h1>

            {/* subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
              A Pokémon-themed Online Judge with live contests, automatic code
              evaluation, and a leaderboard that rewards skill. Train your algorithmic team
              and rise through the ranks.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/problems"
                className="group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 font-bold text-base overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 0 30px rgba(239,68,68,0.2)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
                  style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(250,204,21,0.08))' }} />
                <Pokeball size={24} type="masterball" className="group-hover:rotate-[360deg] transition-transform duration-700" />
                <span className="relative text-white">Explore Master Ball</span>
              </Link>

              <Link to="/contests"
                className="group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 font-bold text-base overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 0 30px rgba(96,165,250,0.2)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
                  style={{ background: 'linear-gradient(135deg,rgba(96,165,250,0.15),rgba(139,92,246,0.08))' }} />
                <Pokeball size={24} type="ultraball" className="group-hover:rotate-[360deg] transition-transform duration-700" />
                <span className="relative text-white">Enter Mega Stone</span>
              </Link>
            </div>

            {/* BIG POKÉBALL */}
            <div className="relative mt-10">
              {/* outer glow rings */}
              <div className="absolute rounded-full fire-orb" style={{ inset: -60, background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 50%, transparent 70%)' }} />
              <div className="absolute rounded-full lightning-orb" style={{ inset: -40, background: 'radial-gradient(circle, rgba(250,204,21,0.1) 0%, transparent 70%)' }} />
              <div className="absolute rounded-full" style={{ inset: -20, border: '1px solid rgba(239,68,68,0.2)', borderRadius: '50%', animation: 'lightning-orb 3s ease-in-out infinite' }} />
              <Pokeball size={190} className="pokeball-hero relative z-10" />
            </div>
          </div>

          {/* ── RIGHT: Champion's Path + Contest + Battle ── */}
          <aside className="space-y-3 reveal-right delay-300">

            {/* Champion's Path */}
            <div className="rounded-2xl overflow-hidden border border-yellow-500/20"
              style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.95),rgba(15,15,28,0.92))', backdropFilter: 'blur(12px)', boxShadow: '0 0 30px rgba(250,204,21,0.08)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-500/20"
                style={{ background: 'linear-gradient(90deg,rgba(250,204,21,0.12),transparent)' }}>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-white tracking-wide">Champion's Path</span>
              </div>
              <div className="p-4">
                {/* node tree */}
                <div className="flex items-center justify-between gap-1">
                  {PATH_NODES.map((n, i) => (
                    <div key={n.label} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 feature-card-hover cursor-default"
                        style={{ borderColor: n.color, background: `${n.color}18`, boxShadow: i === 0 ? `0 0 14px ${n.glow}55` : 'none' }}
                      >
                        {n.icon}
                      </div>
                      <span className="text-[10px] text-slate-400">{n.label}</span>
                      {i < PATH_NODES.length - 1 && (
                        <div className="absolute" />
                      )}
                    </div>
                  ))}
                </div>
                {/* connector line */}
                <div className="relative mt-1">
                  <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,#FACC15,#A855F7,#3B82F6,#34D399)', opacity: 0.4 }} />
                </div>
                {/* trainer icons row */}
                <div className="flex items-end justify-around mt-3">
                  {[PKM.mewtwo, PKM.charizard, PKM.pikachu, PKM.squirtle].map((src, i) => (
                    <img key={i} src={src} alt="" className="pokemon-float"
                      style={{ width: 36, height: 36, imageRendering: 'pixelated', animationDuration: `${4 + i * 0.8}s`, animationDelay: `${i * 0.4}s`, filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Live Contest */}
            <div className="rounded-2xl overflow-hidden border border-red-500/20"
              style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.95),rgba(15,15,28,0.92))', backdropFilter: 'blur(12px)', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-500/20"
                style={{ background: 'linear-gradient(90deg,rgba(239,68,68,0.12),transparent)' }}>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-white">Current Live Contest</span>
                <span className="ml-auto text-[10px] text-slate-500">Countdown with 12 minutes ago</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Battle Console</span>
                <span className="font-mono text-xl font-black text-white tracking-widest countdown">{countdown}</span>
              </div>
              <div className="px-4 pb-3 space-y-1.5">
                {BATTLE_LOG.slice(0, 3).map((b, i) => (
                  <div key={i} className="text-[11px] text-slate-400">
                    <span className="font-bold" style={{ color: b.verdict === 'AC' ? '#34D399' : b.verdict === 'WA' ? '#F87171' : '#FACC15' }}>
                      Trainer {b.user.replace('Trainer','')}
                    </span>{' '}just used <span className="text-white">{b.problem}</span>{' '}
                    — <span style={{ color: b.verdict === 'AC' ? '#34D399' : '#F87171' }}>{b.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Battle Console — test results */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/50 relative"
              style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.95),rgba(15,15,28,0.92))', backdropFilter: 'blur(12px)' }}>
              <div className="scan-line" />
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Battle Console</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                {[
                  { t: 'Test 1', v: 'AC' },
                  { t: 'Test 2', v: 'WA' },
                  { t: 'Test 3', v: 'WA' },
                  { t: 'Test 4', v: 'AC' },
                  { t: 'Test 5', v: 'AC' },
                  { t: 'Test 6', v: 'AC' },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-slate-800/40">
                    <Pokeball
                      size={14}
                      type={r.v === 'AC' ? 'pokeball' : 'greatball'}
                    />
                    <span className="text-xs text-slate-400 flex-1">{r.t}:</span>
                    <span className={`text-xs font-bold ${r.v === 'AC' ? 'text-emerald-400' : 'text-red-400'}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES BELOW
      ════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { icon: Code2,    color: '#34D399', label: 'Real Code Execution',  desc: 'C++, Python, Java, JS, Go — run against hidden tests' },
            { icon: Swords,   color: '#F87171', label: 'Battle Verdicts',      desc: 'Super Effective! Attack Missed! Pokémon Fainted!' },
            { icon: Trophy,   color: '#FACC15', label: 'Live Contests',        desc: 'ICPC scoring with time penalties & real-time standings' },
            { icon: Activity, color: '#60A5FA', label: 'Trainer Progress',     desc: 'Heatmap, element stats, Trainer Card' },
            { icon: BookOpen, color: '#C084FC', label: 'Rich Problems',        desc: 'LaTeX math, PDF download, sample cases' },
            { icon: Zap,      color: '#FB923C', label: 'Gym Leader Panel',     desc: 'Create problems, manage contests, upload PDFs' },
          ].map((f, i) => (
            <Link
              key={f.label}
              to="/problems"
              className="reveal-up feature-card-hover group rounded-2xl p-5 border border-white/8 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.9),rgba(12,12,24,0.85))', animationDelay: `${i * 0.07}s`, boxShadow: `0 0 0 0 ${f.color}00`, transition: 'box-shadow 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 30px ${f.color}22`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${f.color}00`)}
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}40` }}>
                <f.icon className="h-6 w-6" style={{ color: f.color }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors">{f.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 pb-24">
        <div className="reveal-up rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(20,20,35,0.9),rgba(12,12,24,0.85))' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/8">
            {[
              { label: 'Problems', value: '150+', color: '#34D399', icon: BookOpen },
              { label: 'Trainers',  value: '1,200+', color: '#60A5FA', icon: Medal },
              { label: 'Contests',  value: '24',  color: '#FACC15', icon: Trophy },
              { label: 'Submissions', value: '18K+', color: '#F87171', icon: Activity },
            ].map((s, i) => (
              <div key={s.label} className="reveal-up flex flex-col items-center justify-center py-8 gap-1" style={{ animationDelay: `${i * 0.1}s` }}>
                <s.icon className="h-5 w-5 mb-1" style={{ color: s.color }} />
                <div className="text-3xl font-black text-white" style={{ textShadow: `0 0 20px ${s.color}66` }}>{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
