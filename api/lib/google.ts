import crypto from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import { requireEnv } from './env.js';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GOOGLE_EMAIL_SCOPE = 'email';
const GOOGLE_OPENID_SCOPE = 'openid';
const STATE_TTL_MS = 15 * 60 * 1000;

interface OAuthStatePayload {
  userId: string;
  returnTo: string;
  issuedAt: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || requireEnv('GOOGLE_CLIENT_SECRET');
}

function sanitizeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith('/')) return '/settings';
  return value;
}

export function getRequestOrigin(req: VercelRequest): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https';
    return `${proto}://${host}`;
  }

  const siteUrl = process.env.VITE_SITE_URL;
  if (siteUrl) return siteUrl.replace(/\/$/, '');

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  throw new Error('Unable to determine request origin');
}

export function getGoogleRedirectUri(req: VercelRequest): string {
  return `${getRequestOrigin(req)}/api/gmail-callback`;
}

export function createOAuthState(userId: string, returnTo: string): string {
  const payload: OAuthStatePayload = {
    userId,
    returnTo: sanitizeReturnTo(returnTo),
    issuedAt: Date.now(),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getStateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload {
  const [encoded, sig] = state.split('.');
  if (!encoded || !sig) throw new Error('Invalid OAuth state');

  const expected = crypto.createHmac('sha256', getStateSecret()).update(encoded).digest('base64url');
  const sigBuffer = Buffer.from(sig, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid OAuth state');
  }

  const payload = JSON.parse(base64UrlDecode(encoded)) as OAuthStatePayload;
  if (!payload.userId || !payload.issuedAt) throw new Error('Invalid OAuth state');
  if (Date.now() - payload.issuedAt > STATE_TTL_MS) throw new Error('OAuth state expired');
  return { ...payload, returnTo: sanitizeReturnTo(payload.returnTo) };
}

export function buildGoogleConsentUrl(req: VercelRequest, state: string, loginHint?: string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', requireEnv('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', getGoogleRedirectUri(req));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('scope', [GOOGLE_OPENID_SCOPE, GOOGLE_EMAIL_SCOPE, GMAIL_SEND_SCOPE].join(' '));
  url.searchParams.set('state', state);
  if (loginHint) url.searchParams.set('login_hint', loginHint);
  return url.toString();
}

export async function exchangeGoogleCode(req: VercelRequest, code: string) {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: getGoogleRedirectUri(req),
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Could not exchange Google auth code');
  }

  return json;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    const reason = json.error_description || json.error || 'Could not refresh Google access token';
    const error = new Error(reason);
    (error as Error & { code?: string }).code = json.error;
    throw error;
  }

  return json.access_token;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const json = (await res.json()) as { email?: string; error?: string; error_description?: string };
  if (!res.ok || !json.email) {
    throw new Error(json.error_description || json.error || 'Could not read Google account email');
  }
  return json.email;
}

export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });
}

export function encodeMimeMessage(input: {
  to: string;
  subject: string;
  body: string;
}): string {
  const subjectHeader = /^[\x00-\x7F]*$/.test(input.subject)
    ? input.subject
    : `=?UTF-8?B?${Buffer.from(input.subject, 'utf8').toString('base64')}?=`;

  const message = [
    `To: ${input.to}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 8bit',
    `Subject: ${subjectHeader}`,
    '',
    input.body,
  ].join('\r\n');

  return Buffer.from(message, 'utf8').toString('base64url');
}
