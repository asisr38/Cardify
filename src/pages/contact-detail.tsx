import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mail,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { ScreenBack } from '../components/screen-back';
import { CardThumbnail } from '../components/card-thumbnail';
import { StatusBadge } from '../components/status-badge';
import { Button } from '../components/ui/button';
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
import {
  ContactFormFields,
  contactToForm,
  formToInsertPatch,
  useContactForm,
} from '../components/contact-form';
import {
  useContact,
  useDeleteContact,
  useSetFollowUpStatus,
  useUpdateContact,
} from '../data/contacts';
import { useEvent } from '../data/events';
import { useInteractions } from '../data/interactions';
import { formatDate, errorMessage, cn } from '../lib/utils';
import { toast } from 'sonner';
import type { FollowUpStatus } from '../types/database';

type Tab = 'info' | 'notes' | 'activity';

export function ContactDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(contactId);
  const { data: event } = useEvent(contact?.event_id ?? undefined);
  const { data: interactions } = useInteractions(contactId);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const setStatus = useSetFollowUpStatus();

  const [tab, setTab] = useState<Tab>('info');
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { form, setForm, set } = useContactForm();

  useEffect(() => {
    if (contact) setForm(contactToForm(contact));
  }, [contact, setForm]);

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="safe-top px-5">
          <ScreenBack label="Contacts" onClick={() => navigate('/')} />
        </div>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="app-shell">
        <div className="safe-top px-5">
          <ScreenBack label="Contacts" onClick={() => navigate('/')} />
        </div>
        <div className="px-5 py-10 text-center text-muted-foreground">
          This contact has been removed.
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        patch: formToInsertPatch(form),
      });
      toast.success('Saved');
      setEditing(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleStatus = async (s: FollowUpStatus) => {
    try {
      await setStatus.mutateAsync({ id: contact.id, status: s });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="app-shell flex flex-col" style={{ minHeight: '100svh' }}>
      <header className="safe-top flex items-center justify-between gap-2 px-5">
        <ScreenBack label="Contacts" onClick={() => navigate('/')} />
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setForm(contactToForm(contact));
                  setEditing(false);
                }}
                aria-label="Cancel"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-card-alt"
              >
                <X size={18} />
              </button>
              <Button size="sm" variant="gold" onClick={handleSave} disabled={updateContact.isPending}>
                <Check size={14} />
                Save
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-card-alt"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col px-5 pb-4">
        <div className="flex justify-center pt-3">
          <CardThumbnail
            name={contact.full_name}
            title={contact.title}
            company={contact.company}
            website={contact.website}
            seed={contact.id}
            size="lg"
            selected
          />
        </div>
        <div className="mt-3.5">
          <h1 className="mb-[3px] font-serif text-[24px] font-bold tracking-tight">
            {contact.full_name}
          </h1>
          <div className="text-[14px] text-muted-foreground">
            {contact.title ?? ''}
            {contact.title && contact.company ? ' · ' : ''}
            {contact.company ?? ''}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={contact.follow_up_status} />
            {event && <span className="text-[11px] text-muted-dim">{event.name}</span>}
          </div>
        </div>
      </div>

      <div className="flex border-b border-[hsl(40_54%_89%/0.08)] mx-5">
        {(['info', 'notes', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 border-b-2 pb-2.5 pt-2 text-[13px] capitalize transition-colors -mb-px',
              tab === t
                ? 'border-gold font-semibold text-gold'
                : 'border-transparent text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3.5">
        {tab === 'info' && (
          <div className="flex flex-col gap-2">
            {editing ? (
              <div className="rounded-[14px] border border-[hsl(40_54%_89%/0.08)] bg-card p-4">
                <ContactFormFields form={form} set={set} />
              </div>
            ) : (
              <>
                {[
                  { label: 'Email', value: contact.email },
                  { label: 'Phone', value: contact.phone },
                  { label: 'Website', value: contact.website },
                  { label: 'LinkedIn', value: contact.linkedin },
                  { label: 'Address', value: contact.address },
                  { label: 'Event', value: event?.name ?? null },
                  { label: 'Added', value: formatDate(contact.created_at) },
                ]
                  .filter((r) => !!r.value)
                  .map((r) => (
                    <div
                      key={r.label}
                      className="rounded-xl border border-[hsl(40_54%_89%/0.08)] bg-card px-3.5 py-[11px]"
                    >
                      <div className="label-eyebrow mb-0.5">{r.label}</div>
                      <div className="text-[13.5px] text-foreground">{r.value}</div>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div>
            {contact.voice_note_transcript ? (
              <div className="rounded-xl border border-gold/30 bg-card p-3.5">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                  Voice Note
                </div>
                <p className="text-[13px] leading-[1.55] text-muted-foreground">
                  "{contact.voice_note_transcript}"
                </p>
              </div>
            ) : (
              <div className="pt-5 text-center text-xs text-muted-dim">No voice note yet.</div>
            )}
            <div className="mt-5 text-center text-xs text-muted-dim">No other notes yet</div>
          </div>
        )}

        {tab === 'activity' && (
          <div>
            {!interactions || interactions.length === 0 ? (
              <div className="pt-10 text-center text-[13px] leading-[1.6] text-muted-dim">
                No activity logged yet.
                <br />
                Send a follow-up to start the thread.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {interactions.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-xl border border-[hsl(40_54%_89%/0.08)] bg-card px-3.5 py-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-card-alt px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Mail size={11} /> {i.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-muted-dim">
                        {formatDate(i.created_at)}
                      </span>
                    </div>
                    {i.subject && (
                      <div className="text-[13px] text-foreground">{i.subject}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[hsl(40_54%_89%/0.08)] px-5 pb-28 pt-3">
        <div className="mb-3 flex gap-1.5">
          {(['pending', 'sent', 'skipped'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              disabled={setStatus.isPending}
              className={cn(
                'flex-1 rounded-lg border px-2 py-1.5 text-[11px] capitalize transition-colors',
                contact.follow_up_status === s
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-[hsl(40_54%_89%/0.08)] bg-card text-muted-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/contacts/${contact.id}/compose`)}
        >
          Send follow-up email <ArrowRight size={16} />
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{contact.full_name}</strong> and all their
              interaction history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteContact.mutateAsync(contact);
                  toast.success('Contact deleted');
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
