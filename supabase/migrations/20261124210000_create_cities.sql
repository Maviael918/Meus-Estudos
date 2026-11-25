create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Vila das Flores' check (char_length(name) between 1 and 80),
  state_version smallint not null default 1 check (state_version > 0),
  game_state jsonb not null default '{}'::jsonb check (jsonb_typeof(game_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cities enable row level security;

revoke all on public.cities from anon;
grant select, insert, update on public.cities to authenticated;

create policy "Players can read their own city"
  on public.cities for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Players can create their own city"
  on public.cities for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Players can update their own city"
  on public.cities for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create or replace function public.set_city_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_cities_updated_at
  before update on public.cities
  for each row
  execute function public.set_city_updated_at();
