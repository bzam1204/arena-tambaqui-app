-- Database schema for Arena Tambaqui (Supabase/Postgres)
-- Run this in your Supabase SQL editor or psql.

-- UUID generation
create extension if not exists "pgcrypto";

-- Enums
create type feed_type as enum ('report', 'praise');

-- Profiles: onboarding data (CPF is stored and unique)
create table if not exists profiles (
  id uuid primary key,
  nickname text not null,
  name text not null,
  cpf text not null unique,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Players: reputation + history snapshot (can be denormalized from profiles)
create table if not exists players (
  id uuid primary key,
  name text not null,
  nickname text not null,
  avatar text,
  praise_count integer not null default 0,
  report_count integer not null default 0,
  reputation integer not null default 6 check (reputation between 0 and 10),
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feed: transmissions (praise/report)
create table if not exists feed (
  id uuid primary key default gen_random_uuid(),
  type feed_type not null,
  target_id uuid references players(id) on delete set null,
  target_name text,
  target_avatar text,
  content text not null,
  submitter_name text,
  submitter_cpf text,
  created_at timestamptz not null default now()
);

-- Indexes for search
create index if not exists idx_players_nickname_lower on players (lower(nickname));
create index if not exists idx_players_name_lower on players (lower(name));
create index if not exists idx_feed_created_at on feed (created_at desc);

-- Optional: keep players and profiles in sync via FK (uncomment if you want 1:1)
-- alter table players add constraint fk_players_profile foreign key (id) references profiles(id) on delete cascade;
