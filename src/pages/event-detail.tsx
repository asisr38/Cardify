import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, MapPin, UserPlus, Loader2, MoreHorizontal, Coffee, Trash2 } from 'lucide-react';
import { TopBar } from '../components/top-bar';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/status-badge';
import { Avatar } from '../components/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { NewContactSheet } from '../components/new-contact-sheet';
import { useEvent, useDeleteEvent, useSetActiveEvent } from '../data/events';
import { useContactsForEvent } from '../data/contacts';
import { formatDate, errorMessage } from '../lib/utils';
import { toast } from 'sonner';

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(eventId);
  const { data: contacts } = useContactsForEvent(eventId);
  const setActive = useSetActiveEvent();
  const deleteEvent = useDeleteEvent();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="app-shell">
        <TopBar back />
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-shell">
        <TopBar back title="Event not found" />
        <div className="px-5 py-10 text-center text-muted-foreground">
          That event has slipped away.
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell safe-bottom">
      <TopBar
        back
        title={event.name}
        right={
          <button
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete event"
            className="flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 active:scale-[0.97]"
          >
            <Trash2 size={16} />
          </button>
        }
      />

      <section className="px-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{formatDate(event.date)}</div>
              {event.location && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {event.location}
                </div>
              )}
            </div>
            {event.is_active ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-ember/20 bg-ember/10 px-2 py-0.5 text-xs font-medium text-ember">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                Active
              </span>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await setActive.mutateAsync(event.id);
                    toast.success('Now your active event');
                  } catch (err) {
                    toast.error(errorMessage(err));
                  }
                }}
                disabled={setActive.isPending}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted active:scale-[0.97]"
              >
                Make active
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Captured" value={event.contact_count} />
            <Stat label="Followed up" value={event.sent_count} accent />
            <Stat label="Pending" value={event.pending_count} />
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-[22px]">People</h2>
          <span className="text-xs text-muted-foreground">
            {contacts?.length ?? 0} total
          </span>
        </div>

        {contacts && contacts.length === 0 && <EmptyPeople />}

        {contacts && contacts.length > 0 && (
          <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {contacts.map((c, i) => (
              <li key={c.id} className={i > 0 ? 'border-t border-border' : ''}>
                <Link
                  to={`/contacts/${c.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/40 active:scale-[0.99]"
                >
                  <Avatar name={c.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium text-foreground">{c.full_name}</div>
                      <StatusBadge status={c.follow_up_status} />
                    </div>
                    <div className="truncate text-[13px] text-muted-foreground">
                      {c.title ?? ''}
                      {c.title && c.company ? <span> · </span> : null}
                      {c.company ?? ''}
                    </div>
                  </div>
                  <MoreHorizontal size={16} className="text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FixedActions
        onAdd={() => setAddOpen(true)}
        onScan={() => navigate(`/events/${event.id}/scan`)}
      />

      <NewContactSheet open={addOpen} onOpenChange={setAddOpen} eventId={event.id} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{event.name}</strong> will be removed. Contacts at
              this event stay in your library — they'll just lose the event tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteEvent.mutateAsync(event.id);
                  toast.success('Event deleted');
                  navigate('/');
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-serif text-[28px] leading-none ${accent ? 'text-ember' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyPeople() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-ember">
        <Coffee size={22} />
      </div>
      <h3 className="mb-1 font-serif text-xl">Quiet so far.</h3>
      <p className="mx-auto max-w-[28ch] text-sm text-muted-foreground">
        Scan a card or add one manually to get started.
      </p>
    </div>
  );
}

function FixedActions({ onAdd, onScan }: { onAdd: () => void; onScan: () => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <div className="pointer-events-auto mx-auto grid max-w-[430px] grid-cols-2 gap-3 px-5">
        <Button variant="outline" size="lg" className="bg-card shadow-soft" onClick={onAdd}>
          <UserPlus />
          Add manually
        </Button>
        <Button variant="ember" size="lg" className="shadow-lift" onClick={onScan}>
          <Camera />
          Scan card
        </Button>
      </div>
    </div>
  );
}
