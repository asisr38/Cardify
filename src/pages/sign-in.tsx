import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, Check, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/use-auth';
import { toast } from 'sonner';

export function SignIn() {
  const { session, loading, signInWithMagicLink } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!loading && session) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setSending(true);
    const { error } = await signInWithMagicLink(email.trim());
    setSending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="app-shell flex flex-col">
      <div className="safe-top px-6" />

      <main className="flex flex-1 flex-col px-6 pt-10">
        <p className="label-eyebrow">CardVault</p>
        <h1 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight">
          Your <em className="not-italic italic text-ember">rooms</em>,
          <br />
          not your rolodex.
        </h1>
        <p className="mt-3 max-w-[32ch] text-sm text-muted-foreground">
          Sign in with a magic link — no passwords, no friction. One tap from your inbox and you're back in.
        </p>

        {sent ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card animate-slide-up">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ember/15 text-ember">
              <Check size={20} />
            </div>
            <h2 className="font-serif text-xl">Check your inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. It expires in 1 hour.
            </p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={sending || !email}>
              {sending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send magic link
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
        )}
      </main>

      <footer className="px-6 pb-10 pt-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to our terms. Your data stays yours.
      </footer>
    </div>
  );
}
