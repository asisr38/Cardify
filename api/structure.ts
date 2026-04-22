import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getBearerToken, getUserFromJwt } from './lib/auth.js';
import { applyCors, handleOptions } from './lib/cors.js';
import { readIntEnv, requireEnv, getSupabasePublicConfig } from './lib/env.js';
import { readJsonBody, requireMethod, sendError, sendJson } from './lib/http.js';
import { consumeQuota, refundQuota } from './lib/rate-limit.js';
import { createSupabaseServiceClient } from './lib/supabase-admin.js';

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You extract contact details from OCR'd business card text.

Return ONLY a single JSON object, no prose. Shape:
{
  "full_name": string,
  "title": string | null,
  "company": string | null,
  "email": string | null,
  "phone": string | null,
  "website": string | null,
  "linkedin": string | null,
  "address": string | null
}

Rules:
- Never invent data. If a field isn't clearly present, return null.
- Full name is required — if you truly can't find one, use an empty string "".
- Strip label prefixes like "email:" or "tel:". Return just the value.
- Normalize phone to international format when country is obvious; otherwise leave as-is.
- For LinkedIn, return the URL or the handle as written — don't fabricate.
- Output valid JSON. No markdown, no code fences, no explanations.`;

interface StructuredContact {
  full_name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  address: string | null;
}

interface StructureBody {
  text?: string;
  front_text?: string;
  back_text?: string;
}

function buildOcrPrompt(body: StructureBody): string {
  const front = body.front_text?.trim() ?? '';
  const back = body.back_text?.trim() ?? '';
  const single = body.text?.trim() ?? '';

  if (front || back) {
    const sections = [];
    if (front) sections.push(`Front OCR:\n${front}`);
    if (back) sections.push(`Back OCR:\n${back}`);
    return sections.join('\n\n');
  }

  return single;
}

function parseJsonLoose(raw: string): StructuredContact {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model returned no JSON object');
  const parsed = JSON.parse(trimmed.slice(start, end + 1));
  return {
    full_name: typeof parsed.full_name === 'string' ? parsed.full_name : '',
    title: parsed.title ?? null,
    company: parsed.company ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    website: parsed.website ?? null,
    linkedin: parsed.linkedin ?? null,
    address: parsed.address ?? null,
  };
}

// POST /api/structure  { text } → StructuredContact
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

    const body = readJsonBody<StructureBody>(req);
    const text = buildOcrPrompt(body);
    if (!text) return sendError(res, 400, 'front_text, back_text, or text is required');
    if (text.length > 8000) return sendError(res, 400, 'text too long');

    const admin = createSupabaseServiceClient(url);
    const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
    const cap = readIntEnv('STRUCTURE_DAILY_LIMIT', 100);
    const quota = await consumeQuota(admin, user.id, 'structure', cap);
    if (!quota.allowed) {
      return sendError(res, 429, `Daily structure limit reached (${cap}). Try again tomorrow.`, 'rate_limited');
    }
    quotaConsumed = true;
    quotaUserId = user.id;

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `OCR text:\n${text}` }],
    });

    const block = msg.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Model returned no text');

    applyCors(res);
    return sendJson(res, 200, parseJsonLoose(block.text));
  } catch (err) {
    if (quotaConsumed && quotaUserId) {
      try {
        const { url } = getSupabasePublicConfig();
        const admin = createSupabaseServiceClient(url);
        await refundQuota(admin, quotaUserId, 'structure');
      } catch {
        // Best-effort refund only.
      }
    }
    // eslint-disable-next-line no-console
    console.error('[api/structure]', err);
    return sendError(res, 500, err instanceof Error ? err.message : 'Unexpected error');
  }
}
