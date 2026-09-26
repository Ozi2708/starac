-- =====================================================================
-- Le Grand Prono : migration initiale Supabase (Postgres 15+)
-- Dérivée de docs/02-database.sql (dossier de passation), corrigée et complétée :
--  * rank_snapshots : clé technique (une PK ne peut pas contenir league_id nul)
--  * league_members : plus d'UPDATE direct (le rôle aurait été modifiable) → RPC set_primary_league
--  * vues de classement en security_invoker (pas de fuite des membres d'autres ligues)
--  * barème et règle figés dès l'ouverture (trigger), journal admin automatique (trigger d'audit)
--  * RPC admin : questions, candidats, clôture de semaine, badges, notifications
-- Principes : tout est rattaché à une saison ; les écritures sensibles passent par des
-- fonctions SECURITY DEFINER ; les points sont recalculés de façon idempotente.
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
  pseudo        text not null check (char_length(pseudo) between 2 and 24),
  avatar_url    text,
  role          user_role not null default 'player',
  notif_enabled boolean not null default true,
  created_at    timestamptz not null default now()
);
create unique index profiles_pseudo_ci on profiles (lower(pseudo));

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Saisons ----------
create table seasons (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  year                        int  not null,
  is_current                  boolean not null default false,
  first_prime_at              timestamptz not null,
  grand_predictions_close_at  timestamptz not null,
  final_at                    timestamptz,
  finalists_count             int not null default 2 check (finalists_count between 1 and 6),
  tour_count                  int not null default 8 check (tour_count between 1 and 20),
  least_nominated_min_weeks   int not null default 4 check (least_nominated_min_weeks >= 0),
  archived_at                 timestamptz,
  created_at                  timestamptz not null default now()
);
create unique index one_current_season on seasons(is_current) where is_current;

create or replace function current_season_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from seasons where is_current limit 1;
$$;

-- ---------- Primes ----------
create table primes (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references seasons(id) on delete cascade,
  number     int  not null check (number > 0),
  airs_at    timestamptz not null,
  is_final   boolean not null default false,
  closed_at  timestamptz,            -- « Clôturer la semaine » (snapshot des rangs)
  unique (season_id, number)
);

-- ---------- Candidats ----------
create table candidates (
  id                  uuid primary key default gen_random_uuid(),
  season_id           uuid not null references seasons(id) on delete cascade,
  first_name          text not null check (char_length(first_name) between 1 and 40),
  last_name           text,
  photo_url           text,
  age                 int check (age is null or age between 14 and 99),
  city                text,
  bio                 text,
  entered_at          date,
  status              candidate_status not null default 'competing',
  eliminated_at       timestamptz,
  eliminated_prime_id uuid references primes(id) on delete set null,
  on_tour             boolean,          -- indépendant du statut ; null = pas encore connu
  final_rank          int,
  created_at          timestamptz not null default now()
);

-- Une ligne par SEMAINE de nomination (une semaine = une nomination)
create table candidate_nominations (
  candidate_id uuid not null references candidates(id) on delete cascade,
  prime_id     uuid not null references primes(id) on delete cascade,
  primary key (candidate_id, prime_id)
);
-- Semaines d'éligibilité (règle « moins nommé », seuil configurable)
create table candidate_eligible_weeks (
  candidate_id uuid not null references candidates(id) on delete cascade,
  prime_id     uuid not null references primes(id) on delete cascade,
  primary key (candidate_id, prime_id)
);

-- ---------- Questions ----------
create table questions (
  id                  uuid primary key default gen_random_uuid(),
  season_id           uuid not null references seasons(id) on delete cascade,
  prime_id            uuid references primes(id) on delete cascade,  -- null pour les grands pronos
  category            question_category not null,
  key                 text,                -- grands pronos : winner, finalists, first_out, tour, most_nominated…
  type                question_type not null,
  title               text not null check (char_length(title) between 3 and 160),
  description         text,
  icon                text not null default 'sparkles',   -- icône Lucide
  validation_criteria text,
  options_source      options_source not null default 'custom',
  min_selections      int not null default 1 check (min_selections >= 0),
  max_selections      int not null default 1 check (max_selections >= 1),
  points              int not null check (points >= 0),     -- par bonne réponse si per_correct
  bonus_points        int not null default 0 check (bonus_points >= 0),
  scoring             scoring_rule not null default 'per_correct',
  closes_at           timestamptz not null,
  status              question_status not null default 'draft',
  sort_order          int not null default 0,
  cancelled_reason    text,
  created_at          timestamptz not null default now(),
  check (max_selections >= min_selections),
  check (status = 'draft' or coalesce(char_length(trim(validation_criteria)), 0) > 0),
  check ((category = 'grand') = (prime_id is null)),
  check (status <> 'cancelled' or cancelled_reason is not null)
);
create unique index questions_grand_key on questions(season_id, key) where key is not null;
create index questions_prime on questions(prime_id);

create table question_options (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references questions(id) on delete cascade,
  label          text not null,
  candidate_id   uuid references candidates(id) on delete cascade,
  is_none_option boolean not null default false,  -- « Aucun couple confirmé »
  sort_order     int not null default 0
);
create unique index question_options_cand on question_options(question_id, candidate_id) where candidate_id is not null;
create index question_options_q on question_options(question_id);

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
create index user_predictions_user on user_predictions(user_id);

-- ---------- Résultats officiels ----------
create table official_results (
  question_id        uuid primary key references questions(id) on delete cascade,
  correct_option_ids uuid[] not null default '{}',  -- plusieurs = égalité acceptée
  number_value       numeric,
  version            int not null default 1,
  recorded_by        uuid references profiles(id) on delete set null,
  recorded_at        timestamptz not null default now()
);

-- ---------- Transactions de points (grand livre) ----------
create table score_transactions (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references seasons(id) on delete cascade,
  prime_id        uuid references primes(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  kind            text not null check (kind in ('base','bonus')),
  points          int not null,
  correct_count   int not null default 0,
  result_version  int not null,
  created_at      timestamptz not null default now(),
  unique (question_id, user_id, kind)            -- anti double attribution
);
create index score_transactions_user on score_transactions(user_id, season_id);

-- ---------- Ligues ----------
create or replace function gen_invite_code() returns text language sql volatile as $$
  select upper(substr(md5(gen_random_uuid()::text),1,4) || '-' || substr(md5(gen_random_uuid()::text),1,4));
$$;

create table leagues (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references seasons(id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 2 and 40),
  image_url    text,
  invite_code  text not null unique default gen_invite_code(),
  created_by   uuid references profiles(id) on delete set null,
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
create index league_members_user on league_members(user_id);

-- Historique des rangs (graphique d'évolution + flèches)
create table rank_snapshots (
  id         bigserial primary key,
  season_id  uuid not null references seasons(id) on delete cascade,
  prime_id   uuid not null references primes(id) on delete cascade,
  league_id  uuid references leagues(id) on delete cascade,   -- null = classement général
  user_id    uuid not null references profiles(id) on delete cascade,
  total      int not null,
  rank       int not null
);
create unique index rank_snapshots_uniq on rank_snapshots
  (prime_id, coalesce(league_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id);

-- ---------- Badges ----------
create table badges (
  code        text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  sort_order  int not null default 0
);
create table user_badges (
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_code text not null references badges(code),
  season_id  uuid not null references seasons(id) on delete cascade,
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
  dedupe_key text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create unique index notifications_dedupe on notifications(user_id, dedupe_key) where dedupe_key is not null;
create index notifications_user on notifications(user_id, created_at desc);

-- ---------- Journal admin ----------
create table admin_logs (
  id          bigserial primary key,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz not null default now()
);
create index admin_logs_created on admin_logs(created_at desc);

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
revoke execute on function log_admin(text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

-- Journal automatique des écritures faites par un admin (auteur, date, ancienne et nouvelle valeur)
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb; id uuid;
begin
  if not is_admin() then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then n := to_jsonb(new); id := (n->>'id')::uuid;
  elsif tg_op = 'DELETE' then o := to_jsonb(old); id := (o->>'id')::uuid;
  else
    o := to_jsonb(old); n := to_jsonb(new); id := (n->>'id')::uuid;
    -- ne garder que les champs modifiés
    select jsonb_object_agg(k, o->k), jsonb_object_agg(k, n->k) into o, n
    from jsonb_object_keys(n) k where (o->k) is distinct from (n->k);
    if n is null then return new; end if;
  end if;
  if tg_table_name in ('candidate_nominations','candidate_eligible_weeks') then
    id := coalesce((n->>'candidate_id')::uuid, (o->>'candidate_id')::uuid);
  end if;
  perform log_admin(lower(tg_op), tg_table_name, id, o, n);
  return coalesce(new, old);
end $$;

-- =====================================================================
-- Règles de gestion des questions
-- =====================================================================
-- Une fois la question ouverte, barème et règle sont figés.
create or replace function questions_guard() returns trigger
language plpgsql as $$
begin
  if old.status <> 'draft' and (
       new.type is distinct from old.type or new.scoring is distinct from old.scoring
    or new.points is distinct from old.points or new.bonus_points is distinct from old.bonus_points
    or new.min_selections is distinct from old.min_selections or new.max_selections is distinct from old.max_selections
    or new.validation_criteria is distinct from old.validation_criteria
    or new.options_source is distinct from old.options_source
    or new.season_id is distinct from old.season_id or new.prime_id is distinct from old.prime_id
    or new.category is distinct from old.category) then
    raise exception 'QUESTION_FROZEN' using hint = 'Le barème et la règle sont figés après ouverture. Annule la question si besoin.';
  end if;
  if old.status in ('published','cancelled') and new.closes_at is distinct from old.closes_at then
    raise exception 'QUESTION_FROZEN';
  end if;
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'QUESTION_CANCELLED';
  end if;
  return new;
end $$;
create trigger questions_guard before update on questions for each row execute function questions_guard();

-- Options d'une question alimentées depuis les candidats (source candidates_*) ou Oui/Non
create or replace function sync_question_options(p_question uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q questions;
begin
  select * into q from questions where id = p_question;
  if q.status not in ('draft','open') then return; end if;
  if q.options_source = 'yes_no' then
    if not exists (select 1 from question_options where question_id = q.id) then
      insert into question_options(question_id, label, sort_order) values (q.id, 'Oui', 0), (q.id, 'Non', 1);
    end if;
    return;
  end if;
  if q.options_source = 'custom' then return; end if;

  insert into question_options(question_id, label, candidate_id, sort_order)
  select q.id, c.first_name, c.id, row_number() over (order by c.first_name)
  from candidates c
  where c.season_id = q.season_id
    and case q.options_source
          when 'candidates_all' then true
          when 'candidates_competing' then c.status <> 'eliminated'
          when 'candidates_nominated' then c.status = 'nominated'
        end
  on conflict do nothing;

  -- Tant que la question est en brouillon, on retire les options qui ne correspondent plus
  if q.status = 'draft' and q.options_source <> 'candidates_all' then
    delete from question_options o using candidates c
    where o.question_id = q.id and o.candidate_id = c.id
      and not case q.options_source
                when 'candidates_competing' then c.status <> 'eliminated'
                when 'candidates_nominated' then c.status = 'nominated'
              end;
  end if;
end $$;
revoke execute on function sync_question_options(uuid) from public, anon, authenticated;

-- Un nouveau candidat rejoint automatiquement les questions ouvertes « tous / en compétition »
create or replace function candidates_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare qid uuid;
begin
  for qid in select id from questions
             where season_id = new.season_id and status in ('draft','open')
               and options_source in ('candidates_all','candidates_competing') loop
    perform sync_question_options(qid);
  end loop;
  return new;
end $$;
create trigger candidates_after_insert after insert on candidates for each row execute function candidates_after_insert();

-- =====================================================================
-- RPC joueur : enregistrer une prédiction (verrouillage serveur)
-- =====================================================================
create or replace function submit_prediction(p_question uuid, p_option_ids uuid[] default '{}', p_number numeric default null)
returns user_predictions
language plpgsql security definer set search_path = public as $$
declare q questions; r user_predictions; n int := coalesce(array_length(p_option_ids,1),0);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from profiles where id = auth.uid()) then raise exception 'PROFILE_REQUIRED'; end if;
  select * into q from questions where id = p_question for share;
  if not found or q.status = 'draft' then raise exception 'QUESTION_NOT_FOUND'; end if;
  if q.status <> 'open' or now() >= q.closes_at then raise exception 'QUESTION_LOCKED'; end if;

  if q.type = 'exact_number' then
    if p_number is null then raise exception 'NUMBER_REQUIRED'; end if;
    p_option_ids := '{}';
  else
    if n < greatest(q.min_selections, 1) or n > q.max_selections then
      -- l'option « aucun » (couple) compte comme une sélection complète
      if not (n = 1 and exists (select 1 from question_options o where o.id = p_option_ids[1] and o.question_id = q.id and o.is_none_option)) then
        raise exception 'BAD_SELECTION_COUNT';
      end if;
    end if;
    if (select count(distinct x) from unnest(p_option_ids) x) <> n then raise exception 'DUPLICATE_OPTION'; end if;
    if exists (select 1 from unnest(p_option_ids) x
               where not exists (select 1 from question_options o where o.id = x and o.question_id = q.id))
      then raise exception 'INVALID_OPTION'; end if;
    if n > 1 and exists (select 1 from question_options o where o.id = any(p_option_ids) and o.is_none_option)
      then raise exception 'BAD_SELECTION_COUNT'; end if;
    -- Pas de candidat éliminé dans une question portant sur les candidats en lice
    if q.options_source in ('candidates_competing','candidates_nominated') and exists (
         select 1 from question_options o join candidates c on c.id = o.candidate_id
         where o.id = any(p_option_ids) and c.status = 'eliminated')
      then raise exception 'CANDIDATE_ELIMINATED'; end if;
    p_number := null;
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
declare hits int := 0; i int; nsel int := coalesce(array_length(sel,1),0); nres int;
begin
  base := 0; bonus := 0; correct := 0;
  if q.status = 'cancelled' or res is null or res.question_id is null then return next; return; end if;
  nres := coalesce(array_length(res.correct_option_ids,1),0);

  if q.scoring = 'exact_number' then
    if num is not null and res.number_value is not null and num = res.number_value then base := q.points; correct := 1; end if;

  elsif q.scoring = 'per_correct' then
    select count(*) into hits from unnest(sel) s where s = any(res.correct_option_ids);
    base := hits * q.points; correct := hits;
    -- Bonus : toutes les sélections correctes ET liste officielle complète trouvée
    if q.bonus_points > 0 and hits > 0 and hits = nsel and hits = nres and hits = q.max_selections then
      bonus := q.bonus_points;
    end if;

  elsif q.scoring = 'all_or_nothing' then   -- ex. le couple : paire exacte ou « aucun couple »
    if nsel > 0 and nres > 0
       and (select array_agg(x order by x) from unnest(sel) x) = (select array_agg(x order by x) from unnest(res.correct_option_ids) x)
    then base := q.points; correct := 1; end if;

  elsif q.scoring = 'ordered_positions' then
    for i in 1 .. least(nsel, nres) loop
      if sel[i] = res.correct_option_ids[i] then hits := hits + 1; end if;
    end loop;
    base := hits * q.points; correct := hits;
  end if;
  return next;
end $$;

-- Prévisualisation admin (aucune écriture)
create or replace function preview_result(p_question uuid, p_correct uuid[], p_number numeric default null)
returns table(user_id uuid, pseudo text, option_ids uuid[], number_value numeric, base int, bonus int, correct int)
language plpgsql stable security definer set search_path = public as $$
declare q questions; fake official_results;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into q from questions where id = p_question;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  fake.question_id := p_question; fake.correct_option_ids := coalesce(p_correct, '{}'); fake.number_value := p_number;
  q.status := 'published';  -- simule la publication (une question clôturée non annulée)
  return query
    select up.user_id, p.pseudo, up.option_ids, up.number_value, s.base, s.bonus, s.correct
    from user_predictions up join profiles p on p.id = up.user_id
    cross join lateral score_prediction(q, up.option_ids, up.number_value, fake) s
    where up.question_id = p_question and up.updated_at < q.closes_at;
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
  if q.status <> 'published' or res.question_id is null then return; end if;

  insert into score_transactions(season_id, prime_id, question_id, user_id, kind, points, correct_count, result_version)
  select q.season_id, q.prime_id, q.id, up.user_id, k.kind, k.pts, case when k.kind = 'base' then s.correct else 0 end, res.version
  from user_predictions up
  cross join lateral score_prediction(q, up.option_ids, up.number_value, res) s
  cross join lateral (values ('base', s.base), ('bonus', s.bonus)) as k(kind, pts)
  where up.question_id = q.id
    and up.updated_at < q.closes_at          -- réponse enregistrée avant la clôture uniquement
    and (k.kind = 'base' or k.pts > 0);
end $$;
revoke execute on function recompute_question(uuid) from public, anon, authenticated;

-- Publication / correction d'un résultat (admin)
create or replace function publish_result(p_question uuid, p_correct uuid[], p_number numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare old official_results; q questions; found_old boolean;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into q from questions where id = p_question for update;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  if q.status = 'draft' then raise exception 'QUESTION_NOT_OPENED'; end if;
  if q.status = 'cancelled' then raise exception 'QUESTION_CANCELLED'; end if;
  if now() < q.closes_at then raise exception 'QUESTION_STILL_OPEN'; end if;
  if q.type = 'exact_number' then
    if p_number is null then raise exception 'NUMBER_REQUIRED'; end if;
  else
    if coalesce(array_length(p_correct,1),0) = 0 then raise exception 'RESULT_REQUIRED'; end if;
    if exists (select 1 from unnest(p_correct) x
               where not exists (select 1 from question_options o where o.id = x and o.question_id = q.id))
      then raise exception 'INVALID_OPTION'; end if;
  end if;

  select * into old from official_results where question_id = p_question;
  found_old := found;
  insert into official_results(question_id, correct_option_ids, number_value, version, recorded_by)
  values (p_question, coalesce(p_correct,'{}'), p_number, 1, auth.uid())
  on conflict (question_id) do update
    set correct_option_ids = excluded.correct_option_ids, number_value = excluded.number_value,
        version = official_results.version + 1, recorded_by = auth.uid(), recorded_at = now();

  update questions set status = 'published' where id = p_question;
  perform recompute_question(p_question);
  perform log_admin(case when found_old then 'result.correct' else 'result.publish' end, 'question', p_question,
                    case when found_old then jsonb_build_object('correct', (select coalesce(jsonb_agg(label), '[]'::jsonb) from question_options where id = any(old.correct_option_ids)), 'number_value', old.number_value, 'version', old.version) end,
                    jsonb_build_object('correct', (select coalesce(jsonb_agg(label), '[]'::jsonb) from question_options where id = any(p_correct)), 'number_value', p_number, 'question', q.title));

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select st.user_id, 'results_published',
         case when sum(st.points) > 0 then '+' || sum(st.points) || ' pts !' else 'Résultat publié' end,
         q.title || case when found_old then ' · résultat corrigé' else '' end, '/profil',
         'result:' || p_question || ':' || coalesce(old.version, 0) + 1
  from score_transactions st join profiles p on p.id = st.user_id and p.notif_enabled
  where st.question_id = p_question group by st.user_id
  on conflict do nothing;
end $$;

create or replace function cancel_question(p_question uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  update questions set status = 'cancelled', cancelled_reason = trim(p_reason) where id = p_question;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  perform recompute_question(p_question);   -- supprime tous les points
end $$;

-- Clôture automatique (pg_cron chaque minute, ou lue à la volée via question_is_locked)
create or replace function close_due_questions() returns int
language sql security definer set search_path = public as $$
  with u as (update questions set status = 'closed' where status = 'open' and closes_at <= now() returning 1)
  select count(*)::int from u;
$$;
revoke execute on function close_due_questions() from public, anon, authenticated;

-- =====================================================================
-- RPC admin : questions et candidats
-- =====================================================================
-- Création / modification d'une question (payload jsonb depuis l'éditeur)
create or replace function admin_save_question(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare qid uuid := nullif(p->>'id','')::uuid; q questions; lbl text; i int := 0; new_status question_status;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  new_status := coalesce(p->>'status','draft')::question_status;
  if new_status not in ('draft','open') then raise exception 'BAD_STATUS'; end if;

  if qid is null then
    insert into questions(season_id, prime_id, category, key, type, title, description, icon, validation_criteria,
                          options_source, min_selections, max_selections, points, bonus_points, scoring, closes_at, status, sort_order)
    values (coalesce(nullif(p->>'season_id','')::uuid, current_season_id()), nullif(p->>'prime_id','')::uuid,
            (p->>'category')::question_category, nullif(p->>'key',''), (p->>'type')::question_type, trim(p->>'title'),
            nullif(trim(p->>'description'),''), coalesce(nullif(p->>'icon',''),'sparkles'), nullif(trim(p->>'validation_criteria'),''),
            coalesce(p->>'options_source','custom')::options_source,
            coalesce((p->>'min_selections')::int, 1), coalesce((p->>'max_selections')::int, 1),
            coalesce((p->>'points')::int, 0), coalesce((p->>'bonus_points')::int, 0),
            coalesce(p->>'scoring', case p->>'type' when 'exact_number' then 'exact_number' when 'ordered' then 'ordered_positions' else 'per_correct' end)::scoring_rule,
            (p->>'closes_at')::timestamptz, 'draft', coalesce((p->>'sort_order')::int, 0))
    returning id into qid;
  else
    select * into q from questions where id = qid;
    if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
    if q.status = 'draft' then
      update questions set
        prime_id = nullif(p->>'prime_id','')::uuid, category = coalesce((p->>'category')::question_category, category),
        type = coalesce((p->>'type')::question_type, type), title = coalesce(trim(p->>'title'), title),
        description = nullif(trim(p->>'description'),''), icon = coalesce(nullif(p->>'icon',''), icon),
        validation_criteria = nullif(trim(p->>'validation_criteria'),''),
        options_source = coalesce((p->>'options_source')::options_source, options_source),
        min_selections = coalesce((p->>'min_selections')::int, min_selections), max_selections = coalesce((p->>'max_selections')::int, max_selections),
        points = coalesce((p->>'points')::int, points), bonus_points = coalesce((p->>'bonus_points')::int, bonus_points),
        scoring = coalesce((p->>'scoring')::scoring_rule, scoring), closes_at = coalesce((p->>'closes_at')::timestamptz, closes_at)
      where id = qid;
    else
      -- après ouverture : seuls l'intitulé, la description et la clôture restent modifiables
      update questions set title = coalesce(trim(p->>'title'), title), description = nullif(trim(p->>'description'),''),
        closes_at = coalesce((p->>'closes_at')::timestamptz, closes_at)
      where id = qid;
    end if;
  end if;

  select * into q from questions where id = qid;
  if q.status = 'draft' then
    if q.options_source = 'custom' and p ? 'options' then
      delete from question_options where question_id = qid;
      for lbl in select jsonb_array_elements_text(p->'options') loop
        if trim(lbl) <> '' then
          insert into question_options(question_id, label, sort_order) values (qid, trim(lbl), i); i := i + 1;
        end if;
      end loop;
    elsif q.options_source <> 'custom' then
      if q.options_source = 'yes_no' then delete from question_options where question_id = qid and candidate_id is not null; end if;
      if q.options_source <> 'yes_no' then delete from question_options where question_id = qid and candidate_id is null and not is_none_option; end if;
      perform sync_question_options(qid);
    end if;
    if coalesce((p->>'with_none_option')::boolean, false)
       and not exists (select 1 from question_options where question_id = qid and is_none_option) then
      insert into question_options(question_id, label, is_none_option, sort_order) values (qid, 'Aucun couple confirmé', true, 999);
    end if;
  end if;

  if new_status = 'open' and q.status = 'draft' then perform open_question(qid); end if;
  return qid;
end $$;

create or replace function open_question(p_question uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q questions;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into q from questions where id = p_question for update;
  if q.status <> 'draft' then raise exception 'BAD_STATUS'; end if;
  if coalesce(trim(q.validation_criteria), '') = '' then raise exception 'CRITERIA_REQUIRED'; end if;
  if q.closes_at <= now() then raise exception 'CLOSES_IN_PAST'; end if;
  if q.type <> 'exact_number' and (select count(*) from question_options where question_id = q.id) < 2 then
    raise exception 'OPTIONS_REQUIRED';
  end if;
  update questions set status = 'open' where id = p_question;
  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select p.id, 'predictions_open', 'Nouveau prono ouvert', q.title, '/pronos/' || q.id, 'open:' || q.id
  from profiles p where p.notif_enabled
  on conflict do nothing;
end $$;

-- Candidats : statut, nomination de la semaine, élimination, tournée
create or replace function admin_set_candidate_status(p_candidate uuid, p_status candidate_status, p_prime uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare c candidates; pr uuid;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into c from candidates where id = p_candidate for update;
  if not found then raise exception 'CANDIDATE_NOT_FOUND'; end if;
  pr := coalesce(p_prime, current_prime_id(c.season_id));

  update candidates set status = p_status,
    eliminated_at       = case when p_status = 'eliminated' then coalesce(c.eliminated_at, now()) else null end,
    eliminated_prime_id = case when p_status = 'eliminated' then coalesce(c.eliminated_prime_id, pr) else null end
  where id = p_candidate;

  if p_status = 'nominated' and pr is not null then
    insert into candidate_nominations(candidate_id, prime_id) values (p_candidate, pr) on conflict do nothing;
  elsif c.status = 'nominated' and p_status in ('competing','immune') and pr is not null then
    delete from candidate_nominations where candidate_id = p_candidate and prime_id = pr;
  end if;
end $$;

create or replace function admin_set_tour(p_candidate uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  update candidates set on_tour = p_on where id = p_candidate;
end $$;

-- Prime « en cours » : le premier prime non encore clôturé (semaine en cours), sinon le dernier
create or replace function current_prime_id(p_season uuid default null) returns uuid
language sql stable security definer set search_path = public as $$
  select id from (
    select id, number, 0 as pri from primes where season_id = coalesce(p_season, current_season_id()) and closed_at is null
    union all
    select id, number, 1 from primes where season_id = coalesce(p_season, current_season_id())
  ) x order by pri, case when pri = 0 then number else -number end limit 1;
$$;

-- Aides au calcul « plus / moins nommé » (proposition à valider par l'admin)
create or replace view v_candidate_nomination_counts with (security_invoker = true) as
select c.id as candidate_id, c.season_id, c.first_name, c.status,
       (select count(*) from candidate_nominations n where n.candidate_id = c.id)::int as nominations,
       (select count(*) from candidate_eligible_weeks e where e.candidate_id = c.id)::int as eligible_weeks
from candidates c;

-- Grands pronos par défaut (barème initial, modifiable tant qu'ils sont en brouillon)
create or replace function admin_create_grand_questions(p_season uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare s seasons; n int := 0; qid uuid; r record;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into s from seasons where id = coalesce(p_season, current_season_id());
  if not found then raise exception 'SEASON_NOT_FOUND'; end if;
  for r in select * from (values
    ('winner',        1, 'Le grand gagnant', 'Le candidat qui remporte la saison. Points attribués à la finale.', 'crown', 100, 0, 1, 1, 'per_correct', 'candidates_all', 'Le candidat désigné vainqueur lors de la grande finale.'),
    ('finalists',     2, 'Les ' || s.finalists_count || ' finalistes', '30 pts par finaliste trouvé. L''ordre ne compte pas.', 'star', 30, 0, s.finalists_count, s.finalists_count, 'per_correct', 'candidates_all', 'Les candidats officiellement qualifiés pour la grande finale. Un point par finaliste trouvé, l''ordre ne compte pas.'),
    ('tour',          3, 'Les ' || s.tour_count || ' de la tournée', '20 pts par candidat trouvé, +50 si tu les trouves tous.', 'ticket', 20, 50, s.tour_count, s.tour_count, 'per_correct', 'candidates_all', 'La liste officielle des candidats participant à la tournée. Bonus uniquement si toute la liste est trouvée.'),
    ('first_out',     4, 'Le premier éliminé', 'Le premier candidat éliminé après la clôture des grands pronos.', 'flame', 50, 0, 1, 1, 'per_correct', 'candidates_all', 'Le premier candidat éliminé lors d''un prime après la clôture des grands pronos.'),
    ('most_nominated',5, 'Le plus nommé', 'Nombre de semaines nommé. En cas d''égalité, tous comptent.', 'repeat', 60, 0, 1, 1, 'per_correct', 'candidates_all', 'Le candidat ayant connu le plus de semaines de nomination (une semaine = une nomination). Égalités acceptées.'),
    ('least_nominated',6,'Le moins nommé', 'Parmi les candidats éligibles au moins ' || s.least_nominated_min_weeks || ' semaines.', 'shield-check', 40, 0, 1, 1, 'per_correct', 'candidates_all', 'Le candidat éligible au moins ' || s.least_nominated_min_weeks || ' semaines ayant connu le moins de nominations. Égalités acceptées.'),
    ('first_finalist',7, 'Le premier qualifié pour la finale', 'Le premier candidat officiellement qualifié.', 'flag', 40, 0, 1, 1, 'per_correct', 'candidates_all', 'Le premier candidat annoncé officiellement comme qualifié pour la finale.'),
    ('last_out',      8, 'Le dernier éliminé avant la finale', 'Le dernier candidat éliminé avant la grande finale.', 'door-open', 40, 0, 1, 1, 'per_correct', 'candidates_all', 'Le dernier candidat éliminé lors d''un prime précédant la grande finale.'),
    ('couple',        9, 'Le couple de la saison', 'Validé uniquement si le couple est rendu public par les intéressés.', 'heart', 30, 0, 2, 2, 'all_or_nothing', 'candidates_all', 'Un couple rendu public ou confirmé par les deux personnes concernées. Aucune rumeur ni séquence télévisée ne compte.')
  ) as t(key, ord, title, descr, icon, pts, bonus, mins, maxs, scoring, src, crit) loop
    if not exists (select 1 from questions where season_id = s.id and key = r.key) then
      insert into questions(season_id, category, key, type, title, description, icon, validation_criteria, options_source,
                            min_selections, max_selections, points, bonus_points, scoring, closes_at, status, sort_order)
      values (s.id, 'grand', r.key, case when r.maxs > 1 then 'multiple' else 'single' end::question_type, r.title, r.descr, r.icon, r.crit,
              r.src::options_source, r.mins, r.maxs, r.pts, r.bonus, r.scoring::scoring_rule, s.grand_predictions_close_at, 'draft', r.ord)
      returning id into qid;
      perform sync_question_options(qid);
      if r.key = 'couple' then
        insert into question_options(question_id, label, is_none_option, sort_order) values (qid, 'Aucun couple confirmé', true, 999);
      end if;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- =====================================================================
-- Ligues
-- =====================================================================
create or replace function join_league(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare l leagues;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into l from leagues where invite_code = upper(trim(p_code));
  if not found then raise exception 'INVALID_CODE'; end if;
  insert into league_members(league_id, user_id, is_primary)
  values (l.id, auth.uid(), not exists (select 1 from league_members where user_id = auth.uid() and is_primary))
  on conflict do nothing;
  return l.id;
end $$;

create or replace function create_league(p_name text) returns leagues
language plpgsql security definer set search_path = public as $$
declare l leagues;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if current_season_id() is null then raise exception 'NO_SEASON'; end if;
  insert into leagues(season_id, name, created_by)
  values (current_season_id(), trim(p_name), auth.uid()) returning * into l;
  insert into league_members(league_id, user_id, role, is_primary)
  values (l.id, auth.uid(), 'owner', not exists (select 1 from league_members where user_id = auth.uid() and is_primary));
  return l;
end $$;

create or replace function set_primary_league(p_league uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from league_members where league_id = p_league and user_id = auth.uid()) then
    raise exception 'NOT_A_MEMBER';
  end if;
  update league_members set is_primary = (league_id = p_league) where user_id = auth.uid();
end $$;

create or replace function regenerate_invite_code(p_league uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text := gen_invite_code();
begin
  if not (is_admin() or exists (select 1 from league_members where league_id = p_league and user_id = auth.uid() and role in ('owner','admin'))) then
    raise exception 'FORBIDDEN';
  end if;
  update leagues set invite_code = c where id = p_league;
  return c;
end $$;

-- Gestion des membres (admin de ligue) : promotion / rétrogradation, jamais les scores
create or replace function set_league_member_role(p_league uuid, p_user uuid, p_role league_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from league_members where league_id = p_league and user_id = auth.uid() and role = 'owner') then
    raise exception 'FORBIDDEN';
  end if;
  if p_role = 'owner' or p_user = auth.uid() then raise exception 'FORBIDDEN'; end if;
  update league_members set role = p_role where league_id = p_league and user_id = p_user;
end $$;

-- =====================================================================
-- Vues de classement (égalité = même rang via RANK())
-- =====================================================================
create or replace view v_season_scores with (security_invoker = true) as
select pr.id as user_id, pr.pseudo, pr.avatar_url, se.id as season_id,
       coalesce((select sum(st.points) from score_transactions st where st.user_id = pr.id and st.season_id = se.id), 0)::int as total,
       coalesce((select count(*) from score_transactions st where st.user_id = pr.id and st.season_id = se.id and st.kind = 'base' and st.points > 0), 0)::int as correct_answers,
       coalesce((select count(*) from score_transactions st where st.user_id = pr.id and st.season_id = se.id and st.kind = 'base'), 0)::int as scored_answers
from profiles pr cross join seasons se;

create or replace function is_season_participant(p_user uuid, p_season uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from league_members lm join leagues l on l.id = lm.league_id where lm.user_id = p_user and l.season_id = p_season)
      or exists (select 1 from user_predictions up join questions q on q.id = up.question_id where up.user_id = p_user and q.season_id = p_season);
$$;

create or replace view v_general_leaderboard with (security_invoker = true) as
select s.*, rank() over (partition by s.season_id order by s.total desc)::int as rank,
       (select rs.rank from rank_snapshots rs join primes p on p.id = rs.prime_id
         where rs.user_id = s.user_id and rs.season_id = s.season_id and rs.league_id is null
         order by p.number desc limit 1) as prev_rank
from v_season_scores s
-- participants de la saison : membres d'une ligue de la saison ou auteurs d'au moins un prono
-- (fonction definer : le filtre doit être le même pour tous, sinon les rangs varieraient selon le lecteur)
where is_season_participant(s.user_id, s.season_id);

create or replace view v_prime_scores with (security_invoker = true) as
select st.user_id, st.prime_id, st.season_id, sum(st.points)::int as points,
       count(*) filter (where st.kind = 'base' and st.points > 0)::int as correct_answers,
       rank() over (partition by st.prime_id order by sum(st.points) desc)::int as rank
from score_transactions st where st.prime_id is not null
group by st.user_id, st.prime_id, st.season_id;

-- security_invoker : un joueur ne voit que les ligues dont il est membre (RLS league_members)
create or replace view v_league_leaderboard with (security_invoker = true) as
select lm.league_id, l.season_id, lm.user_id, p.pseudo, p.avatar_url, lm.role,
       coalesce(ss.total,0) as total, coalesce(ss.correct_answers,0) as correct_answers,
       rank() over (partition by lm.league_id order by coalesce(ss.total,0) desc)::int as rank,
       (select rs.rank from rank_snapshots rs join primes pp on pp.id = rs.prime_id
         where rs.user_id = lm.user_id and rs.league_id = lm.league_id order by pp.number desc limit 1) as prev_rank
from league_members lm join leagues l on l.id = lm.league_id
join profiles p on p.id = lm.user_id
left join v_season_scores ss on ss.user_id = lm.user_id and ss.season_id = l.season_id;

-- Statistiques communautaires : uniquement pour les questions verrouillées.
-- Vue « definer » volontaire : agrège les réponses de tous, mais seulement après la clôture.
create or replace view v_candidate_pick_stats as
select q.id as question_id, q.season_id, q.key, q.title, q.category, q.prime_id, o.candidate_id,
       round(100.0 * count(up.*) filter (where o.id = any(up.option_ids)) / nullif(count(up.*),0))::int as pct,
       count(up.*)::int as answers
from questions q
join question_options o on o.question_id = q.id and o.candidate_id is not null
left join user_predictions up on up.question_id = q.id
where q.status in ('closed','published') or (q.status = 'open' and now() >= q.closes_at)
group by q.id, o.candidate_id;

-- Nombre de réponses par question (pour l'admin et « 7 / 8 joueurs ont répondu »), sans révéler les choix
create or replace view v_question_answer_counts as
select q.id as question_id, count(up.*)::int as answers
from questions q left join user_predictions up on up.question_id = q.id
where q.status <> 'draft' or is_admin()
group by q.id;

-- Phase de la saison, calculée côté serveur (jamais stockée à la main)
create or replace view v_seasons as
select s.*,
  case
    when exists (select 1 from questions q where q.season_id = s.id and q.key = 'winner' and q.status = 'published') then 'finished'
    -- grands pronos ouverts (candidats révélés) et pas encore clôturés
    when exists (select 1 from questions q where q.season_id = s.id and q.category = 'grand' and q.status = 'open')
         and now() < s.grand_predictions_close_at then 'open'
    when now() < s.first_prime_at then 'pre'
    else 'running'
  end as phase,
  now() as server_now
from seasons s;

-- =====================================================================
-- Semaine, badges, notifications
-- =====================================================================
create or replace function snapshot_ranks(p_prime uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s uuid := (select season_id from primes where id = p_prime);
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  delete from rank_snapshots where prime_id = p_prime;
  insert into rank_snapshots(season_id, prime_id, league_id, user_id, total, rank)
  select s, p_prime, null, user_id, total, rank() over (order by total desc)
  from v_season_scores where season_id = s and is_season_participant(user_id, s);
  insert into rank_snapshots(season_id, prime_id, league_id, user_id, total, rank)
  select s, p_prime, lm.league_id, lm.user_id, coalesce(ss.total, 0),
         rank() over (partition by lm.league_id order by coalesce(ss.total,0) desc)
  from league_members lm join leagues l on l.id = lm.league_id and l.season_id = s
  left join v_season_scores ss on ss.user_id = lm.user_id and ss.season_id = s;
end $$;

create or replace function grant_badge(p_user uuid, p_code text, p_season uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b badges;
begin
  insert into user_badges(user_id, badge_code, season_id) values (p_user, p_code, p_season) on conflict do nothing;
  if found then
    select * into b from badges where code = p_code;
    insert into notifications(user_id, kind, title, body, link, dedupe_key)
    select p_user, 'badge_earned', 'Nouveau badge : ' || b.name, b.description, '/profil', 'badge:' || p_code || ':' || p_season
    from profiles where id = p_user and notif_enabled
    on conflict do nothing;
  end if;
end $$;
revoke execute on function grant_badge(uuid, text, uuid) from public, anon, authenticated;

create or replace function award_badges(p_season uuid) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; before int; finale uuid;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select count(*) into before from user_badges where season_id = p_season;

  -- Le Visionnaire : a trouvé le vainqueur
  for r in select st.user_id from score_transactions st join questions q on q.id = st.question_id
           where q.season_id = p_season and q.key = 'winner' and st.kind = 'base' and st.points > 0 loop
    perform grant_badge(r.user_id, 'visionnaire', p_season); end loop;
  -- Le Tour Manager : bonus de la tournée parfaite
  for r in select st.user_id from score_transactions st join questions q on q.id = st.question_id
           where q.season_id = p_season and q.key = 'tour' and st.kind = 'bonus' and st.points > 0 loop
    perform grant_badge(r.user_id, 'tour_manager', p_season); end loop;
  -- Madame Irma : 3 questions publiées consécutives (ordre de clôture) avec des points
  for r in
    with answered as (
      select up.user_id, q.closes_at, q.id,
             coalesce((select sum(points) from score_transactions st where st.question_id = q.id and st.user_id = up.user_id), 0) > 0 as ok
      from user_predictions up join questions q on q.id = up.question_id
      where q.season_id = p_season and q.status = 'published'),
    runs as (
      select user_id, ok, row_number() over (partition by user_id order by closes_at, id)
             - row_number() over (partition by user_id, ok order by closes_at, id) as grp
      from answered)
    select distinct user_id from runs where ok group by user_id, grp having count(*) >= 3 loop
    perform grant_badge(r.user_id, 'madame_irma', p_season); end loop;
  -- Le Spécialiste : ≥ 80 % sur un prime d'au moins 5 questions publiées
  for r in
    select up.user_id from user_predictions up join questions q on q.id = up.question_id
    where q.season_id = p_season and q.status = 'published' and q.prime_id is not null
      and (select count(*) from questions q2 where q2.prime_id = q.prime_id and q2.status = 'published') >= 5
    group by up.user_id, q.prime_id
    having count(*) >= 5 and
      count(*) filter (where exists (select 1 from score_transactions st where st.question_id = q.id and st.user_id = up.user_id and st.kind='base' and st.points > 0))
      >= 0.8 * (select count(*) from questions q2 where q2.prime_id = q.prime_id and q2.status = 'published') loop
    perform grant_badge(r.user_id, 'specialiste', p_season); end loop;
  -- Le Comeback : +3 places dans une ligue entre deux primes consécutifs
  for r in
    select distinct a.user_id from rank_snapshots a
    join primes pa on pa.id = a.prime_id
    join rank_snapshots b on b.user_id = a.user_id and b.league_id = a.league_id
    join primes pb on pb.id = b.prime_id and pb.season_id = pa.season_id and pb.number = pa.number - 1
    where a.season_id = p_season and a.league_id is not null and b.rank - a.rank >= 3 loop
    perform grant_badge(r.user_id, 'comeback', p_season); end loop;
  -- Le Fidèle : pronos sur au moins 5 primes distincts
  for r in select up.user_id from user_predictions up join questions q on q.id = up.question_id
           where q.season_id = p_season and q.prime_id is not null
           group by up.user_id having count(distinct q.prime_id) >= 5 loop
    perform grant_badge(r.user_id, 'fidele', p_season); end loop;
  -- Le Champion : premier d'une ligue au snapshot de la finale
  select id into finale from primes where season_id = p_season and is_final and closed_at is not null;
  if finale is not null then
    for r in select distinct user_id from rank_snapshots where prime_id = finale and league_id is not null and rank = 1 loop
      perform grant_badge(r.user_id, 'champion', p_season); end loop;
  end if;

  select count(*) - before into n from user_badges where season_id = p_season;
  return n;
end $$;

-- « Clôturer la semaine » : snapshot des rangs, badges, notifications de progression
create or replace function close_prime(p_prime uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p primes;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into p from primes where id = p_prime for update;
  if not found then raise exception 'PRIME_NOT_FOUND'; end if;
  if exists (select 1 from questions where prime_id = p_prime and status in ('open','closed')) then
    raise exception 'RESULTS_PENDING';
  end if;
  perform snapshot_ranks(p_prime);
  update primes set closed_at = coalesce(closed_at, now()) where id = p_prime;
  perform award_badges(p.season_id);
  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select a.user_id, 'rank_jump', 'Tu remontes',
         'Tu passes ' || a.rank || case when a.rank = 1 then 'er' else 'e' end || ' de ' || l.name || '.', '/ligues/' || l.id,
         'jump:' || a.league_id || ':' || p_prime
  from rank_snapshots a
  join leagues l on l.id = a.league_id
  join profiles pr on pr.id = a.user_id and pr.notif_enabled
  join rank_snapshots b on b.user_id = a.user_id and b.league_id = a.league_id
  join primes pb on pb.id = b.prime_id and pb.season_id = p.season_id and pb.number = p.number - 1
  where a.prime_id = p_prime and b.rank - a.rank >= 2
  on conflict do nothing;
  perform log_admin('prime.close', 'prime', p_prime, null, jsonb_build_object('number', p.number));
end $$;

-- Rappels « clôture dans 2 h » (Edge Function planifiée, clé service)
create or replace function notify_deadlines(p_within interval default interval '2 hours') returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select p.id, 'deadline_soon', 'Clôture bientôt',
         '« ' || q.title || ' » ferme à ' || to_char(q.closes_at at time zone 'Europe/Paris', 'HH24"h"MI') || '.',
         '/pronos/' || q.id, 'deadline:' || q.id
  from questions q cross join profiles p
  where q.status = 'open' and q.closes_at > now() and q.closes_at <= now() + p_within and p.notif_enabled
    and not exists (select 1 from user_predictions up where up.question_id = q.id and up.user_id = p.id)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function notify_deadlines(interval) from public, anon, authenticated;

create or replace function mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

-- RGPD : export et suppression de son compte
create or replace function export_my_data() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profil', (select to_jsonb(p) from profiles p where id = auth.uid()),
    'pronostics', (select coalesce(jsonb_agg(jsonb_build_object('question', q.title, 'reponses',
        (select jsonb_agg(o.label) from question_options o where o.id = any(up.option_ids)), 'nombre', up.number_value,
        'enregistre_le', up.updated_at)), '[]') from user_predictions up join questions q on q.id = up.question_id where up.user_id = auth.uid()),
    'points', (select coalesce(jsonb_agg(jsonb_build_object('question', q.title, 'points', st.points, 'type', st.kind)), '[]')
               from score_transactions st join questions q on q.id = st.question_id where st.user_id = auth.uid()),
    'ligues', (select coalesce(jsonb_agg(jsonb_build_object('ligue', l.name, 'role', lm.role, 'depuis', lm.joined_at)), '[]')
               from league_members lm join leagues l on l.id = lm.league_id where lm.user_id = auth.uid()),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('badge', badge_code, 'le', earned_at)), '[]') from user_badges where user_id = auth.uid()),
    'exporte_le', now());
$$;

create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- =====================================================================
-- Triggers d'audit (journal admin)
-- =====================================================================
create trigger audit_seasons    after insert or update or delete on seasons    for each row execute function audit_row();
create trigger audit_primes     after insert or update or delete on primes     for each row execute function audit_row();
create trigger audit_candidates after insert or update or delete on candidates for each row execute function audit_row();
create trigger audit_nominations after insert or delete on candidate_nominations for each row execute function audit_row();
create trigger audit_questions  after insert or update or delete on questions  for each row execute function audit_row();
create trigger audit_leagues    after update or delete on leagues for each row execute function audit_row();

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
  with check (id = auth.uid() and role = (select p.role from profiles p where p.id = auth.uid()));
create policy profiles_admin  on profiles for update using (is_admin()) with check (is_admin());

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

-- Points et historique des rangs : lecture seule ; écriture uniquement via les fonctions
create policy scores_read on score_transactions for select using (auth.role() = 'authenticated');

-- Ligues : visibles par leurs membres (et l'admin global pour la modération)
create or replace function is_league_member(p_league uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from league_members where league_id = p_league and user_id = auth.uid());
$$;
create or replace function is_league_manager(p_league uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from league_members where league_id = p_league and user_id = auth.uid() and role in ('owner','admin'));
$$;
create policy ranks_read on rank_snapshots for select using (
  auth.role() = 'authenticated' and (league_id is null or is_admin() or is_league_member(league_id)));
create policy leagues_read   on leagues for select using (is_admin() or is_league_member(leagues.id));
create policy leagues_update on leagues for update using (is_league_manager(leagues.id) or is_admin());
create policy leagues_delete on leagues for delete using (is_admin() or exists (
  select 1 from league_members m where m.league_id = leagues.id and m.user_id = auth.uid() and m.role = 'owner'));
create policy members_read   on league_members for select using (is_admin() or is_league_member(league_members.league_id));
-- Quitter une ligue, ou retirer un membre (admin de ligue) — jamais le propriétaire
create policy members_manage on league_members for delete using (
  role <> 'owner' and (user_id = auth.uid() or is_league_manager(league_members.league_id) or is_admin()));

create policy user_badges_read on user_badges for select using (auth.role() = 'authenticated');
create policy notifs_own on notifications for select using (user_id = auth.uid());
create policy notifs_mark_read on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy logs_admin on admin_logs for select using (is_admin());

-- Colonnes modifiables d'un profil par son propriétaire
revoke update on profiles from anon, authenticated;
grant update (pseudo, avatar_url, notif_enabled) on profiles to authenticated;
grant update (role) on profiles to authenticated;  -- contrôlé par profiles_admin / profiles_update
revoke update on leagues from anon, authenticated;
grant update (name, image_url) on leagues to authenticated;
revoke update on notifications from anon, authenticated;
grant update (read_at) on notifications to authenticated;

-- Droits d'exécution des fonctions
revoke execute on all functions in schema public from public, anon;
grant execute on function
  is_admin(), current_season_id(), current_prime_id(uuid), question_is_locked(questions),
  submit_prediction(uuid, uuid[], numeric), join_league(text), create_league(text), set_primary_league(uuid),
  regenerate_invite_code(uuid), set_league_member_role(uuid, uuid, league_role),
  mark_notifications_read(), export_my_data(), delete_my_account(),
  preview_result(uuid, uuid[], numeric), publish_result(uuid, uuid[], numeric), cancel_question(uuid, text),
  open_question(uuid), admin_save_question(jsonb), admin_set_candidate_status(uuid, candidate_status, uuid),
  admin_set_tour(uuid, boolean), admin_create_grand_questions(uuid), snapshot_ranks(uuid), award_badges(uuid), close_prime(uuid),
  is_league_member(uuid), is_league_manager(uuid), is_season_participant(uuid, uuid), score_prediction(questions, uuid[], numeric, official_results)
to authenticated;   -- les fonctions admin contrôlent is_admin() en interne
grant execute on function is_admin(), current_season_id(), question_is_locked(questions) to anon;
revoke execute on function recompute_question(uuid), close_due_questions(), notify_deadlines(interval),
  grant_badge(uuid, text, uuid), sync_question_options(uuid), log_admin(text, text, uuid, jsonb, jsonb) from authenticated;
grant execute on function close_due_questions(), notify_deadlines(interval) to service_role;

grant select on v_season_scores, v_general_leaderboard, v_prime_scores, v_league_leaderboard,
  v_candidate_pick_stats, v_question_answer_counts, v_seasons, v_candidate_nomination_counts to authenticated;
grant select on v_seasons to anon;
revoke all on v_season_scores, v_general_leaderboard, v_prime_scores, v_league_leaderboard,
  v_candidate_pick_stats, v_question_answer_counts, v_candidate_nomination_counts from anon;

-- =====================================================================
-- Seeds de référence
-- =====================================================================
insert into badges(code, name, description, icon, sort_order) values
 ('visionnaire','Le Visionnaire','Avoir trouvé le vainqueur de la saison.','eye',1),
 ('tour_manager','Le Tour Manager','Avoir trouvé tous les participants à la tournée.','ticket',2),
 ('madame_irma','Madame Irma','Trois pronostics corrects consécutifs.','sparkles',3),
 ('specialiste','Le Spécialiste','Au moins 80 % de bonnes réponses sur un prime d’au moins 5 questions.','target',4),
 ('comeback','Le Comeback','Gagner au moins 3 places dans son classement de ligue en une semaine.','trending-up',5),
 ('fidele','Le Fidèle','Avoir participé aux pronostics 5 semaines différentes.','calendar-check',6),
 ('champion','Le Champion','Terminer premier d’une ligue à la fin de la saison.','crown',7);
