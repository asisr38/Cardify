import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getUserFromJwt } from './lib/auth.js';
import { handleOptions } from './lib/cors.js';
import { getSupabasePublicConfig, readIntEnv } from './lib/env.js';
import { encodeMimeMessage, refreshGoogleAccessToken } from './lib/google.js';
import { readJsonBody, requireMethod, sendError, sendJson } from './lib/http.js';
import { consumeQuota, refundQuota, type ApiQuotaEndpoint } from './lib/rate-limit.js';
import { createSupabaseServiceClient } from './lib/supabase-admin.js';
import { renderEmailTemplate } from '../src/lib/email-merge.js';

interface SendBody {
  contactId?: string;
  subject?: string;
  body?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return void handleOptions(res);
  if (!requireMethod(req, res, 'POST')) return;

  let quotaConsumed = false;
  let quotaUserId: string | null = null;
  const endpoint: ApiQuotaEndpoint = 'gmail_send';

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const token = getBearerToken(req.headers.authorization);
    if (!token) return sendError(res, 401, 'Missing bearer token');

    const { user } = await getUserFromJwt(url, anonKey, token);
    if (!user) return sendError(res, 401, 'Invalid session');

    const { contactId, subject, body } = readJsonBody<SendBody>(req);
    if (!contactId || !subject?.trim() || !body?.trim()) {
      return sendError(res, 400, 'contactId, subject, and body are required');
    }

    const admin = createSupabaseServiceClient(url);
    const [{ data: contact, error: contactError }, { data: account, error: accountError }] =
      await Promise.all([
        admin
          .from('contacts')
          .select('id, user_id, event_id, email, full_name, company, voice_note_transcript')
          .eq('id', contactId)
          .eq('user_id', user.id)
          .maybeSingle(),
        admin
          .from('gmail_accounts')
          .select('google_email, refresh_token')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

    if (contactError) throw contactError;
    if (accountError) throw accountError;
    if (!contact) return sendError(res, 404, 'Contact not found');
    if (!contact.email) return sendError(res, 400, 'Contact has no email address');
    if (!account?.refresh_token) return sendError(res, 400, 'Connect Gmail before sending');

    let eventName: string | null = null;
    if (contact.event_id) {
      const { data: event, error: eventError } = await admin
        .from('events')
        .select('name')
        .eq('id', contact.event_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (eventError) throw eventError;
      eventName = event?.name ?? null;
    }

    const rendered = renderEmailTemplate({
      subject,
      body,
      contact: {
        full_name: contact.full_name,
        company: contact.company,
        voice_note_transcript: contact.voice_note_transcript,
      },
      eventName,
    });

    const cap = readIntEnv('EMAIL_DAILY_LIMIT', 50);
    const quota = await consumeQuota(admin, user.id, endpoint, cap);
    if (!quota.allowed) {
      return sendError(res, 429, `Daily email limit reached (${cap}). Try again tomorrow.`, 'rate_limited');
    }
    quotaConsumed = true;
    quotaUserId = user.id;

    let accessToken: string;
    try {
      accessToken = await refreshGoogleAccessToken(account.refresh_token);
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === 'invalid_grant') {
        await admin.from('gmail_accounts').delete().eq('user_id', user.id);
        await refundQuota(admin, user.id, endpoint);
        quotaConsumed = false;
        return sendError(res, 401, 'Gmail connection expired. Reconnect your account.', 'gmail_reconnect_required');
      }
      throw err;
    }

    const raw = encodeMimeMessage({
      to: contact.email,
      subject: rendered.subject,
      body: rendered.body,
    });

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    const gmailJson = (await gmailRes.json()) as { id?: string; error?: { message?: string } };
    if (!gmailRes.ok || !gmailJson.id) {
      throw new Error(gmailJson.error?.message || 'Gmail API send failed');
    }

    const [{ error: interactionError }, { error: updateError }] = await Promise.all([
      admin.from('interactions').insert({
        contact_id: contact.id,
        user_id: user.id,
        type: 'email_sent',
        subject: rendered.subject,
        body: rendered.body,
        metadata: {
          gmail_message_id: gmailJson.id,
          gmail_account_email: account.google_email,
          provider: 'gmail_api',
        },
      }),
      admin.from('contacts').update({ follow_up_status: 'sent' }).eq('id', contact.id).eq('user_id', user.id),
    ]);

    if (interactionError) throw interactionError;
    if (updateError) throw updateError;

    return sendJson(res, 200, {
      messageId: gmailJson.id,
      renderedSubject: rendered.subject,
      renderedBody: rendered.body,
      sentToday: quota.count,
    });
  } catch (err) {
    if (quotaConsumed && quotaUserId) {
      try {
        const { url } = getSupabasePublicConfig();
        const admin = createSupabaseServiceClient(url);
        await refundQuota(admin, quotaUserId, endpoint);
      } catch {
        /* best effort */
      }
    }
    // eslint-disable-next-line no-console
    console.error('[api/gmail-send]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
