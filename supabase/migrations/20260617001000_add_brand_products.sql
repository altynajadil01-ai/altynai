create table if not exists public.brand_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brand text not null,
  title text not null,
  item_type text not null,
  color text not null,
  season text not null default 'всесезон',
  style text not null default '',
  budget text not null default 'средний',
  price numeric(10, 2),
  currency text not null default 'KZT',
  image_url text not null default '',
  product_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.brand_products enable row level security;

create policy "read own brand products"
  on public.brand_products for select
  using (auth.uid() = user_id);

create policy "insert own brand products"
  on public.brand_products for insert
  with check (auth.uid() = user_id);

create policy "update own brand products"
  on public.brand_products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own brand products"
  on public.brand_products for delete
  using (auth.uid() = user_id);
