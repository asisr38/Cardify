import { useEffect } from 'react';
import { Link2, Loader2, LogOut, Mail, Unplug } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';
import {
  useDisconnectGmail,
  useGmailConnection,
  useStartGmailConnect,
} from '../data/gmail';
import { toast } from 'sonner';
import { errorMessage, formatDate } from '../lib/utils';

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: gmail, isLoading: gmailLoading } = useGmailConnection();
  const startConnect = useStartGmailConnect();
  const disconnect = useDisconnectGmail();

  useEffect(() => {
    const status = searchParams.get('gmail');
    const message = searchParams.get('message');
    if (!status) return;
    if (status === 'connected') toast.success('Gmail connected');
    if (status === 'error') toast.error(message || 'Could not connect Gmail');
    navigate('/settings', { replace: true });
  }, [navigate, searchParams]);

  const connectGmail = async () => {
    try {
      const { authUrl } = await startConnect.mutateAsync('/settings');
      window.location.href = authUrl;
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <h1 className="font-serif text-[30px] font-bold leading-[1.1] tracking-tight">Settings</h1>
      </header>

      <section className="space-y-4 px-5">
        <div className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-4">
          <p className="label-eyebrow">Account</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-serif text-background">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in via magic link</p>
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-eyebrow">Gmail</p>
              <h2 className="mt-1 text-sm font-medium text-foreground">Send from your own inbox</h2>
              <p className="mt-1 text-xs leading-[1.6] text-muted-foreground">
                Uses Gmail OAuth with 1-to-1 sending only. Daily cap: 50 emails.
              </p>
            </div>
            <Mail className="text-gold" size={18} />
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card-alt px-3.5 py-3">
            {gmailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Checking Gmail connection…
              </div>
            ) : gmail ? (
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground">{gmail.google_email}</div>
                <div className="text-xs text-muted-foreground">
                  Connected {formatDate(gmail.connected_at)} · {gmail.sent_today} of 50 sent today
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No Gmail account connected yet.</div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant={gmail ? 'secondary' : 'gold'}
              className="flex-1"
              onClick={connectGmail}
              disabled={startConnect.isPending}
            >
              {startConnect.isPending ? (
                <Loader2 className="animate-spin" />
              ) : gmail ? (
                <>
                  <Link2 />
                  Reconnect Gmail
                </>
              ) : (
                <>
                  <Mail />
                  Connect Gmail
                </>
              )}
            </Button>
            {gmail && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  try {
                    await disconnect.mutateAsync();
                    toast.success('Gmail disconnected');
                  } catch (err) {
                    toast.error(errorMessage(err));
                  }
                }}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? <Loader2 className="animate-spin" /> : <><Unplug /> Disconnect</>}
              </Button>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signOut();
            toast.success('Signed out');
          }}
        >
          <LogOut />
          Sign out
        </Button>

        <p className="pt-4 text-center text-xs text-muted-dim">
          Cardify · v0.1
        </p>
      </section>
    </div>
  );
}
