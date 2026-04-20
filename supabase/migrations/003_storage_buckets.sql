-- 003 — Storage buckets for card scans and voice notes.
--
-- Buckets are private; reads require a signed URL or the service role.
-- RLS on storage.objects scopes each user to their own prefix
-- ({user_id}/...), matching how we namespace uploads from the client.

-- ─────────────────────────────────────────────────────────────────────
-- Buckets
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('card-scans',  'card-scans',  false, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('voice-notes', 'voice-notes', false, 10485760, array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────
-- RLS policies — users own everything under {user_id}/...
-- storage.foldername(name) returns the path components as a text[].
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists "card-scans owner rw" on storage.objects;
create policy "card-scans owner rw" on storage.objects
  for all
  using (
    bucket_id = 'card-scans'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'card-scans'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice-notes owner rw" on storage.objects;
create policy "voice-notes owner rw" on storage.objects
  for all
  using (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
