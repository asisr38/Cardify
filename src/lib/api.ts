import { supabase } from './supabase';
import type { ContactInsert } from '../types/database';

// Fetch helper that attaches the current Supabase access token. Routes
// under /api are served by Vercel in production and by `vercel dev`
// locally — plain `vite` won't execute them.
async function authedPost<T>(path: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error ?? text;
    } catch {
      /* not JSON */
    }
    const err = new Error(message || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export interface StructureRequest {
  text?: string;
  front_text?: string;
  back_text?: string;
}

export type StructuredContact = Pick<
  ContactInsert,
  'full_name' | 'title' | 'company' | 'email' | 'phone' | 'website' | 'linkedin' | 'address'
>;

export const api = {
  ocr: (path: string) => authedPost<{ text: string }>('/api/ocr', { path }),
  structure: (input: string | StructureRequest) =>
    authedPost<StructuredContact>(
      '/api/structure',
      typeof input === 'string' ? { text: input } : input,
    ),
  transcribe: (path: string) => authedPost<{ transcript: string }>('/api/transcribe', { path }),
  gmailConnect: (returnTo: string) => authedPost<{ authUrl: string }>('/api/gmail-connect', { returnTo }),
  gmailDisconnect: () => authedPost<{ ok: true }>('/api/gmail-disconnect', {}),
  gmailSend: (input: { contactId: string; subject: string; body: string }) =>
    authedPost<{
      messageId: string;
      renderedSubject: string;
      renderedBody: string;
      sentToday: number;
    }>('/api/gmail-send', input),
};
