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
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${jwt}`,
    },
  });

  if (!res.ok) {
    return {
      user: null as null | { id: string; email?: string },
      error: new Error(`Auth user lookup failed (${res.status})`),
    };
  }

  const user = (await res.json()) as { id?: string; email?: string } | null;
  if (!user?.id) {
    return {
      user: null as null | { id: string; email?: string },
      error: new Error('Auth user lookup returned no user'),
    };
  }

  return { user: { id: user.id, email: user.email }, error: null };
};
