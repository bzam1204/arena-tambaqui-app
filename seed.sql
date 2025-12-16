-- Tables and enum must already exist (users, players, feed, feed_type). This script only seeds data.
set local search_path = public;

begin;

-- Clean tables (drop data only) if they exist
do $$
begin
  if to_regclass('public.feed') is not null then
    execute 'truncate table public.feed restart identity cascade';
  end if;
  if to_regclass('public.players') is not null then
    execute 'truncate table public.players restart identity cascade';
  end if;
  if to_regclass('public.users') is not null then
    execute 'truncate table public.users restart identity cascade';
  end if;
end$$;

-- Insert users and players
with inserted_users as (
  insert into public.users (id, full_name, avatar, cpf)
  select
    gen_random_uuid() as id,
    'Operador ' || gs as full_name,
    (array[
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39',
      'https://images.unsplash.com/photo-1441123694162-e54a981ceba3'
    ])[1 + (random()*9)::int] as avatar,
    lpad(gs::text, 11, '0') as cpf
  from generate_series(1, 200) as gs
  returning id, full_name
),
enumerated_users as (
  select id, full_name, row_number() over () as rn from inserted_users
),
player_seed as (
  select
    gen_random_uuid() as player_id,
    id as user_id,
    'Codinome-' || lpad(rn::text, 3, '0') as nickname,
    floor(random() * 40)::int as praise_count,
    floor(random() * 30)::int as report_count
  from enumerated_users
)
insert into players (id, user_id, nickname, praise_count, report_count, reputation)
select
  player_id,
  user_id,
  nickname,
  praise_count,
  report_count,
  least(10, greatest(0, 6 + floor(praise_count / 5) - floor(report_count / 5))) as reputation
from player_seed;

-- Insert feed entries (~400 rows)
with p as (
  select id, row_number() over () as rn from players
),
feed_rows as (
  select
    gen_random_uuid() as id,
    (case when random() < 0.5 then 'praise' else 'report' end)::feed_type as type,
    (select id from p order by random() limit 1) as target_player_id,
    (select id from p order by random() limit 1) as submitter_player_id,
    'Registro ' || gs || ' gerado automaticamente' as content,
    now() - (gs || ' minutes')::interval as created_at
  from generate_series(1, 400) gs
)
insert into feed (id, type, target_player_id, submitter_player_id, content, created_at)
select id, type, target_player_id, submitter_player_id, content, created_at
from feed_rows;

commit;
