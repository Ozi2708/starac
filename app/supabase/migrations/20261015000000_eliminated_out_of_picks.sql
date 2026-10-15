-- Un élève éliminé (ou parti de lui-même) ne peut plus être choisi dans aucun prono ouvert,
-- y compris les grands pronos « tous les candidats » (vainqueur, tournée, premier éliminé…).
-- Les réponses déjà enregistrées sont conservées : le joueur est prévenu et doit les remplacer.

create or replace function public.submit_prediction(p_question uuid, p_option_ids uuid[] default '{}', p_number numeric default null)
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
    -- Pas de candidat éliminé, quelle que soit la source des options
    if exists (
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

-- Quand un élève quitte l'aventure, les joueurs qui l'avaient choisi dans un prono encore ouvert sont prévenus.
create or replace function public.notify_eliminated_picks() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'eliminated' and old.status is distinct from 'eliminated' then
    insert into notifications(user_id, kind, title, body, link, dedupe_key)
    select up.user_id, 'predictions_open', new.first_name || ' a quitté l''aventure',
           'Remplace ton choix dans « ' || q.title || ' » avant sa clôture.', '/pronos/' || q.id,
           'out:' || q.id || ':' || new.id
    from user_predictions up
    join questions q on q.id = up.question_id
    join profiles p on p.id = up.user_id and p.notif_enabled
    where q.status = 'open' and q.closes_at > now()
      and exists (select 1 from question_options o where o.id = any(up.option_ids) and o.candidate_id = new.id)
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists candidates_notify_eliminated_picks on candidates;
create trigger candidates_notify_eliminated_picks after update of status on candidates
  for each row execute function public.notify_eliminated_picks();
