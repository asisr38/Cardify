export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

export const readIntEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  return n;
};

export const getSupabasePublicConfig = () => {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_* fallbacks for local parity).',
    );
  }
  return { url, anonKey };
};

export const getQuotaCaps = () => ({
  ocr: readIntEnv('API_USAGE_DAILY_CAP_OCR', 40),
  structure: readIntEnv('API_USAGE_DAILY_CAP_STRUCTURE', 120),
  transcribe: readIntEnv('API_USAGE_DAILY_CAP_TRANSCRIBE', 60),
});
