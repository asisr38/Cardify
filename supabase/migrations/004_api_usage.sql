-- 004 — Per-user, per-day API usage counters for rate limiting.
--
-- Only the service role writes/reads this table (from Vercel serverless
-- routes), so RLS is enabled but no client-facing policies are needed.

create table if not exists public.api_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default current_date,
  endpoint text not null check (char_length(endpoint) between 1 and 40),
  count    int  not null default 0,
  primary key (user_id, day, endpoint)
);

alter table public.api_usage enable row level security;
-- No policies → only the service role (bypasses RLS) can touch this.

create index if not exists api_usage_day_idx on public.api_usage (day);
