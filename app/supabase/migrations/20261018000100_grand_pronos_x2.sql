-- Saison 2026 : les grands pronos comptent double (décision de Val du 18/10, avant toute publication),
-- pour équilibrer à peu près 50/50 avec les paris de la semaine. Le barème étant figé après ouverture,
-- le garde-fou est suspendu le temps de cette mise à jour. Idempotent : ne touche que l'ancien barème.
alter table public.questions disable trigger questions_guard;

update public.questions q
set points = v.new_points, bonus_points = v.new_bonus, description = coalesce(v.new_desc, q.description)
from (values
  ('winner',          100, 0,  200, 0,   null),
  ('finalists',        30, 0,   60, 0,   '60 pts par finaliste trouvé. L''ordre ne compte pas.'),
  ('tour',             20, 50,  40, 100, '40 pts par candidat trouvé, +100 si tu les trouves tous.'),
  ('first_out',        50, 0,  100, 0,   null),
  ('most_nominated',   60, 0,  120, 0,   null),
  ('least_nominated',  40, 0,   80, 0,   null),
  ('couple',           30, 0,   60, 0,   null),
  ('belgian_duel',     20, 0,   40, 0,   null)
) as v(key, old_points, old_bonus, new_points, new_bonus, new_desc)
where q.season_id = '481eccfa-3a67-46b1-9aa8-8579fbd3974a'
  and q.category = 'grand' and q.key = v.key
  and q.points = v.old_points and q.bonus_points = v.old_bonus
  and q.status in ('open', 'closed')
  and not exists (select 1 from public.score_transactions t where t.question_id = q.id);

alter table public.questions enable trigger questions_guard;
