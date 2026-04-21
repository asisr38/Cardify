import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, MapPin } from 'lucide-react';
import { NewEventSheet } from '../components/new-event-sheet';
import { useEvents } from '../data/events';
import { formatDate, errorMessage } from '../lib/utils';

export function Events() {
  const { data: events, isLoading, isError, error } = useEvents();
  const [newEventOpen, setNewEventOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-shell safe-bottom">
      <header className="safe-top px-5 pb-4">
        <h1 className="font-serif text-[30px] font-bold leading-[1.1] tracking-tight">Events</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {events?.length ?? 0} event{events?.length === 1 ? '' : 's'}
        </p>
      </header>

      <section className="flex flex-col gap-2.5 px-5">
        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load events: {errorMessage(error)}
          </div>
        )}

        {events?.map((ev) => (
          <button
            key={ev.id}
            onClick={() => navigate(`/events/${ev.id}`)}
            className={`rounded-[14px] border p-4 text-left transition-colors hover:border-gold/30 ${
              ev.is_active
                ? 'border-gold/30 bg-card'
                : 'border-[hsl(40_54%_89%/0.08)] bg-card'
            }`}
          >
            {ev.is_active && (
              <div className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-glow" />
                Active
              </div>
            )}
            <div className="mb-[3px] text-[15px] font-semibold text-foreground">{ev.name}</div>
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{formatDate(ev.date)}</span>
              {ev.location && (
                <>
                  <span>·</span>
                  <MapPin size={10} />
                  {ev.location}
                </>
              )}
            </div>
            <div className="text-xs text-muted-dim">
              {ev.contact_count > 0
                ? `${ev.contact_count} contact${ev.contact_count === 1 ? '' : 's'} · ${ev.sent_count} followed up`
                : 'No contacts yet'}
            </div>
          </button>
        ))}

        <button
          onClick={() => setNewEventOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[14px] border border-dashed border-[hsl(40_54%_89%/0.12)] p-3.5 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Plus size={16} /> New Event
        </button>
      </section>

      <NewEventSheet
        open={newEventOpen}
        onOpenChange={setNewEventOpen}
        onCreated={(id) => navigate(`/events/${id}`)}
      />
    </div>
  );
}
