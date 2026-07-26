import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Pokeball } from '@/components/Pokeball';
import { Mail, Lock, User, Zap, AlertCircle, MailCheck, Loader2 } from 'lucide-react';

export function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, resendConfirmation } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!username.trim()) throw new Error('Trainer name is required.');
        await signUp(email, password, username.trim());
        toast('success', 'Welcome, Trainer! Your journey begins now.');
      } else {
        await signIn(email, password);
        toast('success', 'Welcome back, Trainer!');
      }
      navigate('/problems');
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      // Detect email-not-confirmed errors and offer resend
      if (/not confirmed|email.*confirm|Email not confirmed/i.test(msg)) {
        setNeedsConfirmation(true);
      } else {
        toast('error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendConfirmation(email);
      toast('success', 'Confirmation email sent! Check your inbox.');
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex animate-float">
            <Pokeball size={72} className="drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white">
            {mode === 'signin' ? 'Welcome Back, Trainer' : 'Begin Your Journey'}
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            {mode === 'signin' ? 'Sign in to continue your quest' : 'Register to catch your first problem'}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex gap-1 mb-6 rounded-lg bg-slate-900/60 p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); setNeedsConfirmation(false); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setNeedsConfirmation(false); }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200 flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0" />
              The very first registered Trainer becomes the Gym Leader (Admin).
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Trainer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-10"
                    placeholder="AshKetchum"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="trainer@pokejudge.io"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
                {needsConfirmation && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-200 underline"
                  >
                    {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Casting Pokéball...' : mode === 'signin' ? 'Sign In' : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            {mode === 'signin' ? (
              <>New here? <button onClick={() => { setMode('signup'); setError(''); setNeedsConfirmation(false); }} className="text-red-400 hover:text-red-300 font-semibold">Register</button></>
            ) : (
              <>Already a Trainer? <button onClick={() => { setMode('signin'); setError(''); setNeedsConfirmation(false); }} className="text-red-400 hover:text-red-300 font-semibold">Sign In</button></>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
