import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useContacts } from '../data/contacts';
import { useEvents } from '../data/events';
import { Avatar } from '../components/avatar';
import { StatusBadge } from '../components/status-badge';
import { cn, errorMessage } from '../lib/utils';
import type { FollowUpStatus } from '../types/database';

const STATUS_OPTIONS: { id: 'all' | FollowUpStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'skipped', label: 'Skipped' },
];

export function Contacts() {
  const { data: contacts, isLoading, isError, error } = useContacts();
  const { data: events } = useEvents();

  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FollowUpStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (contacts ?? []).filter((c) => {
      if (eventFilter !== 'all' && c.event_id !== eventFilter) return false;
      if (statusFilter !== 'all' && c.follow_up_status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [c.full_name, c.company, c.voice_note_transcript].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, query, eventFilter, statusFilter]);

  const eventNameById = useMemo(() => {
    const map = new Map<string, string>();
    events?.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [events]);

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <h1 className="font-serif text-[28px] leading-tight">All contacts</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {contacts?.length ?? 0} people across {events?.length ?? 0} events
        </p>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              className="flex h-11 w-full rounded-xl border border-input bg-card py-2 pl-10 pr-9 text-base text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Search by name, company, voice note…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-label="Filters"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl border',
              showFilters
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground',
            )}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3 animate-slide-up">
            <div>
              <div className="label-eyebrow mb-1.5">Event</div>
              <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
                <Chip active={eventFilter === 'all'} onClick={() => setEventFilter('all')}>
                  All events
                </Chip>
                {events?.map((e) => (
                  <Chip key={e.id} active={eventFilter === e.id} onClick={() => setEventFilter(e.id)}>
                    {e.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="label-eyebrow mb-1.5">Follow-up</div>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <Chip key={s.id} active={statusFilter === s.id} onClick={() => setStatusFilter(s.id)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 px-5">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage(error)}
          </div>
        )}

        {contacts && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <h3 className="mb-1 font-serif text-xl">
              {contacts.length === 0 ? 'Nobody yet.' : 'Nothing matches.'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {contacts.length === 0
                ? 'Add a contact from an event to start building your library.'
                : 'Try a looser query or clear the filters.'}
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {filtered.map((c, i) => (
              <li key={c.id} className={i > 0 ? 'border-t border-border' : ''}>
                <Link to={`/contacts/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/40">
                  <Avatar name={c.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium">{c.full_name}</div>
                      <StatusBadge status={c.follow_up_status} />
                    </div>
                    <div className="truncate text-[13px] text-muted-foreground">
                      {c.title ?? ''}
                      {c.title && c.company ? ' · ' : ''}
                      {c.company ?? ''}
                    </div>
                    {c.event_id && eventNameById.get(c.event_id) && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        from {eventNameById.get(c.event_id)}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
        active ? 'border-ember bg-ember text-ember-foreground' : 'border-border bg-card text-foreground',
      )}
    >
      {children}
    </button>
  );
}
