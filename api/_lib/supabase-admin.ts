import { createClient } from '@supabase/supabase-js';
import { requireEnv } from './env.js';

export const createSupabaseServiceClient = (supabaseUrl: string) => {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
