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
  is_admin boolean,
  cpf text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Players: gameplay persona tied to a user (nickname + reputation)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nickname text not null,
  praise_count integer not null default 0,
  report_count integer not null default 0,
  reputation integer not null default 6 check (reputation between 0 and 10),
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feed: transmissions (praise/report). Submitter is a player (anonymous to other users).
create table if not exists feed (
  id uuid primary key default gen_random_uuid(),
  type feed_type not null,
  target_player_id uuid not null references players(id) on delete cascade,
  submitter_player_id uuid references players(id) on delete set null,
  content text not null,
  is_retracted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for search
create index if not exists idx_players_nickname_lower on players (lower(nickname));
create unique index if not exists idx_players_user on players(user_id);
create index if not exists idx_users_full_name_lower on users (lower(full_name));
create index if not exists idx_feed_created_at on feed (created_at desc);
create index if not exists idx_feed_target_player on feed (target_player_id);
