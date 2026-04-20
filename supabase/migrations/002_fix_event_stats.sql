-- 002 — Make `event_stats` portable across Postgres 14 and 15+.
--
-- The initial migration used `with (security_invoker = on)`, a PG15-only
-- view option. On older Supabase projects that statement fails silently
-- and the view is never created, yielding a PGRST205
-- "table not in schema cache" error at runtime.
--
-- Fix: drop the view and recreate it with an explicit auth.uid() filter
-- in the body. The ownership trigger on contacts.event_id already
-- guarantees that any joined contact belongs to the same user as the
-- event, so one WHERE clause scopes the whole result.

drop view if exists public.event_stats;

create view public.event_stats as
select
  e.id        as event_id,
  e.user_id   as user_id,
  count(c.id)                                                   as contact_count,
  count(c.id) filter (where c.follow_up_status = 'sent')        as sent_count,
  count(c.id) filter (where c.follow_up_status = 'pending')     as pending_count,
  count(c.id) filter (where c.follow_up_status = 'skipped')     as skipped_count
from public.events e
left join public.contacts c on c.event_id = e.id
where e.user_id = auth.uid()
group by e.id, e.user_id;

grant select on public.event_stats to authenticated;

-- Force PostgREST to refresh its schema cache immediately so the view
-- becomes visible through the REST API.
notify pgrst, 'reload schema';
