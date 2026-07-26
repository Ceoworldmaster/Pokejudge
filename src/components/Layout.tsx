import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Pokeball } from './Pokeball';
import {
  BookOpen,
  Trophy,
  BarChart3,
  UserCircle,
  Shield,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const NAV = [
  { to: '/problems', label: 'Pokédex', icon: BookOpen },
  { to: '/contests', label: 'League', icon: Trophy },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { to: '/profile', label: 'Trainer Card', icon: UserCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setUserMenu(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 glass-strong border-b border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <NavLink to="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <Pokeball size={32} className="group-hover:animate-spin-slow" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    Poké<span className="text-red-500">Judge</span>
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                    Online Judge
                  </span>
                </div>
              </NavLink>

              <nav className="hidden md:flex items-center gap-1">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-500/15 text-red-300'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                {profile?.role === 'gym_leader' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-yellow-500/15 text-yellow-300'
                          : 'text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-300'
                      }`
                    }
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-slate-700 py-1 pl-1 pr-3 hover:border-slate-500 transition-colors"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-200 max-w-[120px] truncate">
                      {profile?.username ?? 'Trainer'}
                    </span>
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl glass-strong border border-slate-700 shadow-xl py-1 animate-scale-in">
                      <div className="px-3 py-2 border-b border-slate-700/60">
                        <p className="text-sm font-semibold text-white">{profile?.username}</p>
                        <p className="text-xs text-slate-400">{profile?.rank_title}</p>
                        {profile?.role === 'gym_leader' && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-400">
                            <Zap className="h-3 w-3" /> Gym Leader
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => { setUserMenu(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60"
                      >
                        <UserCircle className="h-4 w-4" /> Trainer Card
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <NavLink to="/auth" className="btn-ghost text-sm">Sign In</NavLink>
                  <NavLink to="/auth?mode=signup" className="btn-primary text-sm">Register</NavLink>
                </div>
              )}

              <button
                className="md:hidden text-slate-300 p-2"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="md:hidden pb-3 flex flex-col gap-1 animate-fade-in">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-red-500/15 text-red-300' : 'text-slate-300 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              {profile?.role === 'gym_leader' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Shield className="h-4 w-4" /> Admin
                </NavLink>
              )}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <NavLink to="/auth" onClick={() => setMenuOpen(false)} className="btn-ghost flex-1 text-sm">Sign In</NavLink>
                  <NavLink to="/auth?mode=signup" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-sm">Register</NavLink>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-slate-800/80 glass mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-center text-sm text-slate-500">
          <p>PokéJudge / PokéCode — A gamified Online Judge. Built for Trainers, by Trainers.</p>
        </div>
      </footer>
    </div>
  );
}
