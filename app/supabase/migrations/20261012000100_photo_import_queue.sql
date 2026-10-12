-- File d'attente des photos officielles à importer dans le bucket « candidates »
-- (prévue pour une Edge Function d'import ; RLS sans policy : invisible pour anon/authenticated).
create extension if not exists pg_net;

create table if not exists photo_import_queue (
  id bigserial primary key,
  candidate_id uuid not null references candidates(id) on delete cascade,
  ext text not null default 'webp',
  data text,
  status text not null default 'pending' check (status in ('pending','done','error')),
  url text,
  error text,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
alter table photo_import_queue enable row level security;
revoke all on photo_import_queue from anon, authenticated;
