import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/use-auth';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

type Mode = 'magic' | 'password';
type Phase = 'input' | 'sending' | 'sent' | 'confirm';

export function SignIn() {
  const { session, loading, signInWithMagicLink, signInWithPassword, signUpWithPassword } =
    useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('magic');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<Phase>('input');

  if (!loading && session) return <Navigate to={from} replace />;

  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setPhase('sending');
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setPhase('input');
      toast.error(error);
      return;
    }
    setPhase('sent');
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPhase('sending');
    if (isSignUp) {
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
      if (error) {
        setPhase('input');
        toast.error(error);
        return;
      }
      if (needsConfirmation) {
        setPhase('confirm');
        return;
      }
      toast.success('Account created');
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        setPhase('input');
        toast.error(error);
        return;
      }
    }
  };

  const resetToInput = () => {
    setPhase('input');
    setPassword('');
  };

  return (
    <div className="app-shell relative flex flex-col justify-center overflow-hidden px-7">
      <div
        className="pointer-events-none absolute -right-20 -bottom-20 h-60 w-60 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold-glow-strong)) 0%, transparent 70%)' }}
      />

      <div className="animate-fade-up">
        <div
          className="mb-[22px] flex h-[60px] w-[60px] items-center justify-center rounded-[18px] border border-gold/20 shadow-gold-lg"
          style={{ background: 'linear-gradient(145deg, hsl(var(--card-alt)), hsl(var(--card)))' }}
        >
          <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
            <rect x="0.75" y="0.75" width="28.5" height="20.5" rx="3" stroke="hsl(var(--gold))" strokeWidth="1.1" />
            <rect x="3.5" y="3.5" width="8" height="5.5" rx="1.2" fill="hsl(var(--gold))" opacity="0.5" />
            <rect x="3.5" y="12" width="15" height="1.5" rx="0.75" fill="hsl(var(--gold))" opacity="0.35" />
            <rect x="3.5" y="15" width="10" height="1.5" rx="0.75" fill="hsl(var(--gold))" opacity="0.25" />
            <rect x="21" y="3.5" width="5.5" height="5.5" rx="1.2" fill="hsl(var(--gold))" opacity="0.2" />
          </svg>
        </div>
        <h1 className="mb-2.5 font-serif text-[38px] font-bold leading-none tracking-tight">Cardify</h1>
        <p className="max-w-[24ch] text-[15px] leading-[1.55] text-muted-foreground">
          Scan cards. Build relationships.
          <br />
          Never lose a connection.
        </p>
      </div>

      <div className="mt-11">
        {phase === 'input' && (
          <div className="animate-fade-up">
            <div className="mb-4 inline-flex rounded-full border border-[hsl(40_54%_89%/0.08)] bg-card p-1 text-[12px] font-semibold">
              <button
                type="button"
                onClick={() => setMode('magic')}
                className={cn(
                  'rounded-full px-3.5 py-1.5 transition-colors',
                  mode === 'magic' ? 'bg-gold text-background' : 'text-muted-foreground',
                )}
              >
                Magic link
              </button>
              <button
                type="button"
                onClick={() => setMode('password')}
                className={cn(
                  'rounded-full px-3.5 py-1.5 transition-colors',
                  mode === 'password' ? 'bg-gold text-background' : 'text-muted-foreground',
                )}
              >
                Password
              </button>
            </div>

            {mode === 'magic' ? (
              <form onSubmit={submitMagic}>
                <div className="label-eyebrow mb-2.5">Sign in with email</div>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="mb-2.5"
                />
                <Button type="submit" variant="gold" size="lg" className="w-full">
                  Send magic link <ArrowRight size={16} />
                </Button>
                <p className="mt-[18px] text-center text-xs leading-[1.7] text-muted-dim">
                  No password needed · GDPR compliant
                  <br />
                  Delete all your data anytime from Settings
                </p>
              </form>
            ) : (
              <form onSubmit={submitPassword}>
                <div className="label-eyebrow mb-2.5">
                  {isSignUp ? 'Create an account' : 'Sign in with password'}
                </div>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="mb-2.5"
                />
                <Input
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'Choose a password (6+ chars)' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mb-2.5"
                />
                <Button type="submit" variant="gold" size="lg" className="w-full">
                  {isSignUp ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
                </Button>
                <div className="mt-4 text-center text-xs text-muted-dim">
                  {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp((v) => !v)}
                    className="text-gold underline-offset-2 hover:underline"
                  >
                    {isSignUp ? 'Sign in' : 'Create account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {phase === 'sending' && (
          <div className="animate-fade-in flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />{' '}
            {mode === 'magic' ? 'Sending link…' : isSignUp ? 'Creating account…' : 'Signing in…'}
          </div>
        )}

        {phase === 'sent' && (
          <div className="animate-fade-up text-center">
            <div className="mb-3.5 text-[44px]">✉️</div>
            <h2 className="mb-2 font-serif text-[22px]">Check your inbox</h2>
            <p className="text-sm leading-[1.5] text-muted-foreground">
              Magic link sent to
              <br />
              <span className="text-gold">{email}</span>
            </p>
            <button
              className="mt-6 text-xs text-muted-dim underline-offset-2 hover:underline"
              onClick={resetToInput}
            >
              Use a different email
            </button>
          </div>
        )}

        {phase === 'confirm' && (
          <div className="animate-fade-up text-center">
            <div className="mb-3.5 text-[44px]">📬</div>
            <h2 className="mb-2 font-serif text-[22px]">Confirm your email</h2>
            <p className="text-sm leading-[1.5] text-muted-foreground">
              Confirmation link sent to
              <br />
              <span className="text-gold">{email}</span>
              <br />
              Click it to finish creating your account.
            </p>
            <button
              className="mt-6 text-xs text-muted-dim underline-offset-2 hover:underline"
              onClick={resetToInput}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
