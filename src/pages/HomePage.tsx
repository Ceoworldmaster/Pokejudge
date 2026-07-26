import { Link } from 'react-router-dom';
import { Pokeball } from '@/components/Pokeball';
import { ELEMENTS, DIFFICULTIES } from '@/lib/constants';
import { BookOpen, Trophy, BarChart3, Zap, Code2, Swords, ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-300 mb-6 animate-fade-in">
              <Zap className="h-3.5 w-3.5" /> Gamified Competitive Programming
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Catch problems.
              <br />
              <span className="bg-gradient-to-r from-red-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                Become a Champion.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              A Pokémon-themed Online Judge with live contests, automatic code evaluation,
              and a leaderboard that rewards skill. Train your algorithmic team and rise through the ranks.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/problems" className="btn-primary text-base px-6 py-3">
                <BookOpen className="h-5 w-5" /> Explore the Pokédex
              </Link>
              <Link to="/contests" className="btn-ghost text-base px-6 py-3">
                <Trophy className="h-5 w-5" /> Enter the League
              </Link>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <div className="relative">
              <Pokeball size={120} className="animate-float drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Code2, title: 'Real Code Execution', desc: 'Submit C++, Python, Java, JavaScript, or Go. Your code runs against hidden test cases via the Piston engine.', color: 'text-emerald-400', border: 'border-emerald-500/30' },
            { icon: Swords, title: 'Battle Verdicts', desc: '"Super Effective!", "Attack Missed!", "Pokémon Fainted!" — every verdict is a Pokémon battle outcome.', color: 'text-red-400', border: 'border-red-500/30' },
            { icon: Trophy, title: 'Live Contests', desc: 'ICPC-style scoring with time penalties. Compete in real-time and climb the league standings.', color: 'text-yellow-400', border: 'border-yellow-500/30' },
            { icon: BarChart3, title: 'Trainer Progress', desc: 'Track solved problems, element distribution, and an activity heatmap on your Trainer Card.', color: 'text-cyan-400', border: 'border-cyan-500/30' },
            { icon: BookOpen, title: 'Rich Problem Statements', desc: 'Markdown with LaTeX math rendering, sample cases, and downloadable PDFs.', color: 'text-violet-400', border: 'border-violet-500/30' },
            { icon: Zap, title: 'Gym Leader Powers', desc: 'Admins create problems, upload PDFs, manage test cases, and run contests.', color: 'text-pink-400', border: 'border-pink-500/30' },
          ].map((f) => (
            <div key={f.title} className={`glass rounded-2xl p-6 border ${f.border} hover:scale-[1.02] transition-transform`}>
              <f.icon className={`h-8 w-8 ${f.color} mb-3`} />
              <h3 className="text-lg font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Element mapping */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-1">Element → Topic Mapping</h2>
          <p className="text-slate-400 text-sm mb-6">Every Pokémon element corresponds to a competitive programming technique.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(ELEMENTS).map((el) => (
              <div key={el.name} className={`rounded-xl p-4 ${el.bg} ring-1 ${el.ring}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: el.color }} />
                  <span className={`font-bold ${el.text}`}>{el.name}</span>
                </div>
                <p className="text-xs text-slate-400">{el.topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty tiers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-1">Difficulty Tiers</h2>
          <p className="text-slate-400 text-sm mb-6">From Poké Ball to Master Ball — how tough is your team?</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(DIFFICULTIES).map((d) => (
              <div key={d.name} className={`rounded-xl p-4 ${d.bg} ring-1 ring-${d.color}/40 border ${d.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Pokeball type={d.ball as 'pokeball' | 'greatball' | 'ultraball' | 'masterball'} size={20} />
                  <span className={`font-bold ${d.text}`}>{d.label}</span>
                </div>
                <p className="text-xs text-slate-400 capitalize">{d.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 text-center">
        <Link to="/problems" className="inline-flex items-center gap-2 text-lg font-semibold text-red-400 hover:text-red-300 group">
          Start solving now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>
    </div>
  );
}
