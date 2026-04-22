import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getBearerToken, getUserFromJwt } from './lib/auth.js';
import { applyCors, handleOptions } from './lib/cors.js';
import { readIntEnv, requireEnv, getSupabasePublicConfig } from './lib/env.js';
import { readJsonBody, requireMethod, sendError, sendJson } from './lib/http.js';
import { consumeQuota, refundQuota } from './lib/rate-limit.js';
import { createSupabaseServiceClient } from './lib/supabase-admin.js';

const BUCKET = 'voice-notes';
const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/transcribe  { path: "<user_id>/<voice_id>.webm" } → { transcript }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return void handleOptions(res);
  if (!requireMethod(req, res, 'POST')) return;

  let quotaConsumed = false;
  let quotaUserId: string | null = null;

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const token = getBearerToken(req.headers.authorization);
    if (!token) return sendError(res, 401, 'Missing bearer token');

    const { user } = await getUserFromJwt(url, anonKey, token);
    if (!user) return sendError(res, 401, 'Invalid session');

    const { path } = readJsonBody<{ path?: string }>(req);
    if (!path) return sendError(res, 400, 'path is required');
    if (path.split('/')[0] !== user.id)
      return sendError(res, 400, 'path does not belong to caller');

    const admin = createSupabaseServiceClient(url);
    const { data: blob, error: dlErr } = await admin.storage.from(BUCKET).download(path);
    if (dlErr || !blob) return sendError(res, 400, `Could not read voice note: ${dlErr?.message ?? 'not found'}`);
    if (blob.size > MAX_BYTES) return sendError(res, 413, 'Voice note exceeds 10MB limit');

    const filename = path.split('/').pop() ?? 'voice.webm';
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const file = new File([bytes], filename, { type: blob.type || 'audio/webm' });

    const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') });
    const cap = readIntEnv('TRANSCRIBE_DAILY_LIMIT', 50);
    const quota = await consumeQuota(admin, user.id, 'transcribe', cap);
    if (!quota.allowed) {
      return sendError(res, 429, `Daily transcribe limit reached (${cap}). Try again tomorrow.`, 'rate_limited');
    }
    quotaConsumed = true;
    quotaUserId = user.id;

    const result = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'text',
    });

    const transcript = typeof result === 'string' ? result : (result as { text?: string }).text ?? '';
    applyCors(res);
    return sendJson(res, 200, { transcript });
  } catch (err) {
    if (quotaConsumed && quotaUserId) {
      try {
        const { url } = getSupabasePublicConfig();
        const admin = createSupabaseServiceClient(url);
        await refundQuota(admin, quotaUserId, 'transcribe');
      } catch {
        // Best-effort refund only.
      }
    }
    // eslint-disable-next-line no-console
    console.error('[api/transcribe]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
