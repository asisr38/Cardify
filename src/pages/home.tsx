import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { NewEventSheet } from '../components/new-event-sheet';
import { useEvents, type EventWithStats } from '../data/events';
import { formatDate, errorMessage } from '../lib/utils';
import { useAuth } from '../hooks/use-auth';

export function Home() {
  const { user } = useAuth();
  const { data: events, isLoading, isError, error } = useEvents();
  const [newEventOpen, setNewEventOpen] = useState(false);
  const navigate = useNavigate();

  const name = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <p className="label-eyebrow">CardVault</p>
        <h1 className="mt-1 font-serif text-[32px] leading-[1.06] tracking-tight">
          Your <em className="not-italic italic text-ember">rooms</em>, not your rolodex.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back, <span className="text-foreground">{name}</span>.
        </p>
      </header>

      <section className="space-y-3 px-5">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load events: {errorMessage(error)}
          </div>
        )}

        {events && events.length === 0 && <EmptyState onCreate={() => setNewEventOpen(true)} />}

        {events?.map((evt) => (
          <EventCard key={evt.id} event={evt} onOpen={() => navigate(`/events/${evt.id}`)} />
        ))}
      </section>

      <FloatingAction onClick={() => setNewEventOpen(true)} />

      <NewEventSheet
        open={newEventOpen}
        onOpenChange={setNewEventOpen}
        onCreated={(id) => navigate(`/events/${id}`)}
      />
    </div>
  );
}

function EventCard({ event, onOpen }: { event: EventWithStats; onOpen: () => void }) {
  const ratio = event.contact_count === 0 ? 0 : event.sent_count / event.contact_count;
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-shadow hover:shadow-lift active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
            {event.is_active && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ember/20 bg-ember/10 px-2 py-0.5 text-xs font-medium text-ember">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                Active
              </span>
            )}
          </div>
          <h3 className="truncate font-serif text-[20px] leading-tight">{event.name}</h3>
          {event.location && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} /> {event.location}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-serif text-[28px] leading-none">{event.contact_count}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">contacts</div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-ember transition-all"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          <strong className="font-semibold text-foreground">{event.sent_count}</strong> of {event.contact_count} followed up
        </span>
      </div>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
        <Sparkles size={22} />
      </div>
      <h3 className="mb-1 font-serif text-xl">A clean slate.</h3>
      <p className="mx-auto mb-5 max-w-[28ch] text-sm text-muted-foreground">
        Every great network starts with one conversation. Create your first event to begin.
      </p>
      <Button onClick={onCreate}>
        <Plus />
        Create event
      </Button>
    </div>
  );
}

function FloatingAction({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[430px] justify-end px-5">
        <Button variant="ember" size="lg" onClick={onClick} className="rounded-full pl-4 pr-5 shadow-lift">
          <Plus />
          New event
        </Button>
      </div>
    </div>
  );
}
