-- Tables and enum must already exist (users, players, matches, match_subscriptions, match_attendance, feed, feed_type).
-- This script only seeds data.
set local search_path = public;

begin;

-- Clean tables (drop data only) if they exist
do $$
begin
  if to_regclass('public.match_attendance') is not null then
    execute 'truncate table public.match_attendance restart identity cascade';
  end if;
  if to_regclass('public.match_subscriptions') is not null then
    execute 'truncate table public.match_subscriptions restart identity cascade';
  end if;
  if to_regclass('public.matches') is not null then
    execute 'truncate table public.matches restart identity cascade';
  end if;
  if to_regclass('public.feed') is not null then
    execute 'truncate table public.feed restart identity cascade';
  end if;
  if to_regclass('public.notifications') is not null then
    execute 'truncate table public.notifications restart identity cascade';
  end if;
  if to_regclass('public.players') is not null then
    execute 'truncate table public.players restart identity cascade';
  end if;
  if to_regclass('public.users') is not null then
    execute 'truncate table public.users restart identity cascade';
  end if;
  if to_regclass('public.users') is not null then
    perform 1 from pg_constraint where conname = 'users_cpf_key';
    if found then
      execute 'alter table public.users drop constraint users_cpf_key';
    end if;
    execute 'alter table public.users add constraint users_cpf_key unique (cpf)';
    perform 1 from pg_constraint where conname = 'users_email_key';
    if found then
      execute 'alter table public.users drop constraint users_email_key';
    end if;
    execute 'alter table public.users add constraint users_email_key unique (email)';
  end if;
end$$;

-- Insert users and players
with avatars as (
  select unnest(array[
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
  ]) as url
),
seed_roster as (
  select *
  from (values
    ('Gabriel Costa Pereira', 'GHOST_BR', 'ghost.bravo'),
    ('Mariana Alves Rocha', 'VALKYRIA', 'valkyria.ops'),
    ('Lucas Ferreira Lima', 'WRAITH_07', 'wraith.07'),
    ('Beatriz Souza Nogueira', 'VIPER_NOVA', 'viper.nova'),
    ('Rafael Mendes Carvalho', 'TITAN_13', 'titan.13'),
    ('Camila Rocha Duarte', 'SIREN', 'siren.blue'),
    ('Diego Lima Cardoso', 'JAGUAR', 'jaguar.delta'),
    ('Juliana Barros Freitas', 'LYNX_ECHO', 'lynx.echo'),
    ('Bruno Oliveira Prado', 'RANGER_BR', 'ranger.br'),
    ('Fernanda Souza Braga', 'NOVA_LUX', 'nova.lux'),
    ('Thiago Martins Vieira', 'ORCA', 'orca.team'),
    ('Luana Ribeiro Alves', 'MIRAGE', 'mirage.ln'),
    ('Pedro Santos Queiroz', 'ECHO_4', 'echo.04'),
    ('Ana Paula Duarte Silva', 'SAPPHIRE', 'sapphire.v1'),
    ('Igor Carvalho Nunes', 'SPECTER', 'specter.igor'),
    ('Carla Nunes Araujo', 'ION', 'ion.c9'),
    ('Victor Hugo Fernandes', 'RAIDER', 'raider.vh'),
    ('Bianca Melo Andrade', 'ORION', 'orion.bm'),
    ('Matheus Pinto Siqueira', 'FALCON', 'falcon.mp'),
    ('Renata Farias Campos', 'VEGA', 'vega.ren'),
    ('Joao Viana Silva', 'ATLAS', 'atlas.jv'),
    ('Aline Moraes Teixeira', 'HYDRA', 'hydra.al'),
    ('Felipe Cardoso Lima', 'DRACO', 'draco.fc'),
    ('Sabrina Peixoto Costa', 'KESTREL', 'kestrel.sp'),
    ('Gustavo Freitas Monteiro', 'TEMPEST', 'tempest.gf'),
    ('Patricia Lima Barbosa', 'QUASAR', 'quasar.pl'),
    ('Leandro Almeida Pires', 'BLACKHAWK', 'blackhawk.la'),
    ('Larissa Braga Ramos', 'ARTEMIS', 'artemis.lb'),
    ('Marcos Nogueira Dias', 'SABRE', 'sabre.mn'),
    ('Daniela Pires Rocha', 'LUNA', 'luna.dp'),
    ('Rodrigo Teixeira Souza', 'VORTEX', 'vortex.rt'),
    ('Tatiana Campos Viana', 'EMBER', 'ember.tc'),
    ('Henrique Silva Batista', 'SENTINEL', 'sentinel.hs'),
    ('Nadia Araujo Ribeiro', 'AURORA', 'aurora.na'),
    ('Caio Batista Carvalho', 'BLAZE', 'blaze.cb'),
    ('Elisa Monteiro Farias', 'NYX', 'nyx.em'),
    ('Andre Neves Duarte', 'FORGE', 'forge.an'),
    ('Viviane Pinto Mendes', 'PULSE', 'pulse.vp'),
    ('Marcelo Dias Cardoso', 'TROOPER', 'trooper.md'),
    ('Priscila Castro Nogueira', 'HALO', 'halo.pc'),
    ('Guilherme Reis Almeida', 'OUTLAW', 'outlaw.gr'),
    ('Yasmin Santos Oliveira', 'QUARTZ', 'quartz.ys'),
    ('Rafael Siqueira Braga', 'WARDEN', 'warden.rs'),
    ('Milena Prado Lima', 'ZENITH', 'zenith.mp'),
    ('Daniel Costa Freitas', 'RECON', 'recon.dc'),
    ('Isabela Ramos Rocha', 'FROST', 'frost.ir'),
    ('Hugo Andrade Silva', 'IRONCLAD', 'ironclad.ha'),
    ('Bruna Lopes Moreira', 'MANTIS', 'mantis.bl'),
    ('Otavio Queiroz Nunes', 'HAVOC', 'havoc.oq'),
    ('Nicole Vieira Almeida', 'SELENE', 'selene.nv')
  ) as roster(full_name, nickname, email_local)
),
roster as (
  select
    gen_random_uuid() as user_id,
    row_number() over () as rn,
    full_name,
    nickname,
    email_local,
    (select url from avatars order by random() limit 1) as avatar,
    lpad((10000000000 + row_number() over ())::text, 11, '0') as cpf
  from seed_roster
),
inserted_users as (
  insert into public.users (id, full_name, avatar, cpf, email, is_admin)
  select
    user_id,
    full_name,
    avatar,
    cpf,
    email_local || '@arena-tambaqui.com',
    rn = 1
  from roster
  returning id
),
player_seed as (
  select
    gen_random_uuid() as player_id,
    roster.user_id as user_id,
    roster.nickname as nickname,
    floor(random() * 40)::int as praise_count,
    floor(random() * 30)::int as report_count
  from roster
  where exists (select 1 from inserted_users)
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

-- Insert matches
insert into matches (id, name, start_at, created_by, created_at, finalized_at, finalized_by)
values
  (gen_random_uuid(), 'Operação Trovão', now() + interval '2 hours', (select id from users limit 1), now(), null, null),
  (gen_random_uuid(), 'Missão Noturna', now() + interval '2 days', (select id from users limit 1), now(), null, null),
  (gen_random_uuid(), 'Treino Tático', now() - interval '7 days', (select id from users limit 1), now() - interval '7 days', now() - interval '6 days', (select id from users limit 1));

-- Subscriptions (future matches + finalized match)
with ranked_players as (
  select id, row_number() over (order by nickname) as rn from players
)
insert into match_subscriptions (id, match_id, player_id, rent_equipment, created_at)
select
  gen_random_uuid(),
  (select id from matches where name = 'Operação Trovão' limit 1),
  id,
  random() < 0.4,
  now()
from ranked_players
where rn between 1 and 12;

with ranked_players as (
  select id, row_number() over (order by nickname) as rn from players
)
insert into match_subscriptions (id, match_id, player_id, rent_equipment, created_at)
select
  gen_random_uuid(),
  (select id from matches where name = 'Missão Noturna' limit 1),
  id,
  random() < 0.3,
  now()
from ranked_players
where rn between 13 and 24;

with ranked_players as (
  select id, row_number() over (order by nickname) as rn from players
)
insert into match_subscriptions (id, match_id, player_id, rent_equipment, created_at)
select
  gen_random_uuid(),
  (select id from matches where name = 'Treino Tático' limit 1),
  id,
  random() < 0.5,
  now() - interval '8 days'
from ranked_players
where rn between 25 and 36;

-- Attendance for finalized match
with ranked_players as (
  select id, row_number() over (order by nickname) as rn from players
)
insert into match_attendance (match_id, player_id, attended, marked_at)
select
  (select id from matches where name = 'Treino Tático' limit 1),
  id,
  random() < 0.7,
  now() - interval '7 days'
from ranked_players
where rn between 25 and 36;

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
