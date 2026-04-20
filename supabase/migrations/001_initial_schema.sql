-- CardVault — initial schema, RLS, triggers, and default-template seeding.
-- Idempotent: safe to re-run.

-- ─────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'follow_up_status') then
    create type public.follow_up_status as enum ('pending', 'sent', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'interaction_type') then
    create type public.interaction_type as enum ('email_sent', 'note', 'call', 'meeting');
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- updated_at helper
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- events
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  date date not null,
  location text check (location is null or char_length(location) <= 160),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_user_date_idx on public.events (user_id, date desc);

-- Exactly one active event per user (null-safe — only applies when is_active is true).
create unique index if not exists events_one_active_per_user
  on public.events (user_id) where is_active = true;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- contacts
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 200),
  title text,
  company text,
  email text,
  phone text,
  website text,
  linkedin text,
  address text,
  voice_note_url text,
  voice_note_transcript text,
  front_image_url text,
  back_image_url text,
  follow_up_status public.follow_up_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_event_idx
  on public.contacts (user_id, event_id, created_at desc);

create index if not exists contacts_user_created_idx
  on public.contacts (user_id, created_at desc);

-- Enforce that a contact's event_id (when set) belongs to the same user.
-- FK constraints don't respect RLS, so we need an explicit trigger.
create or replace function public.enforce_contact_event_owner() returns trigger
language plpgsql
as $$
begin
  if new.event_id is not null then
    if not exists (
      select 1 from public.events where id = new.event_id and user_id = new.user_id
    ) then
      raise exception 'event % does not belong to user %', new.event_id, new.user_id
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_event_owner_check on public.contacts;
create trigger contacts_event_owner_check
  before insert or update of event_id, user_id on public.contacts
  for each row execute procedure public.enforce_contact_event_owner();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- interactions
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.interaction_type not null,
  subject text,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interactions_contact_time_idx
  on public.interactions (contact_id, created_at desc);

create or replace function public.enforce_interaction_contact_owner() returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.contacts where id = new.contact_id and user_id = new.user_id
  ) then
    raise exception 'contact % does not belong to user %', new.contact_id, new.user_id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists interactions_contact_owner_check on public.interactions;
create trigger interactions_contact_owner_check
  before insert or update of contact_id, user_id on public.interactions
  for each row execute procedure public.enforce_interaction_contact_owner();

-- ─────────────────────────────────────────────────────────────────────
-- email_templates
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_templates_one_default_per_user
  on public.email_templates (user_id) where is_default = true;

drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- event_stats — per-event contact + follow-up counts (RLS inherits via
-- security_invoker so the querying user's policies apply to the underlying
-- tables).
-- ─────────────────────────────────────────────────────────────────────
create or replace view public.event_stats
  with (security_invoker = on)
as
select
  e.id              as event_id,
  e.user_id         as user_id,
  count(c.id)                                                     as contact_count,
  count(c.id) filter (where c.follow_up_status = 'sent')          as sent_count,
  count(c.id) filter (where c.follow_up_status = 'pending')       as pending_count,
  count(c.id) filter (where c.follow_up_status = 'skipped')       as skipped_count
from public.events e
left join public.contacts c on c.event_id = e.id
group by e.id, e.user_id;

-- ─────────────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────────────
alter table public.events          enable row level security;
alter table public.contacts        enable row level security;
alter table public.interactions    enable row level security;
alter table public.email_templates enable row level security;

-- Events: full self-service
drop policy if exists "events self-service" on public.events;
create policy "events self-service" on public.events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Contacts: full self-service
drop policy if exists "contacts self-service" on public.contacts;
create policy "contacts self-service" on public.contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Interactions: full self-service
drop policy if exists "interactions self-service" on public.interactions;
create policy "interactions self-service" on public.interactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Email templates: full self-service
drop policy if exists "templates self-service" on public.email_templates;
create policy "templates self-service" on public.email_templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- New-user onboarding: seed 3 default email templates.
-- Uses SECURITY DEFINER so the trigger can insert into the user's scope
-- during the auth signup transaction before their session exists.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.email_templates (user_id, name, subject, body, is_default)
  values
    (
      new.id,
      'Nice to meet you',
      'Great meeting you at {event}',
      'Hi {first_name},' || E'\n\n' ||
      'Really enjoyed our chat at {event}. {voice_note_snippet}' || E'\n\n' ||
      'Would love to keep the conversation going — happy to grab 20 minutes whenever works for you.' || E'\n\n' ||
      'Talk soon,',
      true
    ),
    (
      new.id,
      'Quick intro request',
      'Quick intro — following up from {event}',
      'Hi {first_name},' || E'\n\n' ||
      'It was great meeting you at {event}. I''ve been thinking about what you mentioned re: {company} and had an idea I wanted to run by you.' || E'\n\n' ||
      'Open to a 15 minute call next week? Promise to keep it tight.' || E'\n\n' ||
      'Best,',
      false
    ),
    (
      new.id,
      'Follow-up on our chat',
      'Following up — {event}',
      'Hi {first_name},' || E'\n\n' ||
      'Circling back on our conversation at {event}. {voice_note_snippet}' || E'\n\n' ||
      'Curious whether this is still top of mind for you and the team at {company}. Happy to share what we''ve been exploring on our end.' || E'\n\n' ||
      'Best,',
      false
    );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- GRANTs — Supabase's authenticated role needs access to the view.
-- ─────────────────────────────────────────────────────────────────────
grant select on public.event_stats to authenticated;
