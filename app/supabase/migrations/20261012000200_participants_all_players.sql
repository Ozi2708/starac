-- Tout joueur inscrit apparaît dans le classement général (« Tous les joueurs »), même sans ligue ni prono.
-- Les comptes admin (dont la Régie technique) n'y figurent que s'ils jouent réellement (ligue ou prono).
create or replace function is_season_participant(p_user uuid, p_season uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = p_user and p.role = 'player')
      or exists (select 1 from league_members lm join leagues l on l.id = lm.league_id where lm.user_id = p_user and l.season_id = p_season)
      or exists (select 1 from user_predictions up join questions q on q.id = up.question_id where up.user_id = p_user and q.season_id = p_season);
$$;
