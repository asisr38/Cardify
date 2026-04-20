import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { keys } from '../lib/query';
import { useAuth } from '../hooks/use-auth';
import type {
  EmailTemplateInsert,
  EmailTemplateRow,
  EmailTemplateUpdate,
} from '../types/database';

export function useTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.templates.list(),
    enabled: !!user,
    queryFn: async (): Promise<EmailTemplateRow[]> => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmailTemplateRow[];
    },
  });
}

export function useCreateTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<EmailTemplateInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('email_templates')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplateRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates.all });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: EmailTemplateUpdate }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplateRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates.all });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates.all });
    },
  });
}
