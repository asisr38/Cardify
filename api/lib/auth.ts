import { createClient } from '@supabase/supabase-js';

export const getBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization) {
    return null;
  }
  const [kind, token] = authorization.split(' ');
  if (!kind || kind.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim() || null;
};

export const getUserFromJwt = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  jwt: string,
) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data.user) {
    return { user: null as null | { id: string; email?: string }, error };
  }
  return { user: data.user, error: null };
};
