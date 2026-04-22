-- 006 — Force `event_stats` to run with SECURITY INVOKER semantics.
--
-- Supabase (Postgres 15+) defaults views to SECURITY DEFINER behavior,
-- which means the view ignores the querying user's RLS policies and
-- runs with the view owner's permissions instead. The Supabase linter
-- flags this as a security issue (0010_security_definer_view).
--
-- Migration 002 dropped the `security_invoker = on` option to keep the
-- view portable across PG14/PG15. All Supabase projects are now PG15+
-- so we can safely re-enable the option. The auth.uid() WHERE clause
-- in the view body is kept as defense-in-depth.
--
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
-- Ref: https://www.postgresql.org/docs/15/sql-createview.html

drop view if exists public.event_stats;

create view public.event_stats
  with (security_invoker = on)
as
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

notify pgrst, 'reload schema';
