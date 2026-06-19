create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  item_type text not null,
  color text not null,
  season text not null default 'всесезон',
  photo_path text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.wardrobe_items enable row level security;

create policy "read own wardrobe items"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

create policy "insert own wardrobe items"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "update own wardrobe items"
  on public.wardrobe_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own wardrobe items"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);

alter table public.saved_outfits
  add column if not exists is_favorite boolean not null default false,
  add column if not exists season text not null default '',
  add column if not exists mood text not null default '',
  add column if not exists wardrobe_color text not null default '',
  add column if not exists item_type text not null default '';

create policy "update own saved outfits"
  on public.saved_outfits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
