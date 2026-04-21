import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ScreenBack } from '../components/screen-back';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useContact, useSetFollowUpStatus } from '../data/contacts';
import { useEvent } from '../data/events';
import { useTemplates, useCreateTemplate } from '../data/templates';
import { useCreateInteraction } from '../data/interactions';
import { cn, errorMessage, firstName } from '../lib/utils';
import { toast } from 'sonner';
import type { EmailTemplateRow } from '../types/database';

// Fallback templates used when the user has not created any of their own yet.
// Mirrors the three quick options from the CardVault design.
const FALLBACK_TEMPLATES: Pick<EmailTemplateRow, 'id' | 'name' | 'subject' | 'body'>[] = [
  {
    id: 'conference-followup',
    name: 'Conference Follow-up',
    subject: 'Great connecting at {event}',
    body: `Hi {first_name},\n\nSo glad we got to meet at {event}. I've been thinking about {voice_note_snippet} — would love to pick up where we left off.\n\nWould a 30-minute call next week work for you? Happy to send over a Calendly link.\n\nWarm regards,\nAlex`,
  },
  {
    id: 'quick-touch',
    name: 'Quick Touch',
    subject: 'Following up from {event}',
    body: `Hi {first_name},\n\nJust a quick note to say it was great meeting you at {event}. Looking forward to staying in touch!\n\nBest,\nAlex`,
  },
  {
    id: 'resource-share',
    name: 'Resource Share',
    subject: 'Something useful for {company}',
    body: `Hi {first_name},\n\nFollowing up from our chat at {event}. I thought you might find this helpful given what we discussed about {voice_note_snippet}.\n\n[Attach resource here]\n\nLet me know what you think!\n\nBest,\nAlex`,
  },
];

export function EmailComposer() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(contactId);
  const { data: event } = useEvent(contact?.event_id ?? undefined);
  const { data: userTemplates } = useTemplates();
  const createInteraction = useCreateInteraction();
  const createTemplate = useCreateTemplate();
  const setStatus = useSetFollowUpStatus();

  const templates = useMemo(() => {
    if (userTemplates && userTemplates.length > 0) return userTemplates;
    return FALLBACK_TEMPLATES as EmailTemplateRow[];
  }, [userTemplates]);

  const [tmplId, setTmplId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!tmplId && templates.length > 0) setTmplId(templates[0].id);
  }, [templates, tmplId]);

  useEffect(() => {
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl || !contact) return;
    setSubject(resolve(tmpl.subject, contact, event?.name ?? null));
    setBody(resolve(tmpl.body, contact, event?.name ?? null));
  }, [tmplId, contact, event, templates]);

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="safe-top px-5">
          <ScreenBack onClick={() => navigate(-1)} />
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
          <ScreenBack onClick={() => navigate('/')} />
        </div>
        <div className="px-5 py-10 text-center text-muted-foreground">Contact not found.</div>
      </div>
    );
  }

  const send = async () => {
    if (!contact.email) {
      toast.error('This contact has no email on file.');
      return;
    }
    try {
      await createInteraction.mutateAsync({
        contact_id: contact.id,
        type: 'email_sent',
        subject,
        body,
      });
      await setStatus.mutateAsync({ id: contact.id, status: 'sent' });
      // Persist a user template the first time they compose, so future
      // sessions have a real one to load instead of the fallback.
      if (!userTemplates || userTemplates.length === 0) {
        const tmpl = templates.find((t) => t.id === tmplId);
        if (tmpl) {
          try {
            await createTemplate.mutateAsync({
              name: tmpl.name,
              subject: tmpl.subject,
              body: tmpl.body,
            });
          } catch {
            /* non-critical */
          }
        }
      }
      setSent(true);
      setTimeout(() => navigate(`/contacts/${contact.id}`), 1800);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (sent) {
    return (
      <div className="app-shell flex animate-fade-in flex-col items-center justify-center px-5">
        <div className="mb-[18px] text-[52px]">✉️</div>
        <h2 className="mb-2 font-serif text-[24px] font-bold">Email sent!</h2>
        <p className="text-sm text-muted-foreground">Delivered to {contact.full_name}</p>
        <div className="mt-4 rounded-xl bg-card px-4 py-2 text-[11px] text-muted-dim">
          Logged as activity
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex flex-col" style={{ minHeight: '100svh' }}>
      <header className="safe-top px-5 pb-3.5">
        <ScreenBack onClick={() => navigate(-1)} />
        <h1 className="mb-[3px] mt-2 font-serif text-[26px] font-bold leading-tight tracking-tight">
          Follow-up Email
        </h1>
        <p className="text-[13px] text-muted-foreground">
          To: {contact.email ?? <span className="text-destructive">no email on file</span>}
        </p>
      </header>

      <section className="px-5 pb-3">
        <div className="label-eyebrow mb-2">Template</div>
        <div className="flex flex-wrap gap-[7px]">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTmplId(t.id)}
              className={cn(
                'rounded-full border px-3 py-[7px] text-[11.5px] font-semibold transition-colors',
                tmplId === t.id
                  ? 'border-gold bg-gold text-background'
                  : 'border-[hsl(40_54%_89%/0.08)] bg-card text-muted-foreground',
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <div className="flex-1 overflow-y-auto px-5">
        <label className="mb-3 block">
          <span className="label-eyebrow mb-1.5 block">Subject</span>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>

        <label className="mb-3 block">
          <span className="label-eyebrow mb-1.5 block">Message</span>
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>

        <div className="mb-4 flex gap-2 rounded-xl border border-gold/30 px-3.5 py-2.5 text-[12px] leading-[1.55] text-muted-foreground" style={{ background: 'hsl(var(--gold-glow))' }}>
          <Sparkles size={14} className="mt-0.5 shrink-0 text-gold" />
          <span>
            <span className="text-gold">Merge fields</span> —{' '}
            <code className="text-[11px] text-gold-alt">{'{first_name}'}</code>,{' '}
            <code className="text-[11px] text-gold-alt">{'{event}'}</code>, and{' '}
            <code className="text-[11px] text-gold-alt">{'{voice_note_snippet}'}</code> are filled
            from contact data.
          </span>
        </div>
      </div>

      <div className="border-t border-[hsl(40_54%_89%/0.08)] px-5 pb-8 pt-3">
        <div className="mb-2 flex justify-end">
          <span className="text-[11px] text-muted-dim">Via your email · 1 of 50 today</span>
        </div>
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={send}
          disabled={createInteraction.isPending || !contact.email}
        >
          {createInteraction.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Send email <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function resolve(
  str: string,
  contact: { full_name: string; company: string | null; voice_note_transcript: string | null },
  eventName: string | null,
): string {
  const snippet = contact.voice_note_transcript
    ? contact.voice_note_transcript.slice(0, 55) + '…'
    : 'your goals';
  return str
    .replace(/\{first_name\}/g, firstName(contact.full_name))
    .replace(/\{event\}/g, eventName ?? 'our recent meeting')
    .replace(/\{company\}/g, contact.company ?? 'your team')
    .replace(/\{voice_note_snippet\}/g, snippet);
}
