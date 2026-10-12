-- Une nomination est un fait historique une fois le prime diffusé : remettre un nommé sauvé « en lice »
-- ne doit plus effacer sa nomination (sinon « Le plus / moins nommé » seraient faux).
-- Le retrait reste possible avant la diffusion du prime, pour corriger une erreur de saisie.
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
  elsif c.status = 'nominated' and p_status in ('competing','immune') and pr is not null
        and exists (select 1 from primes where id = pr and now() < airs_at) then
    delete from candidate_nominations where candidate_id = p_candidate and prime_id = pr;
  end if;
end $$;
