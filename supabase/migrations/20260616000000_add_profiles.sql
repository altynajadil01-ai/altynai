create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  city text not null default '',
  favorite_style text not null default '',
  budget text not null default '',
  sizes text not null default '',
  favorite_colors text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
