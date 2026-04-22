import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, Scan as ScanIcon, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CardThumbnail } from '../components/card-thumbnail';
import { StatusBadge } from '../components/status-badge';
import { useContacts } from '../data/contacts';
import { useEvents } from '../data/events';
import { exportContactsToExcel } from '../lib/export';
import { errorMessage, formatDate } from '../lib/utils';
import { useAuth } from '../hooks/use-auth';
import { cn } from '../lib/utils';
import type { FollowUpStatus, ContactRow } from '../types/database';

type Filter = 'all' | FollowUpStatus;

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: contacts, isLoading, isError, error } = useContacts();
  const { data: events } = useEvents();

  const [filter, setFilter] = useState<Filter>('all');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contacts || contacts.length === 0) {
      toast.error('No contacts to export yet');
      return;
    }
    setExporting(true);
    try {
      await exportContactsToExcel(contacts, events ?? []);
      toast.success(`Exported ${contacts.length} contacts`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const activeEvent = events?.find((e) => e.is_active);
  const pending = useMemo(
    () => (contacts ?? []).filter((c) => c.follow_up_status === 'pending').length,
    [contacts],
  );

  const filtered = useMemo(() => {
    if (!contacts) return [] as ContactRow[];
    if (filter === 'all') return contacts;
    return contacts.filter((c) => c.follow_up_status === filter);
  }, [contacts, filter]);

  const greeting = greetingFor(new Date());
  const name = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5">
        <p className="text-[13px] text-muted-foreground">
          {greeting}, <span className="text-foreground">{name}</span>
        </p>
        <div className="mb-4 mt-[3px] flex items-end justify-between gap-3">
          <h1 className="font-serif text-[30px] font-bold leading-[1.1] tracking-tight">
            Your Contacts
          </h1>
          <button
            onClick={handleExport}
            disabled={exporting || !contacts || contacts.length === 0}
            aria-label="Export contacts to Excel"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card px-3 py-1.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export
          </button>
        </div>

        {activeEvent && (
          <button
            onClick={() => navigate(`/events/${activeEvent.id}`)}
            className="mb-3.5 flex w-full items-center justify-between gap-3 rounded-[14px] border border-gold/30 bg-card px-3.5 py-3 text-left"
          >
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-glow" />
                Active Event
              </div>
              <div className="truncate text-[13px] font-semibold text-foreground">{activeEvent.name}</div>
              <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                {formatDate(activeEvent.date)}
                {activeEvent.location && (
                  <>
                    <span>·</span>
                    <MapPin size={10} /> {activeEvent.location}
                  </>
                )}
              </div>
            </div>
            <div
              className="rounded-[10px] px-3 py-2 text-center"
              style={{ background: 'hsl(var(--gold-glow))' }}
            >
              <div className="font-serif text-[22px] font-bold leading-none text-gold">{pending}</div>
              <div className="mt-0.5 text-[9px] tracking-wider text-gold-alt">to follow up</div>
            </div>
          </button>
        )}

        <div className="mb-3.5 flex gap-[7px]">
          {(
            [
              { key: 'all', label: `All (${contacts?.length ?? 0})` },
              { key: 'pending', label: `Pending (${pending})` },
              { key: 'sent', label: 'Sent' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                filter === key ? 'bg-gold text-background' : 'bg-card text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="px-5">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {isError && (
          <div className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load contacts: {errorMessage(error)}
          </div>
        )}

        {contacts && contacts.length === 0 && <EmptyState onScan={() => navigate('/scan')} />}

        {contacts && contacts.length > 0 && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-dim">No contacts in this category</div>
        )}

        <div className="flex flex-col gap-2.5">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/contacts/${c.id}`)}
              className="flex items-center gap-3.5 rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-3 text-left transition-colors hover:border-gold/30"
            >
              <CardThumbnail
                name={c.full_name}
                title={c.title}
                company={c.company}
                website={c.website}
                seed={c.id}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 truncate text-[13.5px] font-semibold text-foreground">
                  {c.full_name}
                </div>
                <div className="mb-[7px] truncate text-[11.5px] text-muted-foreground">
                  {c.title ?? ''}
                  {c.title && c.company ? ' · ' : ''}
                  {c.company ?? ''}
                </div>
                <StatusBadge status={c.follow_up_status} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <ScanFab onClick={() => navigate('/scan')} />
    </div>
  );
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-8 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
        <Sparkles size={22} />
      </div>
      <h3 className="mb-1 font-serif text-xl">No contacts yet</h3>
      <p className="mx-auto mb-5 max-w-[28ch] text-sm text-muted-foreground">
        Scan your first business card to start your vault.
      </p>
      <button
        onClick={onScan}
        className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-background shadow-gold"
      >
        <ScanIcon size={16} /> Scan card
      </button>
    </div>
  );
}

function ScanFab({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[430px] justify-end px-5">
        <button
          onClick={onClick}
          aria-label="Scan card"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gold shadow-gold-lg active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 7V4a2 2 0 012-2h3M22 7V4a2 2 0 00-2-2h-3M2 17v3a2 2 0 002 2h3M22 17v3a2 2 0 01-2 2h-3"
              stroke="hsl(var(--background))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="7"
              y="7"
              width="10"
              height="10"
              rx="1.5"
              stroke="hsl(var(--background))"
              strokeWidth="1.8"
            />
            <rect x="10" y="10" width="4" height="4" rx="0.5" fill="hsl(var(--background))" />
          </svg>
        </button>
      </div>
    </div>
  );
}
