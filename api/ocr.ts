import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBearerToken, getUserFromJwt } from './lib/auth.js';
import { applyCors, handleOptions } from './lib/cors.js';
import { readIntEnv, requireEnv, getSupabasePublicConfig } from './lib/env.js';
import { readJsonBody, requireMethod, sendError, sendJson } from './lib/http.js';
import { consumeQuota, refundQuota } from './lib/rate-limit.js';
import { createSupabaseServiceClient } from './lib/supabase-admin.js';

const BUCKET = 'card-scans';

// POST /api/ocr  { path: "<user_id>/<scan_id>/front.jpg" } → { text }
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
    if (dlErr || !blob) return sendError(res, 400, `Could not read scan: ${dlErr?.message ?? 'not found'}`);

    const bytes = Buffer.from(await blob.arrayBuffer());
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return sendError(res, 413, 'Scan exceeds 5MB limit');
    }
    const base64 = bytes.toString('base64');

    const apiKey = requireEnv('GOOGLE_VISION_API_KEY');
    const cap = readIntEnv('OCR_DAILY_LIMIT', 100);
    const quota = await consumeQuota(admin, user.id, 'ocr', cap);
    if (!quota.allowed) {
      return sendError(res, 429, `Daily OCR limit reached (${cap}). Try again tomorrow.`, 'rate_limited');
    }
    quotaConsumed = true;
    quotaUserId = user.id;

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      },
    );
    if (!visionRes.ok) {
      const body = await visionRes.text();
      throw new Error(`Vision API ${visionRes.status}: ${body.slice(0, 400)}`);
    }
    const payload = (await visionRes.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        error?: { message?: string };
      }>;
    };
    const first = payload.responses?.[0];
    if (first?.error?.message) throw new Error(`Vision: ${first.error.message}`);

    applyCors(res);
    return sendJson(res, 200, { text: first?.fullTextAnnotation?.text ?? '' });
  } catch (err) {
    if (quotaConsumed && quotaUserId) {
      try {
        const { url } = getSupabasePublicConfig();
        const admin = createSupabaseServiceClient(url);
        await refundQuota(admin, quotaUserId, 'ocr');
      } catch {
        // Best-effort refund only.
      }
    }
    // eslint-disable-next-line no-console
    console.error('[api/ocr]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
