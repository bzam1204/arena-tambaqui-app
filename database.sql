-- Database schema for Arena Tambaqui (Supabase/Postgres)
-- Run this in your Supabase SQL editor or psql.

-- UUID generation
create extension if not exists "pgcrypto";

-- Enums
create type feed_type as enum ('report', 'praise');

-- Users: identity + PII (cpf)
create table if not exists users (
  id uuid primary key,
  full_name text not null,
  avatar text,
  avatar_frame text,
  user_photo text,
  is_admin boolean,
  email text unique,
  cpf text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Players: gameplay persona tied to a user (nickname + reputation)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nickname text not null,
  motto text,
  is_vip boolean not null default false,
  praise_count integer not null default 0,
  report_count integer not null default 0,
   reputation integer not null default 6 check (reputation between 0 and 10),
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Matches: partidas e inscrições
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_at timestamptz not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  finalized_by uuid references users(id) on delete set null
);

create table if not exists match_subscriptions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  rent_equipment boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists match_attendance (
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  attended boolean not null default false,
  marked_at timestamptz not null default now(),
  primary key (match_id, player_id)
);

-- Feed: transmissions (praise/report). Submitter is a player (anonymous to other users).
create table if not exists feed (
  id uuid primary key default gen_random_uuid(),
  type feed_type not null,
  target_player_id uuid not null references players(id) on delete cascade,
  submitter_player_id uuid references players(id) on delete set null,
  content text not null,
  is_retracted boolean not null default false,
  created_at timestamptz not null default now(),
  match_id uuid references matches(id) on delete set null
);

alter table if exists feed
  add column if not exists match_id uuid references matches(id) on delete set null;

alter table if exists users
  add column if not exists email text;

alter table if exists users
  add column if not exists avatar_frame text;

alter table if exists users
  add column if not exists user_photo text;

alter table if exists players
  add column if not exists motto text;

alter table if exists players
  add column if not exists is_vip boolean not null default false;

-- Indexes for search
create index if not exists idx_players_nickname_lower on players (lower(nickname));
create unique index if not exists idx_players_user on players(user_id);
create index if not exists idx_users_full_name_lower on users (lower(full_name));
create index if not exists idx_users_email_lower on users (lower(email));
create index if not exists idx_feed_created_at on feed (created_at desc);
create index if not exists idx_feed_target_player on feed (target_player_id);
create index if not exists idx_feed_match on feed (match_id);
create index if not exists idx_matches_start_at on matches (start_at desc);
create index if not exists idx_match_subscriptions_match on match_subscriptions (match_id);
create index if not exists idx_match_subscriptions_player on match_subscriptions (player_id);
create index if not exists idx_match_attendance_match on match_attendance (match_id);
create index if not exists idx_match_attendance_player on match_attendance (player_id);

-- Storage policies for user verification photos (bucket: user-photos)
create policy "user-photos insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-photos'
  and auth.uid() = (storage.foldername(name))[1]::uuid
);

create policy "user-photos read"
on storage.objects
for select
to authenticated
using (bucket_id = 'user-photos');

create policy "user-photos update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-photos'
  and auth.uid() = (storage.foldername(name))[1]::uuid
);

create policy "user-photos delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-photos'
  and auth.uid() = (storage.foldername(name))[1]::uuid
);
