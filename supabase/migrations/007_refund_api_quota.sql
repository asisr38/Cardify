-- 007 — Best-effort quota refund for failed upstream OCR / LLM / Whisper calls.
--
-- Some failures happen after we have to reserve quota to avoid concurrent
-- overrun. This function lets the server routes credit one unit back when the
-- upstream provider fails before a usable result is returned.

create or replace function public.refund_api_quota(
  p_user_id uuid,
  p_endpoint text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count int;
begin
  update public.api_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user_id
    and day = v_day
    and endpoint = p_endpoint
  returning count into v_count;

  return jsonb_build_object('count', coalesce(v_count, 0));
end;
$$;

revoke all on function public.refund_api_quota(uuid, text) from public;
grant execute on function public.refund_api_quota(uuid, text) to service_role;

notify pgrst, 'reload schema';
