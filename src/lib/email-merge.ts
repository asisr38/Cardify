export interface EmailMergeContact {
  full_name: string;
  company: string | null;
  voice_note_transcript: string | null;
}

export interface EmailMergeInput {
  subject: string;
  body: string;
  contact: EmailMergeContact;
  eventName?: string | null;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

function voiceSnippet(value: string | null) {
  if (!value?.trim()) return 'your goals';
  const collapsed = value.trim().replace(/\s+/g, ' ');
  return collapsed.length > 90 ? `${collapsed.slice(0, 89).trimEnd()}…` : collapsed;
}

export function renderEmailTemplate(input: EmailMergeInput): RenderedEmail {
  const replacements: Record<string, string> = {
    first_name: firstName(input.contact.full_name) || 'there',
    company: input.contact.company?.trim() || 'your team',
    event: input.eventName?.trim() || 'our recent meeting',
    voice_note_snippet: voiceSnippet(input.contact.voice_note_transcript),
  };

  const replace = (value: string) =>
    value.replace(/\{(first_name|company|event|voice_note_snippet)\}/g, (_, key) => {
      return replacements[key] ?? '';
    });

  return {
    subject: replace(input.subject),
    body: replace(input.body),
  };
}
