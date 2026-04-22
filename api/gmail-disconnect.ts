import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getUserFromJwt } from './_lib/auth.js';
import { handleOptions } from './_lib/cors.js';
import { getSupabasePublicConfig } from './_lib/env.js';
import { requireMethod, sendError, sendJson } from './_lib/http.js';
import { revokeGoogleToken } from './_lib/google.js';
import { createSupabaseServiceClient } from './_lib/supabase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return void handleOptions(res);
  if (!requireMethod(req, res, 'POST')) return;

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const token = getBearerToken(req.headers.authorization);
    if (!token) return sendError(res, 401, 'Missing bearer token');

    const { user } = await getUserFromJwt(url, anonKey, token);
    if (!user) return sendError(res, 401, 'Invalid session');

    const admin = createSupabaseServiceClient(url);
    const { data: account, error: fetchError } = await admin
      .from('gmail_accounts')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (account?.refresh_token) {
      void revokeGoogleToken(account.refresh_token).catch(() => {
        /* best effort */
      });
    }

    const { error: deleteError } = await admin.from('gmail_accounts').delete().eq('user_id', user.id);
    if (deleteError) throw deleteError;

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/gmail-disconnect]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
