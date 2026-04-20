import { LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';
import { toast } from 'sonner';

export function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <h1 className="font-serif text-[28px] leading-tight">Settings</h1>
      </header>

      <section className="space-y-4 px-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="label-eyebrow">Account</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember font-serif text-ember-foreground">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in via magic link</p>
            </div>
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

        <p className="pt-4 text-center text-xs text-muted-foreground">
          CardVault · v0.1 · Milestone 1
        </p>
      </section>
    </div>
  );
}
