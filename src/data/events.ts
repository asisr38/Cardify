import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { keys } from '../lib/query';
import { useAuth } from '../hooks/use-auth';
import type {
  EventInsert,
  EventRow,
  EventStatsRow,
  EventUpdate,
} from '../types/database';

export interface EventWithStats extends EventRow {
  contact_count: number;
  sent_count: number;
  pending_count: number;
  skipped_count: number;
}

async function fetchEventsWithStats(userId: string): Promise<EventWithStats[]> {
  const [eventsRes, statsRes] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabase.from('event_stats').select('*').eq('user_id', userId),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (statsRes.error) throw statsRes.error;

  const statsById = new Map<string, EventStatsRow>(
    (statsRes.data ?? []).map((row) => [row.event_id, row]),
  );

  return (eventsRes.data ?? []).map((event) => {
    const stats = statsById.get(event.id);
    return {
      ...(event as EventRow),
      contact_count: stats?.contact_count ?? 0,
      sent_count: stats?.sent_count ?? 0,
      pending_count: stats?.pending_count ?? 0,
      skipped_count: stats?.skipped_count ?? 0,
    };
  });
}

export function useEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.events.list(),
    enabled: !!user,
    queryFn: () => fetchEventsWithStats(user!.id),
  });
}

export function useEvent(eventId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: eventId ? keys.events.detail(eventId) : ['events', 'detail', 'none'],
    enabled: !!user && !!eventId,
    queryFn: async (): Promise<EventWithStats | null> => {
      if (!eventId) return null;
      const [eventRes, statsRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
        supabase.from('event_stats').select('*').eq('event_id', eventId).maybeSingle(),
      ]);
      if (eventRes.error) throw eventRes.error;
      if (statsRes.error) throw statsRes.error;
      if (!eventRes.data) return null;
      const stats = statsRes.data as EventStatsRow | null;
      return {
        ...(eventRes.data as EventRow),
        contact_count: stats?.contact_count ?? 0,
        sent_count: stats?.sent_count ?? 0,
        pending_count: stats?.pending_count ?? 0,
        skipped_count: stats?.skipped_count ?? 0,
      };
    },
  });
}

export function useCreateEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<EventInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      // If setting active, clear any existing active event first — the DB
      // enforces uniqueness via partial index, so doing this server-side would
      // race on insert. One round-trip to clear, then insert, is simplest.
      if (input.is_active) {
        const { error: clearErr } = await supabase
          .from('events')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
        if (clearErr) throw clearErr;
      }

      const { data, error } = await supabase
        .from('events')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as EventRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.events.all });
    },
  });
}

export function useUpdateEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: EventUpdate }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('events')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EventRow;
    },
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: keys.events.all });
      qc.invalidateQueries({ queryKey: keys.events.detail(event.id) });
    },
  });
}

export function useSetActiveEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');
      // Clear existing active, then set this one. Two statements, one
      // logical action — acceptable for a per-user cardinality of dozens.
      const { error: clearErr } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (clearErr) throw clearErr;

      const { error: setErr } = await supabase
        .from('events')
        .update({ is_active: true })
        .eq('id', eventId);
      if (setErr) throw setErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.events.all });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.events.all });
      qc.invalidateQueries({ queryKey: keys.contacts.all });
    },
  });
}
