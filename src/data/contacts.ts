import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { keys } from '../lib/query';
import { useAuth } from '../hooks/use-auth';
import type {
  ContactInsert,
  ContactRow,
  ContactUpdate,
  FollowUpStatus,
} from '../types/database';

export function useContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.contacts.list(),
    enabled: !!user,
    queryFn: async (): Promise<ContactRow[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });
}

export function useContactsForEvent(eventId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: eventId ? keys.contacts.byEvent(eventId) : ['contacts', 'byEvent', 'none'],
    enabled: !!user && !!eventId,
    queryFn: async (): Promise<ContactRow[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });
}

export function useContact(contactId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: contactId ? keys.contacts.detail(contactId) : ['contacts', 'detail', 'none'],
    enabled: !!user && !!contactId,
    queryFn: async (): Promise<ContactRow | null> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ContactRow | null;
    },
  });
}

export function useCreateContact() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<ContactInsert, 'user_id'>,
    ): Promise<ContactRow> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: (contact) => {
      qc.invalidateQueries({ queryKey: keys.contacts.all });
      qc.invalidateQueries({ queryKey: keys.events.all });
      if (contact.event_id) {
        qc.invalidateQueries({ queryKey: keys.contacts.byEvent(contact.event_id) });
      }
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ContactUpdate }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: (contact) => {
      qc.invalidateQueries({ queryKey: keys.contacts.all });
      qc.invalidateQueries({ queryKey: keys.contacts.detail(contact.id) });
      qc.invalidateQueries({ queryKey: keys.events.all });
      if (contact.event_id) {
        qc.invalidateQueries({ queryKey: keys.contacts.byEvent(contact.event_id) });
      }
    },
  });
}

export function useSetFollowUpStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FollowUpStatus }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({ follow_up_status: status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ContactRow;
    },
    onSuccess: (contact) => {
      qc.invalidateQueries({ queryKey: keys.contacts.all });
      qc.invalidateQueries({ queryKey: keys.contacts.detail(contact.id) });
      qc.invalidateQueries({ queryKey: keys.events.all });
      if (contact.event_id) {
        qc.invalidateQueries({ queryKey: keys.contacts.byEvent(contact.event_id) });
      }
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: ContactRow) => {
      const { error } = await supabase.from('contacts').delete().eq('id', contact.id);
      if (error) throw error;
      return contact;
    },
    onSuccess: (contact) => {
      qc.invalidateQueries({ queryKey: keys.contacts.all });
      qc.invalidateQueries({ queryKey: keys.events.all });
      if (contact.event_id) {
        qc.invalidateQueries({ queryKey: keys.contacts.byEvent(contact.event_id) });
      }
    },
  });
}
