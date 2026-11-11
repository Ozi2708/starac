-- Les questions d'un prime (hors grands pronos) clôturent au plus tard 35 min après le début réel du prime.
-- Protège contre une clôture « samedi 21h45 » quand le prime est avancé (ex. vendredi 6/11, rugby).
-- (Appliquée en production le 01/11/2026.)
create or replace function public.questions_deadline_clamp()
returns trigger language plpgsql set search_path to 'public' as $$
declare a timestamptz;
begin
  if new.prime_id is null or new.category = 'grand' or new.status not in ('draft','open') or new.closes_at is null then
    return new;
  end if;
  select airs_at into a from primes where id = new.prime_id;
  if a is not null and new.closes_at > a + interval '35 minutes' and new.closes_at < a + interval '2 days' then
    new.closes_at := a + interval '35 minutes';
  end if;
  return new;
end $$;

create trigger questions_deadline_clamp
before insert or update of closes_at, prime_id, status on public.questions
for each row execute function public.questions_deadline_clamp();

-- Si la date d'un prime change, les questions ouvertes/brouillons calées sur l'ancienne heure suivent.
create or replace function public.primes_shift_deadlines()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.airs_at is distinct from old.airs_at then
    update questions set closes_at = new.airs_at + interval '35 minutes'
    where prime_id = new.id and category <> 'grand' and status in ('draft','open')
      and closes_at between old.airs_at and old.airs_at + interval '2 days';
  end if;
  return new;
end $$;

create trigger primes_shift_deadlines
after update of airs_at on public.primes
for each row execute function public.primes_shift_deadlines();
