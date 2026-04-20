-- 005 — Atomic per-day quota check + increment for Vercel API routes.
-- Callable only by service_role (see grants at bottom).

create or replace function public.try_consume_api_quota(
  p_user_id uuid,
  p_endpoint text,
  p_cap int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count int;
begin
  if p_cap < 1 then
    return jsonb_build_object('allowed', false, 'count', 0, 'error', 'invalid_cap');
  end if;

  insert into public.api_usage (user_id, day, endpoint, count)
  values (p_user_id, v_day, p_endpoint, 0)
  on conflict (user_id, day, endpoint) do nothing;

  select a.count into strict v_count
  from public.api_usage a
  where a.user_id = p_user_id
    and a.day = v_day
    and a.endpoint = p_endpoint
  for update;

  if v_count >= p_cap then
    return jsonb_build_object('allowed', false, 'count', v_count);
  end if;

  update public.api_usage u
  set count = u.count + 1
  where u.user_id = p_user_id
    and u.day = v_day
    and u.endpoint = p_endpoint
  returning u.count into v_count;

  return jsonb_build_object('allowed', true, 'count', v_count);
end;
$$;

revoke all on function public.try_consume_api_quota(uuid, text, int) from public;
grant execute on function public.try_consume_api_quota(uuid, text, int) to service_role;

notify pgrst, 'reload schema';
