import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exchangeGoogleCode, fetchGoogleUserEmail, getRequestOrigin, verifyOAuthState } from './_lib/google.js';
import { createSupabaseServiceClient } from './_lib/supabase-admin.js';
import { getSupabasePublicConfig } from './_lib/env.js';

function redirect(res: VercelResponse, location: string) {
  res.writeHead(302, { Location: location });
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const origin = getRequestOrigin(req);
  const toSettings = (status: string, message?: string, returnTo = '/settings') => {
    const url = new URL(returnTo, origin);
    url.searchParams.set('gmail', status);
    if (message) url.searchParams.set('message', message);
    redirect(res, url.toString());
  };

  try {
    const error = typeof req.query.error === 'string' ? req.query.error : null;
    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;

    if (error) {
      return toSettings('error', error);
    }
    if (!code || !state) {
      return toSettings('error', 'Missing Google callback parameters.');
    }

    const verified = verifyOAuthState(state);
    const tokens = await exchangeGoogleCode(req, code);
    if (!tokens.refresh_token) {
      return toSettings('error', 'Google did not return a refresh token. Try reconnecting.');
    }

    const googleEmail = await fetchGoogleUserEmail(tokens.access_token);
    const { url } = getSupabasePublicConfig();
    const admin = createSupabaseServiceClient(url);

    const { error: upsertError } = await admin.from('gmail_accounts').upsert({
      user_id: verified.userId,
      google_email: googleEmail,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope ?? '',
    });
    if (upsertError) throw upsertError;

    return toSettings('connected', undefined, verified.returnTo);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/gmail-callback]', err);
    return toSettings('error', err instanceof Error ? err.message : 'Unexpected error');
  }
}
