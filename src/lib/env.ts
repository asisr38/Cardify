const required = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing ${key}. Copy .env.example to .env and fill in your Supabase project credentials.`,
    );
  }
  return value;
};

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
};
