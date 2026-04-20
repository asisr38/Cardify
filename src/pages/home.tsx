import { useAuth } from '../hooks/use-auth';

export function Home() {
  const { user } = useAuth();
  const name = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <p className="label-eyebrow">CardVault</p>
        <h1 className="mt-1 font-serif text-[32px] leading-[1.08] tracking-tight">
          Welcome back, <em className="not-italic italic text-ember">{name}</em>.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Events and contacts will live here. We'll wire the data layer in Milestone 2.
        </p>
      </header>

      <section className="px-5">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="label-eyebrow">Milestone 1 · complete</p>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground">
            <li>· Vite + React + TS + Tailwind + shadcn primitives</li>
            <li>· Supabase client configured (magic-link auth)</li>
            <li>· Protected routing</li>
            <li>· Editorial warm theme (ink / cream / ember)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
