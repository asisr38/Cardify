import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getUserFromJwt } from './_lib/auth.js';
import { handleOptions } from './_lib/cors.js';
import { getSupabasePublicConfig } from './_lib/env.js';
import { readJsonBody, requireMethod, sendError, sendJson } from './_lib/http.js';
import { buildGoogleConsentUrl, createOAuthState } from './_lib/google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return void handleOptions(res);
  if (!requireMethod(req, res, 'POST')) return;

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const token = getBearerToken(req.headers.authorization);
    if (!token) return sendError(res, 401, 'Missing bearer token');

    const { user } = await getUserFromJwt(url, anonKey, token);
    if (!user) return sendError(res, 401, 'Invalid session');

    const { returnTo } = readJsonBody<{ returnTo?: string }>(req);
    const state = createOAuthState(user.id, returnTo ?? '/settings');
    const authUrl = buildGoogleConsentUrl(req, state, user.email);
    return sendJson(res, 200, { authUrl });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/gmail-connect]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
