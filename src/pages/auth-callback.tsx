import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // Supabase's PKCE flow places a `code` query param on return.
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorDescription = params.get('error_description');

      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        navigate('/', { replace: true });
        return;
      }

      // Fall back to the implicit-flow hash handler (detectSessionInUrl).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate('/', { replace: true });
      } else {
        setError('No sign-in code was present in the URL.');
      }
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center px-6">
      {error ? (
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle size={20} />
          </div>
          <h2 className="font-serif text-xl">Sign-in link failed</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5" onClick={() => navigate('/auth/sign-in', { replace: true })}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin" />
          <p className="text-sm">Finishing sign-in…</p>
        </div>
      )}
    </div>
  );
}
