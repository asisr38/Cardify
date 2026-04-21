import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/use-auth';
import { toast } from 'sonner';

export function SignIn() {
  const { session, loading, signInWithMagicLink } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'input' | 'sending' | 'sent'>('input');

  if (!loading && session) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
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
        <h1 className="mb-2.5 font-serif text-[38px] font-bold leading-none tracking-tight">CardVault</h1>
        <p className="max-w-[24ch] text-[15px] leading-[1.55] text-muted-foreground">
          Scan cards. Build relationships.
          <br />
          Never lose a connection.
        </p>
      </div>

      <div className="mt-11">
        {phase === 'input' && (
          <form onSubmit={submit} className="animate-fade-up">
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
        )}

        {phase === 'sending' && (
          <div className="animate-fade-in flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Sending link…
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
              onClick={() => setPhase('input')}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
