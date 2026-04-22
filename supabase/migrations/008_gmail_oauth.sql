-- 008 — Gmail OAuth storage and safe client-visible connection status.

create table if not exists public.gmail_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text not null check (char_length(google_email) between 3 and 320),
  refresh_token text not null check (char_length(refresh_token) between 20 and 4096),
  scope text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gmail_accounts enable row level security;
-- No policies: only service_role should access refresh tokens.

drop trigger if exists gmail_accounts_set_updated_at on public.gmail_accounts;
create trigger gmail_accounts_set_updated_at
  before update on public.gmail_accounts
  for each row execute procedure public.set_updated_at();

drop view if exists public.gmail_account_status;

create view public.gmail_account_status as
select
  ga.user_id,
  ga.google_email,
  ga.scope,
  ga.updated_at as connected_at,
  coalesce((
    select au.count
    from public.api_usage au
    where au.user_id = ga.user_id
      and au.day = (timezone('utc', now()))::date
      and au.endpoint = 'gmail_send'
  ), 0)::int as sent_today
from public.gmail_accounts ga
where ga.user_id = auth.uid();

grant select on public.gmail_account_status to authenticated;

notify pgrst, 'reload schema';
