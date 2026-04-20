// Client-side env. vite.config.ts injects these from any of the
// accepted variable-name variants (VITE_*, SUPABASE_*, NEXT_PUBLIC_*),
// so all we need to do here is read what was inlined.

function required(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing ${key}. Set SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or the VITE_* equivalents) in .env and rebuild.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
};
