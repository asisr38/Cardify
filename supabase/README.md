# Supabase setup

## Apply the migration

The easiest path for MVP: open your Supabase project → **SQL Editor** → **New query**, paste the contents of `migrations/001_initial_schema.sql`, and hit **Run**.

(Later, once you're ready to track migrations properly, switch to the Supabase CLI: `supabase link`, `supabase db push`.)

## What the migration does

- Creates four tables: `events`, `contacts`, `interactions`, `email_templates`
- Creates a `event_stats` view for fast per-event contact/follow-up counts
- Enables Row-Level Security so every row is scoped to `auth.uid()`
- Enforces cross-table ownership (a contact's `event_id` must belong to the same user) via trigger
- Ensures at most **one active event per user** and at most **one default template per user** via partial unique indexes
- Seeds three starter email templates whenever a new user signs up (`handle_new_user` trigger on `auth.users`)
- Adds `updated_at` auto-maintenance triggers

## Verifying it worked

After running the migration, in SQL editor:

```sql
-- should list the four tables + event_stats view
select table_schema, table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- should show RLS enabled on all four tables
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in ('events','contacts','interactions','email_templates');
```

Sign in via the app once, then check `public.email_templates` — you should see 3 rows for your user.
