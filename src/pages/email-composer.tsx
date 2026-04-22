import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Link2, Loader2, Sparkles } from 'lucide-react';
import { ScreenBack } from '../components/screen-back';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useContact } from '../data/contacts';
import { useEvent } from '../data/events';
import { useTemplates } from '../data/templates';
import { useGmailConnection, useSendGmailMessage } from '../data/gmail';
import { renderEmailTemplate } from '../lib/email-merge';
import { cn, errorMessage } from '../lib/utils';
import { toast } from 'sonner';
import type { EmailTemplateRow } from '../types/database';

// Fallback templates used when the user has not created any of their own yet.
// Mirrors the three quick options from the Cardify design.
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
  const { data: gmail } = useGmailConnection();
  const sendEmail = useSendGmailMessage();

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
    const rendered = renderEmailTemplate({
      subject: tmpl.subject,
      body: tmpl.body,
      contact,
      eventName: event?.name ?? null,
    });
    setSubject(rendered.subject);
    setBody(rendered.body);
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
      const result = await sendEmail.mutateAsync({
        contactId: contact.id,
        subject,
        body,
      });
      setSubject(result.renderedSubject);
      setBody(result.renderedBody);
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
          Logged as activity in Gmail + Cardify
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
        {!gmail && (
          <div className="mb-3 rounded-xl border border-gold/30 px-3.5 py-3 text-sm text-muted-foreground" style={{ background: 'hsl(var(--gold-glow))' }}>
            Connect Gmail in Settings before sending follow-ups from your own account.
          </div>
        )}
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
          <span className="text-[11px] text-muted-dim">
            {gmail ? `Via ${gmail.google_email} · ${gmail.sent_today} of 50 today` : 'Gmail not connected'}
          </span>
        </div>
        {gmail ? (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={send}
            disabled={sendEmail.isPending || !contact.email}
          >
            {sendEmail.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Send email <ArrowRight size={16} />
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/settings')}>
            <Link2 size={16} />
            Connect Gmail to send
          </Button>
        )}
      </div>
    </div>
  );
}
