import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Quote,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { TopBar } from '../components/top-bar';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/avatar';
import { StatusBadge } from '../components/status-badge';
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
import { useContact, useDeleteContact, useSetFollowUpStatus, useUpdateContact } from '../data/contacts';
import { useEvent } from '../data/events';
import { useInteractions } from '../data/interactions';
import { formatDate, errorMessage } from '../lib/utils';
import { toast } from 'sonner';
import type { FollowUpStatus } from '../types/database';

export function ContactDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(contactId);
  const { data: event } = useEvent(contact?.event_id ?? undefined);
  const { data: interactions } = useInteractions(contactId);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const setStatus = useSetFollowUpStatus();

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { form, setForm, set } = useContactForm();

  useEffect(() => {
    if (contact) setForm(contactToForm(contact));
  }, [contact, setForm]);

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

  if (!contact) {
    return (
      <div className="app-shell">
        <TopBar back title="Contact" />
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

  const handleStatus = async (status: FollowUpStatus) => {
    try {
      await setStatus.mutateAsync({ id: contact.id, status });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="app-shell safe-bottom">
      <TopBar
        back
        right={
          editing ? (
            <>
              <button
                onClick={() => {
                  setForm(contactToForm(contact));
                  setEditing(false);
                }}
                aria-label="Cancel"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              >
                <X size={18} />
              </button>
              <Button size="sm" onClick={handleSave} disabled={updateContact.isPending}>
                <Check size={14} />
                Save
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
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
          )
        }
      />

      <section className="px-5">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={contact.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-[26px] leading-tight">{contact.full_name}</h1>
            <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {contact.title ?? ''}
              {contact.title && contact.company ? ' · ' : ''}
              {contact.company ?? ''}
            </div>
            <div className="mt-2">
              <StatusBadge status={contact.follow_up_status} />
            </div>
          </div>
        </div>

        {event && (
          <Link
            to={`/events/${event.id}`}
            className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-soft hover:bg-muted/40"
          >
            <div>
              <div className="label-eyebrow">Captured at</div>
              <div className="mt-0.5 text-sm font-medium">{event.name}</div>
            </div>
            <div className="text-xs text-muted-foreground">{formatDate(event.date)}</div>
          </Link>
        )}

        {(contact.voice_note_transcript || editing) && (
          <div className="relative mb-5 rounded-2xl border border-ember/20 bg-ember/5 p-4">
            <Quote className="absolute right-3 top-3 text-ember/30" size={28} />
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-ember">
              <MessageSquare size={11} />
              Voice note
            </div>
            {editing ? null : (
              <p className="font-serif text-[17px] italic leading-snug">
                "{contact.voice_note_transcript}"
              </p>
            )}
          </div>
        )}

        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {editing ? (
            <div className="p-4">
              <ContactFormFields form={form} set={set} />
            </div>
          ) : (
            <ul>
              {contact.email && (
                <Field icon={<Mail size={16} />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
              )}
              {contact.phone && (
                <Field icon={<Phone size={16} />} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
              )}
              {contact.website && (
                <Field icon={<Globe size={16} />} label="Website" value={contact.website} href={hrefFor(contact.website)} />
              )}
              {contact.linkedin && (
                <Field icon={<Linkedin size={16} />} label="LinkedIn" value={contact.linkedin} href={hrefFor(contact.linkedin)} />
              )}
              {contact.address && <Field icon={<MapPin size={16} />} label="Address" value={contact.address} />}
              {!hasAnyField(contact) && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No contact details yet. Tap the pencil to add them.
                </div>
              )}
            </ul>
          )}
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="font-serif text-lg">Follow-up</h3>
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <div className="flex gap-2">
            {(['pending', 'sent', 'skipped'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                disabled={setStatus.isPending}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                  contact.follow_up_status === s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 font-serif text-lg">Interaction history</h3>
          {!interactions || interactions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
              <p className="text-sm text-muted-foreground">No interactions yet. The silence is on you.</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {interactions.map((i, idx) => (
                <li key={i.id} className={idx > 0 ? 'border-t border-border p-4' : 'p-4'}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <Mail size={11} /> {i.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(i.created_at)}</span>
                  </div>
                  {i.subject && <div className="mt-1.5 text-sm">{i.subject}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Follow-up emails arrive in Milestone 4.
        </p>
      </section>

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
                  navigate(-1);
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

function hasAnyField(c: {
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  address: string | null;
}) {
  return !!(c.email || c.phone || c.website || c.linkedin || c.address);
}

function hrefFor(value: string) {
  if (!value) return '#';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function Field({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="label-eyebrow">{label}</div>
        <div className="mt-0.5 truncate text-sm">{value}</div>
      </div>
    </>
  );
  const cls = 'flex items-center gap-3 p-4 hover:bg-muted/40 active:scale-[0.99]';
  return (
    <li className="border-b border-border last:border-b-0">
      {href ? (
        <a href={href} className={cls} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </li>
  );
}
