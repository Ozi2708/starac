-- Primes « spécial équipes » : une option peut porter une équipe (nom + couleur) et, pour un pari
-- « Quelle équipe… ? », la liste de ses membres (photos affichées dans l'app).
--   * option candidat  : team = 'Rouges', color = '#ff4a78'  → pastille / regroupement par équipe
--   * option équipe    : label libre, color, member_ids = {candidats}  → carte d'équipe avec photos
alter table public.question_options
  add column if not exists team text,
  add column if not exists color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists member_ids uuid[];
