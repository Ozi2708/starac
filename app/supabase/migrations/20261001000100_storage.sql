-- Buckets Supabase Storage : avatars des joueurs, photos des candidats, images de ligue.
-- Ignoré si le schéma storage n'existe pas (Postgres nu des tests locaux).
do $mig$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'storage absent : migration ignorée';
    return;
  end if;

  insert into storage.buckets (id, name, public) values
    ('avatars', 'avatars', true), ('candidates', 'candidates', true), ('leagues', 'leagues', true)
  on conflict (id) do nothing;

  -- Avatars : chacun écrit dans son dossier <uid>/…
  execute $p$create policy avatars_read on storage.objects for select using (bucket_id = 'avatars')$p$;
  execute $p$create policy avatars_write on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute $p$create policy avatars_update on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;

  -- Photos des candidats : admin uniquement
  execute $p$create policy candidates_read on storage.objects for select using (bucket_id = 'candidates')$p$;
  execute $p$create policy candidates_write on storage.objects for all to authenticated
    using (bucket_id = 'candidates' and public.is_admin()) with check (bucket_id = 'candidates' and public.is_admin())$p$;

  -- Images de ligue : gestionnaires de la ligue (dossier <league_id>/…)
  execute $p$create policy leagues_img_read on storage.objects for select using (bucket_id = 'leagues')$p$;
  execute $p$create policy leagues_img_write on storage.objects for insert to authenticated
    with check (bucket_id = 'leagues' and public.is_league_manager(((storage.foldername(name))[1])::uuid))$p$;
end
$mig$;

-- Clôture automatique chaque minute et rappels de clôture (si pg_cron est activé sur le projet)
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('gp-close-due-questions', '* * * * *', 'select public.close_due_questions()');
    perform cron.schedule('gp-deadline-reminders', '*/10 * * * *', 'select public.notify_deadlines()');
  end if;
end
$cron$;
