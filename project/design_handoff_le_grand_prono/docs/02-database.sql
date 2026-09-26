-- =====================================================================
-- Le Grand Prono : migration initiale Supabase (Postgres 15)
-- Principes : tout est rattaché à une saison ; les écritures sensibles
-- passent par des fonctions SECURITY DEFINER ; les points sont recalculés
-- de façon idempotente (DELETE puis INSERT dans une transaction).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role          as enum ('player','admin');
create type candidate_status   as enum ('competing','nominated','immune','eliminated','finalist','winner');
create type question_category  as enum ('grand','weekly','fun');
create type question_type      as enum ('single','multiple','yes_no','exact_number','ordered');
create type question_status    as enum ('draft','open','closed','published','cancelled');
create type scoring_rule       as enum ('per_correct','all_or_nothing','exact_number','ordered_positions');
create type options_source     as enum ('candidates_competing','candidates_nominated','candidates_all','custom','yes_no');
create type league_role        as enum ('owner','admin','member');
create type notif_kind         as enum ('predictions_open','deadline_soon','results_published','points_awarded','badge_earned','rank_jump');

-- ---------- Profils (1-1 avec auth.users) ----------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  pseudo        text not null unique check (char_length(pseudo) between 2 and 24),
  avatar_url    text,
  role          user_role not null default 'player',
  notif_enabled boolean not null default true,
  created_at    timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Saisons ----------
create table seasons (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,                -- 'Star Academy 2026'
  is_current                  boolean not null default false,
  first_prime_at              timestamptz not null,
  grand_predictions_close_at  timestamptz not null,
  final_at                    timestamptz,
  finalists_count             int not null default 2,
  tour_count                  int not null default 8,
  least_nominated_min_weeks   int not null default 4,
  archived_at                 timestamptz,
  created_at                  timestamptz not null default now()
);
create unique index one_current_season on seasons(is_current) where is_current;

-- ---------- Primes ----------
create table primes (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references seasons(id) on delete cascade,
  number     int  not null,
  airs_at    timestamptz not null,
  is_final   boolean not null default false,
  unique (season_id, number)
);

-- ---------- Candidats ----------
create table candidates (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references seasons(id) on delete cascade,
  first_name      text not null,
  last_name       text,
  photo_url       text,
  age             int,
  city            text,
  bio             text,
  entered_at      date,
  status          candidate_status not null default 'competing',
  eliminated_at   timestamptz,
  eliminated_prime_id uuid references primes(id),
  on_tour         boolean,          -- indépendant du statut ; null = pas encore connu
  final_rank      int,
  created_at      timestamptz not null default now()
);

-- Une ligne par SEMAINE de nomination (une semaine = une nomination)
create table candidate_nominations (
  candidate_id uuid not null references candidates(id) on delete cascade,
  prime_id     uuid not null references primes(id) on delete cascade,
  primary key (candidate_id, prime_id)
);
-- Semaines d'éligibilité (pour la règle « moins nommé », seuil configurable)
create table candidate_eligible_weeks (
  candidate_id uuid not null references candidates(id) on delete cascade,
  prime_id     uuid not null references primes(id) on delete cascade,
  primary key (candidate_id, prime_id)
);

-- ---------- Questions (« Predictions ») ----------
create table questions (
  id                  uuid primary key default gen_random_uuid(),
  season_id           uuid not null references seasons(id) on delete cascade,
  prime_id            uuid references primes(id) on delete cascade,  -- null pour les grands pronos
  category            question_category not null,
  type                question_type not null,
  title               text not null,
  description         text,
  validation_criteria text,                -- OBLIGATOIRE avant ouverture (check ci-dessous)
  options_source      options_source not null default 'custom',
  min_selections      int not null default 1,
  max_selections      int not null default 1,
  points              int not null check (points >= 0),     -- par bonne réponse si per_correct
  bonus_points        int not null default 0,               -- ex. tournée parfaite +50
  scoring             scoring_rule not null default 'per_correct',
  closes_at           timestamptz not null,
  status              question_status not null default 'draft',
  sort_order          int not null default 0,
  cancelled_reason    text,
  created_at          timestamptz not null default now(),
  check (max_selections >= min_selections),
  check (status = 'draft' or validation_criteria is not null),
  check ((category = 'grand') = (prime_id is null))
);

create table question_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references questions(id) on delete cascade,
  label         text not null,
  candidate_id  uuid references candidates(id),
  is_none_option boolean not null default false,  -- « Aucun couple confirmé »
  sort_order    int not null default 0
);

-- ---------- Prédictions des joueurs ----------
create table user_predictions (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references questions(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  option_ids    uuid[] not null default '{}',   -- ordre significatif si type = ordered
  number_value  numeric,
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (question_id, user_id)
);

-- ---------- Résultats officiels ----------
create table official_results (
  question_id        uuid primary key references questions(id) on delete cascade,
  correct_option_ids uuid[] not null default '{}',  -- plusieurs = égalité acceptée
  number_value       numeric,
  version            int not null default 1,
  recorded_by        uuid references profiles(id),
  recorded_at        timestamptz not null default now()
);

-- ---------- Transactions de points (grand livre) ----------
create table score_transactions (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references seasons(id),
  prime_id        uuid references primes(id),
  question_id     uuid not null references questions(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  kind            text not null check (kind in ('base','bonus')),
  points          int not null,
  correct_count   int not null default 0,
  result_version  int not null,
  created_at      timestamptz not null default now(),
  unique (question_id, user_id, kind)            -- anti double attribution
);

-- Historique des rangs (graphique d'évolution + flèches ▲▼)
create table rank_snapshots (
  season_id  uuid not null references seasons(id),
  prime_id   uuid not null references primes(id),
  league_id  uuid,                       -- null = classement général
  user_id    uuid not null references profiles(id) on delete cascade,
  total      int not null,
  rank       int not null,
  primary key (prime_id, league_id, user_id)
);

-- ---------- Ligues ----------
create table leagues (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references seasons(id),
  name         text not null check (char_length(name) between 2 and 40),
  image_url    text,
  invite_code  text not null unique default upper(substr(md5(gen_random_uuid()::text),1,4) || '-' || substr(md5(gen_random_uuid()::text),1,4)),
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now()
);
create table league_members (
  league_id  uuid not null references leagues(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       league_role not null default 'member',
  is_primary boolean not null default false,   -- ligue principale affichée sur l'accueil
  joined_at  timestamptz not null default now(),
  primary key (league_id, user_id)
);

-- ---------- Badges ----------
create table badges (
  code        text primary key,   -- visionnaire, tour_manager, madame_irma, specialiste, comeback, fidele, champion
  name        text not null,
  description text not null,
  icon        text not null       -- nom d'icône Lucide
);
create table user_badges (
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_code text not null references badges(code),
  season_id  uuid not null references seasons(id),
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_code, season_id)
);

-- ---------- Notifications ----------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       notif_kind not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Journal admin ----------
create table admin_logs (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- Helpers
-- =====================================================================
create or replace function question_is_locked(q questions) returns boolean
language sql stable as $$
  select q.status in ('closed','published','cancelled') or now() >= q.closes_at;
$$;

create or replace function log_admin(p_action text, p_entity text, p_id uuid, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = public as $$
  insert into admin_logs(actor_id, action, entity, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_entity, p_id, p_old, p_new);
$$;

-- =====================================================================
-- RPC joueur : enregistrer une prédiction (verrouillage serveur)
-- =====================================================================
create or replace function submit_prediction(p_question uuid, p_option_ids uuid[] default '{}', p_number numeric default null)
returns user_predictions
language plpgsql security definer set search_path = public as $$
declare q questions; r user_predictions; n int := coalesce(array_length(p_option_ids,1),0);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into q from questions where id = p_question for share;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  if q.status <> 'open' or now() >= q.closes_at then raise exception 'QUESTION_LOCKED'; end if;

  if q.type = 'exact_number' then
    if p_number is null then raise exception 'NUMBER_REQUIRED'; end if;
  else
    if n < q.min_selections or n > q.max_selections then raise exception 'BAD_SELECTION_COUNT'; end if;
    if (select count(distinct x) from unnest(p_option_ids) x) <> n then raise exception 'DUPLICATE_OPTION'; end if;
    if exists (select 1 from unnest(p_option_ids) x
               where not exists (select 1 from question_options o where o.id = x and o.question_id = q.id))
      then raise exception 'INVALID_OPTION'; end if;
    -- Pas de candidat éliminé dans une question portant sur les candidats en lice
    if q.options_source in ('candidates_competing','candidates_nominated') and exists (
         select 1 from question_options o join candidates c on c.id = o.candidate_id
         where o.id = any(p_option_ids) and c.status = 'eliminated')
      then raise exception 'CANDIDATE_ELIMINATED'; end if;
  end if;

  insert into user_predictions(question_id, user_id, option_ids, number_value)
  values (q.id, auth.uid(), p_option_ids, p_number)
  on conflict (question_id, user_id)
  do update set option_ids = excluded.option_ids, number_value = excluded.number_value, updated_at = now()
  returning * into r;
  return r;
end $$;

-- =====================================================================
-- Moteur de score (pur, sans effet de bord)
-- =====================================================================
create or replace function score_prediction(q questions, sel uuid[], num numeric, res official_results)
returns table(base int, bonus int, correct int)
language plpgsql immutable as $$
declare hits int := 0; i int;
begin
  base := 0; bonus := 0; correct := 0;
  if q.status = 'cancelled' or res is null then return next; return; end if;

  if q.scoring = 'exact_number' then
    if num is not null and num = res.number_value then base := q.points; correct := 1; end if;

  elsif q.scoring = 'per_correct' then
    select count(*) into hits from unnest(sel) s where s = any(res.correct_option_ids);
    base := hits * q.points; correct := hits;
    -- Bonus : toutes les sélections correctes ET liste officielle complète trouvée
    if q.bonus_points > 0 and hits = coalesce(array_length(sel,1),0)
       and hits = coalesce(array_length(res.correct_option_ids,1),0) and hits = q.max_selections then
      bonus := q.bonus_points;
    end if;

  elsif q.scoring = 'all_or_nothing' then   -- ex. le couple : paire exacte ou « aucun couple »
    if sel is not null and array_length(sel,1) > 0
       and (select array_agg(x order by x) from unnest(sel) x) = (select array_agg(x order by x) from unnest(res.correct_option_ids) x)
    then base := q.points; correct := 1; end if;

  elsif q.scoring = 'ordered_positions' then
    for i in 1 .. least(coalesce(array_length(sel,1),0), coalesce(array_length(res.correct_option_ids,1),0)) loop
      if sel[i] = res.correct_option_ids[i] then hits := hits + 1; end if;
    end loop;
    base := hits * q.points; correct := hits;
  end if;
  return next;
end $$;

-- Prévisualisation admin (aucune écriture)
create or replace function preview_result(p_question uuid, p_correct uuid[], p_number numeric default null)
returns table(user_id uuid, pseudo text, option_ids uuid[], base int, bonus int, correct int)
language plpgsql stable security definer set search_path = public as $$
declare q questions; fake official_results;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into q from questions where id = p_question;
  fake.question_id := p_question; fake.correct_option_ids := p_correct; fake.number_value := p_number;
  return query
    select up.user_id, p.pseudo, up.option_ids, s.base, s.bonus, s.correct
    from user_predictions up join profiles p on p.id = up.user_id
    cross join lateral score_prediction(q, up.option_ids, up.number_value, fake) s
    where up.question_id = p_question and up.submitted_at < q.closes_at;
end $$;

-- Recalcul idempotent d'une question
create or replace function recompute_question(p_question uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q questions; res official_results;
begin
  perform pg_advisory_xact_lock(hashtext(p_question::text));
  select * into q from questions where id = p_question for update;
  select * into res from official_results where question_id = p_question;
  delete from score_transactions where question_id = p_question;
  if q.status = 'cancelled' or res is null then return; end if;

  insert into score_transactions(season_id, prime_id, question_id, user_id, kind, points, correct_count, result_version)
  select q.season_id, q.prime_id, q.id, up.user_id, k.kind, k.pts, s.correct, res.version
  from user_predictions up
  cross join lateral score_prediction(q, up.option_ids, up.number_value, res) s
  cross join lateral (values ('base', s.base), ('bonus', s.bonus)) as k(kind, pts)
  where up.question_id = q.id
    and up.submitted_at < q.closes_at        -- réponse enregistrée avant la clôture uniquement
    and (k.kind = 'base' or k.pts > 0);
end $$;

-- Publication / correction d'un résultat (admin)
create or replace function publish_result(p_question uuid, p_correct uuid[], p_number numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare old official_results; q questions;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into q from questions where id = p_question for update;
  if q.status = 'draft' then raise exception 'QUESTION_NOT_OPENED'; end if;
  if q.status = 'cancelled' then raise exception 'QUESTION_CANCELLED'; end if;
  if now() < q.closes_at then raise exception 'QUESTION_STILL_OPEN'; end if;

  select * into old from official_results where question_id = p_question;
  insert into official_results(question_id, correct_option_ids, number_value, version, recorded_by)
  values (p_question, p_correct, p_number, 1, auth.uid())
  on conflict (question_id) do update
    set correct_option_ids = excluded.correct_option_ids, number_value = excluded.number_value,
        version = official_results.version + 1, recorded_by = auth.uid(), recorded_at = now();

  update questions set status = 'published' where id = p_question;
  perform recompute_question(p_question);
  perform log_admin(case when old is null then 'result.publish' else 'result.correct' end, 'question', p_question,
                    to_jsonb(old), jsonb_build_object('correct_option_ids', p_correct, 'number_value', p_number));

  insert into notifications(user_id, kind, title, body, link)
  select st.user_id, 'results_published',
         case when sum(st.points) > 0 then '+' || sum(st.points) || ' pts !' else 'Résultat publié' end,
         q.title, '/profil'
  from score_transactions st join profiles p on p.id = st.user_id and p.notif_enabled
  where st.question_id = p_question group by st.user_id;
end $$;

create or replace function cancel_question(p_question uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  update questions set status = 'cancelled', cancelled_reason = p_reason where id = p_question;
  perform recompute_question(p_question);   -- supprime tous les points
  perform log_admin('question.cancel', 'question', p_question, null, jsonb_build_object('reason', p_reason));
end $$;

-- Clôture automatique (appelée par pg_cron chaque minute, ou lue à la volée via question_is_locked)
create or replace function close_due_questions() returns int
language sql security definer set search_path = public as $$
  with u as (update questions set status = 'closed' where status = 'open' and closes_at <= now() returning 1)
  select count(*)::int from u;
$$;

-- Ligues
create or replace function join_league(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare l leagues;
begin
  select * into l from leagues where invite_code = upper(trim(p_code));
  if not found then raise exception 'INVALID_CODE'; end if;
  insert into league_members(league_id, user_id) values (l.id, auth.uid()) on conflict do nothing;
  return l.id;
end $$;

create or replace function create_league(p_name text) returns leagues
language plpgsql security definer set search_path = public as $$
declare l leagues;
begin
  insert into leagues(season_id, name, created_by)
  values ((select id from seasons where is_current), p_name, auth.uid()) returning * into l;
  insert into league_members(league_id, user_id, role) values (l.id, auth.uid(), 'owner');
  return l;
end $$;

-- Snapshot des rangs après un prime (appelé par l'admin « Clôturer la semaine » ou après la dernière publication du prime)
create or replace function snapshot_ranks(p_prime uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s uuid := (select season_id from primes where id = p_prime);
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  delete from rank_snapshots where prime_id = p_prime;
  insert into rank_snapshots(season_id, prime_id, league_id, user_id, total, rank)
  select s, p_prime, null, user_id, total, rank() over (order by total desc) from v_season_scores where season_id = s;
  insert into rank_snapshots(season_id, prime_id, league_id, user_id, total, rank)
  select s, p_prime, league_id, user_id, total, rank from v_league_leaderboard where season_id = s;
end $$;

-- =====================================================================
-- Vues de classement (égalité = même rang via RANK())
-- =====================================================================
create or replace view v_season_scores as
select pr.id as user_id, se.id as season_id,
       coalesce(sum(st.points),0)::int as total,
       coalesce(sum(st.correct_count) filter (where st.kind='base'),0)::int as correct_answers,
       (select count(*) from user_predictions up join questions q on q.id = up.question_id
         where up.user_id = pr.id and q.season_id = se.id)::int as predictions_count
from profiles pr cross join seasons se
left join score_transactions st on st.user_id = pr.id and st.season_id = se.id
group by pr.id, se.id;

create or replace view v_prime_scores as
select st.user_id, st.prime_id, st.season_id, sum(st.points)::int as points,
       rank() over (partition by st.prime_id order by sum(st.points) desc) as rank
from score_transactions st where st.prime_id is not null
group by st.user_id, st.prime_id, st.season_id;

create or replace view v_league_leaderboard as
select lm.league_id, l.season_id, lm.user_id, coalesce(ss.total,0) as total,
       rank() over (partition by lm.league_id order by coalesce(ss.total,0) desc) as rank
from league_members lm join leagues l on l.id = lm.league_id
left join v_season_scores ss on ss.user_id = lm.user_id and ss.season_id = l.season_id;

-- Statistiques communautaires : uniquement pour les questions verrouillées
create or replace view v_candidate_pick_stats as
select q.id as question_id, o.candidate_id,
       round(100.0 * count(up.*) filter (where o.id = any(up.option_ids)) / nullif(count(up.*),0)) as pct
from questions q
join question_options o on o.question_id = q.id and o.candidate_id is not null
left join user_predictions up on up.question_id = q.id
where q.status in ('closed','published') or now() >= q.closes_at
group by q.id, o.candidate_id;

-- =====================================================================
-- RLS
-- =====================================================================
alter table profiles              enable row level security;
alter table seasons               enable row level security;
alter table primes                enable row level security;
alter table candidates            enable row level security;
alter table candidate_nominations enable row level security;
alter table candidate_eligible_weeks enable row level security;
alter table questions             enable row level security;
alter table question_options      enable row level security;
alter table user_predictions      enable row level security;
alter table official_results      enable row level security;
alter table score_transactions    enable row level security;
alter table rank_snapshots        enable row level security;
alter table leagues               enable row level security;
alter table league_members        enable row level security;
alter table badges                enable row level security;
alter table user_badges           enable row level security;
alter table notifications         enable row level security;
alter table admin_logs            enable row level security;

-- Profils : lecture pour tous les connectés, écriture de son propre profil (sauf rôle)
create policy profiles_read   on profiles for select using (auth.role() = 'authenticated');
create policy profiles_insert on profiles for insert with check (id = auth.uid() and role = 'player');
create policy profiles_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- Données officielles : lecture pour tous, écriture admin
do $$ declare t text; begin
  foreach t in array array['seasons','primes','candidates','candidate_nominations','candidate_eligible_weeks','badges'] loop
    execute format('create policy %1$s_read on %1$s for select using (true)', t);
    execute format('create policy %1$s_admin on %1$s for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Questions : les brouillons ne sont visibles que par l'admin
create policy questions_read  on questions for select using (status <> 'draft' or is_admin());
create policy questions_admin on questions for all using (is_admin()) with check (is_admin());
create policy options_read    on question_options for select using (
  exists (select 1 from questions q where q.id = question_id and (q.status <> 'draft' or is_admin())));
create policy options_admin   on question_options for all using (is_admin()) with check (is_admin());

-- Prédictions : toujours les siennes ; celles des autres seulement après la clôture.
-- AUCUNE policy insert/update/delete : l'écriture passe exclusivement par submit_prediction().
create policy predictions_read on user_predictions for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from questions q where q.id = question_id and question_is_locked(q)));

-- Résultats : visibles une fois publiés
create policy results_read on official_results for select using (
  is_admin() or exists (select 1 from questions q where q.id = question_id and q.status = 'published'));

-- Points et historique des rangs : lecture seule pour tous ; écriture uniquement via les fonctions
create policy scores_read on score_transactions for select using (auth.role() = 'authenticated');
create policy ranks_read  on rank_snapshots     for select using (auth.role() = 'authenticated');

-- Ligues : visibles par leurs membres ; la gestion des membres revient aux owner/admin de la ligue.
-- Helpers SECURITY DEFINER pour éviter la récursion RLS sur league_members.
create or replace function is_league_member(p_league uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from league_members where league_id = p_league and user_id = auth.uid());
$$;
create or replace function is_league_manager(p_league uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from league_members where league_id = p_league and user_id = auth.uid() and role in ('owner','admin'));
$$;
create policy leagues_read   on leagues for select using (is_admin() or is_league_member(leagues.id));
create policy leagues_update on leagues for update using (is_league_manager(leagues.id));
create policy members_read   on league_members for select using (is_admin() or is_league_member(league_members.league_id));
create policy members_manage on league_members for delete using (user_id = auth.uid() or is_league_manager(league_members.league_id));
create policy members_primary on league_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_badges_read on user_badges for select using (auth.role() = 'authenticated');
create policy notifs_own on notifications for select using (user_id = auth.uid());
create policy notifs_mark_read on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy logs_admin on admin_logs for select using (is_admin());

-- Droits d'exécution
revoke all on function recompute_question(uuid) from public, anon, authenticated;
grant execute on function submit_prediction(uuid, uuid[], numeric) to authenticated;
grant execute on function join_league(text), create_league(text) to authenticated;
grant execute on function preview_result(uuid, uuid[], numeric), publish_result(uuid, uuid[], numeric),
                          cancel_question(uuid, text), snapshot_ranks(uuid) to authenticated; -- contrôle is_admin() interne

-- Seeds de référence
insert into badges(code, name, description, icon) values
 ('visionnaire','Le Visionnaire','Avoir trouvé le vainqueur de la saison.','eye'),
 ('tour_manager','Le Tour Manager','Avoir trouvé tous les participants à la tournée.','ticket'),
 ('madame_irma','Madame Irma','Trois pronostics corrects consécutifs.','sparkles'),
 ('specialiste','Le Spécialiste','Au moins 80 % de bonnes réponses sur un prime d’au moins 5 questions.','target'),
 ('comeback','Le Comeback','Gagner au moins 3 places dans son classement de ligue en une semaine.','trending-up'),
 ('fidele','Le Fidèle','Avoir participé aux pronostics 5 semaines différentes.','calendar-check'),
 ('champion','Le Champion','Terminer premier d’une ligue à la fin de la saison.','crown');
