alter table public.profiles
  add column if not exists preferred_brands text[] not null default '{}',
  add column if not exists avoid_dresses boolean not null default false;
