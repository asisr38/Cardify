import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { ContactRow } from '../types/database';

export interface ContactFormValues {
  full_name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  address: string;
  voice_note_transcript: string;
}

export const emptyContactForm: ContactFormValues = {
  full_name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  linkedin: '',
  address: '',
  voice_note_transcript: '',
};

export function contactToForm(c: ContactRow): ContactFormValues {
  return {
    full_name: c.full_name,
    title: c.title ?? '',
    company: c.company ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    website: c.website ?? '',
    linkedin: c.linkedin ?? '',
    address: c.address ?? '',
    voice_note_transcript: c.voice_note_transcript ?? '',
  };
}

export function formToInsertPatch(form: ContactFormValues) {
  const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null);
  return {
    full_name: form.full_name.trim(),
    title: nullIfEmpty(form.title),
    company: nullIfEmpty(form.company),
    email: nullIfEmpty(form.email),
    phone: nullIfEmpty(form.phone),
    website: nullIfEmpty(form.website),
    linkedin: nullIfEmpty(form.linkedin),
    address: nullIfEmpty(form.address),
    voice_note_transcript: nullIfEmpty(form.voice_note_transcript),
  };
}

export function useContactForm(initial: ContactFormValues = emptyContactForm) {
  const [form, setForm] = useState<ContactFormValues>(initial);
  const set = <K extends keyof ContactFormValues>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  return { form, setForm, set };
}

interface FieldsProps {
  form: ContactFormValues;
  set: ReturnType<typeof useContactForm>['set'];
}

export function ContactFormFields({ form, set }: FieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Full name</Label>
        <Input id="c-name" value={form.full_name} onChange={set('full_name')} placeholder="Marcus Chen" autoFocus maxLength={200} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" value={form.title} onChange={set('title')} placeholder="Head of Platform" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-company">Company</Label>
          <Input id="c-company" value={form.company} onChange={set('company')} placeholder="Plaid" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="marcus@plaid.com" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-phone">Phone</Label>
        <Input id="c-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+1 (415) 555-0000" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-website">Website</Label>
          <Input id="c-website" value={form.website} onChange={set('website')} placeholder="plaid.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-linkedin">LinkedIn</Label>
          <Input id="c-linkedin" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-address">Address</Label>
        <Input id="c-address" value={form.address} onChange={set('address')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-voice">Voice note / context</Label>
        <Textarea
          id="c-voice"
          value={form.voice_note_transcript}
          onChange={set('voice_note_transcript')}
          rows={3}
          placeholder="Talked about their Series A, interested in AI infrastructure."
        />
      </div>
    </div>
  );
}
