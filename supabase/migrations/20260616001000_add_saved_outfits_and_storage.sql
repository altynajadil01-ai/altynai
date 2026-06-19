create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  outfit_text text not null,
  form jsonb not null default '{}'::jsonb,
  photo_prompt text not null default '',
  created_at timestamptz not null default now()
);

alter table public.saved_outfits enable row level security;

create policy "read own saved outfits"
  on public.saved_outfits for select
  using (auth.uid() = user_id);

create policy "insert own saved outfits"
  on public.saved_outfits for insert
  with check (auth.uid() = user_id);

create policy "delete own saved outfits"
  on public.saved_outfits for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('wardrobe-photos', 'wardrobe-photos', false)
on conflict (id) do nothing;

create policy "read own wardrobe photos"
  on storage.objects for select
  using (
    bucket_id = 'wardrobe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "upload own wardrobe photos"
  on storage.objects for insert
  with check (
    bucket_id = 'wardrobe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "delete own wardrobe photos"
  on storage.objects for delete
  using (
    bucket_id = 'wardrobe-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
