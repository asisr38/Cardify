import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { keys } from '../lib/query';
import { useAuth } from '../hooks/use-auth';
import type { InteractionInsert, InteractionRow } from '../types/database';

export function useInteractions(contactId: string | undefined) {
  return useQuery({
    queryKey: contactId ? keys.interactions.byContact(contactId) : ['interactions', 'none'],
    enabled: !!contactId,
    queryFn: async (): Promise<InteractionRow[]> => {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as InteractionRow[];
    },
  });
}

export function useCreateInteraction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<InteractionInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('interactions')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as InteractionRow;
    },
    onSuccess: (interaction) => {
      qc.invalidateQueries({ queryKey: keys.interactions.byContact(interaction.contact_id) });
    },
  });
}
