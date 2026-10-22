-- Genre des élèves pour accorder les libellés (Nommée / Nommé…), renseigné par Val le 22/10.
alter table public.candidates add column if not exists gender text check (gender in ('f', 'm'));

update public.candidates c set gender = v.g
from (values
  ('Amel', 'f'), ('Antoine', 'm'), ('Brieuc', 'm'), ('Cameron', 'm'), ('Elija', 'f'), ('Félix', 'm'),
  ('Isabella', 'f'), ('Khalil', 'm'), ('Kylian', 'm'), ('Leeloo', 'f'), ('Maud', 'f'), ('Mélina', 'f'),
  ('Morgan', 'm'), ('Noémie', 'f'), ('Tracy', 'f'), ('Ydriss', 'm'), ('Zoé', 'f')
) as v(first_name, g)
where c.season_id = '481eccfa-3a67-46b1-9aa8-8579fbd3974a' and c.first_name = v.first_name;
