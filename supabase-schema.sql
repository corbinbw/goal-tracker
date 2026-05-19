create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  email text primary key,
  role text not null check (role in ('manager', 'member')),
  created_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
alter table public.profiles enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "Team members can read team membership" on public.team_members;
create policy "Team members can read team membership"
on public.team_members
for select
to authenticated
using (
  exists (
    select 1
    from public.team_members tm
    where lower(tm.email) = lower((select auth.jwt() ->> 'email'))
  )
);

drop policy if exists "Users can upsert their own profile" on public.profiles;
create policy "Users can upsert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Managers can read profiles" on public.profiles;
create policy "Managers can read profiles"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.team_members tm
    where lower(tm.email) = lower((select auth.jwt() ->> 'email'))
      and tm.role = 'manager'
  )
);

drop policy if exists "Users can read their own app state" on public.app_state;
create policy "Users can read their own app state"
on public.app_state
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.team_members tm
    where lower(tm.email) = lower((select auth.jwt() ->> 'email'))
      and tm.role = 'manager'
  )
);

drop policy if exists "Users can insert their own app state" on public.app_state;
create policy "Users can insert their own app state"
on public.app_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own app state" on public.app_state;
create policy "Users can update their own app state"
on public.app_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
