-- Mémoire de la régie automatique : chaque fait officiel collecté (source, date), lisible par l'admin uniquement.
create table season_facts (
  id          bigserial primary key,
  season_id   uuid not null references seasons(id) on delete cascade,
  prime_id    uuid references primes(id) on delete set null,
  kind        text not null,            -- candidates, nominations, top3_battle, evaluations, immunity, elimination, saved_by_students, advantage, tour, finalists, winner, couple, schedule, other
  fact        jsonb not null,           -- données structurées (noms, rangs…)
  summary     text not null,            -- phrase lisible
  source_urls text[] not null default '{}',
  confidence  text not null default 'high' check (confidence in ('high','medium','low')),
  applied     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index season_facts_season on season_facts(season_id, created_at desc);
alter table season_facts enable row level security;
create policy facts_admin on season_facts for all using (is_admin()) with check (is_admin());
revoke all on season_facts from anon;

-- Compte technique « Régie » (admin, sans connexion possible) qui signe les actions automatiques dans le journal.
-- Les tâches planifiées agissent en son nom : select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000c1a0","role":"authenticated"}', false);
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'encrypted_password') then
    execute $u$insert into auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
      values ('00000000-0000-4000-8000-00000000c1a0', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'regie@legrandprono.invalid', '', '{"provider":"email","providers":[]}', '{}', now(), now(), '', '', '', '')
      on conflict do nothing$u$;
  else
    insert into auth.users (id, email) values ('00000000-0000-4000-8000-00000000c1a0', 'regie@legrandprono.invalid') on conflict do nothing;
  end if;
end $$;
insert into profiles (id, pseudo, role, notif_enabled) values ('00000000-0000-4000-8000-00000000c1a0', 'Régie', 'admin', false) on conflict do nothing;
