-- Suivi de l'installation de l'app (icône sur l'écran d'accueil).
-- Une ligne par joueur : installation signalée par le navigateur (Android) et ouvertures en mode installé.
create table if not exists public.app_installs (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  platform       text check (platform in ('ios', 'android')),
  installed_at   timestamptz not null default now(),
  first_open_at  timestamptz,
  last_open_at   timestamptz,
  opens          int not null default 0
);

alter table public.app_installs enable row level security;
create policy app_installs_read on public.app_installs for select using (user_id = auth.uid() or is_admin());
revoke insert, update, delete on public.app_installs from anon, authenticated;

-- p_event : 'open' (app ouverte depuis l'écran d'accueil) ou 'install' (installation confirmée par Chrome)
create or replace function public.track_app(p_event text, p_platform text default null)
returns void language plpgsql security definer set search_path = public as $$
declare opened boolean := p_event = 'open';
begin
  if auth.uid() is null or not exists (select 1 from profiles where id = auth.uid()) then return; end if;
  if p_event not in ('open', 'install') then raise exception 'BAD_EVENT'; end if;
  insert into app_installs(user_id, platform, first_open_at, last_open_at, opens)
  values (auth.uid(), case when p_platform in ('ios', 'android') then p_platform end,
          case when opened then now() end, case when opened then now() end, case when opened then 1 else 0 end)
  on conflict (user_id) do update set
    platform      = coalesce(excluded.platform, app_installs.platform),
    first_open_at = coalesce(app_installs.first_open_at, excluded.first_open_at),
    last_open_at  = coalesce(excluded.last_open_at, app_installs.last_open_at),
    opens         = app_installs.opens + excluded.opens;
end $$;

revoke execute on function public.track_app(text, text) from anon;
grant execute on function public.track_app(text, text) to authenticated;
