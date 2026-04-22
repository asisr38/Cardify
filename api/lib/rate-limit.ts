import type { SupabaseClient } from '@supabase/supabase-js';

type QuotaRpcRow = {
  allowed?: boolean;
  count?: number;
  error?: string;
};

export const consumeQuota = async (
  admin: SupabaseClient,
  userId: string,
  endpoint: 'ocr' | 'structure' | 'transcribe',
  cap: number,
): Promise<{ allowed: boolean; count: number }> => {
  const { data, error } = await admin.rpc('try_consume_api_quota', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_cap: cap,
  });

  if (error) {
    throw error;
  }

  const row = data as QuotaRpcRow | null;
  if (!row || typeof row.allowed !== 'boolean' || typeof row.count !== 'number') {
    throw new Error('Invalid try_consume_api_quota response');
  }

  if (row.error === 'invalid_cap') {
    throw new Error('Invalid rate-limit cap configuration');
  }

  return { allowed: row.allowed, count: row.count };
};

export const refundQuota = async (
  admin: SupabaseClient,
  userId: string,
  endpoint: 'ocr' | 'structure' | 'transcribe',
): Promise<void> => {
  const { error } = await admin.rpc('refund_api_quota', {
    p_user_id: userId,
    p_endpoint: endpoint,
  });

  if (error) {
    throw error;
  }
};
