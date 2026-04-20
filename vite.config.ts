import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The Vercel → Supabase integration sets its own variable names
// (SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, …) which Vite wouldn't
// normally expose to the browser — only VITE_* is auto-exposed. We bridge
// the gap here by reading whichever variant exists and injecting it as
// `import.meta.env.VITE_*` at build time, so the app code stays simple.
//
// Priority (first hit wins):
//   VITE_SUPABASE_URL → SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY → SUPABASE_ANON_KEY
//   VITE_SITE_URL → (falls back to window.location.origin at runtime)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    '';
  const siteUrl = env.VITE_SITE_URL || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    },
    server: {
      host: true,
      port: 5173,
    },
  };
});
