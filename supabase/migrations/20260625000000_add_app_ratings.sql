create table if not exists public.app_ratings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_ratings enable row level security;

create policy "read own app rating"
  on public.app_ratings for select
  using (auth.uid() = user_id);

create policy "insert own app rating"
  on public.app_ratings for insert
  with check (auth.uid() = user_id);

create policy "update own app rating"
  on public.app_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own app rating"
  on public.app_ratings for delete
  using (auth.uid() = user_id);
