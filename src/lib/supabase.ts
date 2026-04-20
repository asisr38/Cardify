import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Implicit flow is the right choice for a Vite SPA with email
    // magic links: the token comes back in the URL hash and doesn't
    // need a locally-stored PKCE verifier — so opening the link in a
    // different tab/browser/device still works.
    flowType: 'implicit',
  },
});
