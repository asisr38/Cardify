import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { keys } from '../lib/query';
import { useAuth } from '../hooks/use-auth';
import type { GmailAccountStatusRow } from '../types/database';

export function useGmailConnection() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.gmail.status(),
    enabled: !!user,
    queryFn: async (): Promise<GmailAccountStatusRow | null> => {
      const { data, error } = await supabase.from('gmail_account_status').select('*').maybeSingle();
      if (error) throw error;
      return (data ?? null) as GmailAccountStatusRow | null;
    },
  });
}

export function useStartGmailConnect() {
  return useMutation<{ authUrl: string }, Error, string>({
    mutationFn: (returnTo = '/settings') => api.gmailConnect(returnTo),
  });
}

export function useDisconnectGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.gmailDisconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.gmail.all });
    },
  });
}

export function useSendGmailMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { contactId: string; subject: string; body: string }) =>
      api.gmailSend(input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.gmail.all });
      qc.invalidateQueries({ queryKey: keys.contacts.detail(vars.contactId) });
      qc.invalidateQueries({ queryKey: keys.contacts.all });
      qc.invalidateQueries({ queryKey: keys.interactions.byContact(vars.contactId) });
      qc.invalidateQueries({ queryKey: keys.events.all });
    },
  });
}
