# Régie automatique · Le Grand Prono

Trois tâches planifiées Claude Code (Routines, sessions neuves à chaque passage, heure de Paris) :
- **Mercredi 20h00 · nommés** : nominations, éligibilité de la semaine, « Qui sera éliminé ? », « Qui sera nommé la semaine prochaine ? ».
- **Jeudi 20h00 · battle du top 3 + pari de la semaine** : ouvre « Qui gagnera la battle du top 3 ? » et prépare **en brouillon** un pari improbable original, que Val valide dans `/admin/questions` (« Ouvrir »).
- **Dimanche 1h00 · résultats du prime** : élèves (après le prime 1), résultats, éliminations, points, clôture de la semaine, prime suivant.

Chaque tâche a besoin du connecteur Supabase (à ajouter sur claude.ai → Routines si absent).
Elle lit l'état du jeu dans Supabase (projet `starac`, id `yfhpmsraxlrbxeuzlxen`), cherche les infos officielles de la
Star Academy 2026 (TF1 et presse qui cite TF1), puis met l'app à jour au nom du compte admin technique « Régie ».

## Ce qu'elle fait
| Moment | Action |
|---|---|
| Lendemain du prime 1 (révélation des élèves) | Ajoute les candidats, génère et ouvre les 9 grands pronos |
| Annonce des nommés | Enregistre les nominations (statut Nommé·e, semaine = prime en cours), ouvre « Qui sera éliminé ? » (30 pts, options = nommés, clôture samedi 20h00) et « Qui sera nommé la semaine prochaine ? » si pertinent |
| Annonce de la battle du top 3 (lendemain) | Ouvre « Qui gagnera la battle du top 3 ? » (20 pts, options = les 3, clôture samedi 20h00) |
| Après le prime | Enregistre l'élimination, publie les résultats (éliminé, battle, immunité…), annule les questions sans objet, clôture la semaine, ajoute le prime suivant |
| Fin de saison | Tournée, finalistes, vainqueur → publie les grands pronos |

Chaque fait collecté est stocké dans `season_facts` (source, date, niveau de confiance) : c'est la mémoire de la saison.
En cas de doute (sources contradictoires, confiance faible), la régie **n'applique rien** et notifie pour validation.
Toute erreur se corrige dans `/admin/resultats` (« Corriger le résultat ») : les points sont recalculés sans doublon.

## Agir comme la Régie en SQL
```sql
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000c1a0","role":"authenticated"}', false);
-- puis, dans la même requête : admin_set_candidate_status(...), admin_save_question(...), publish_result(...), close_prime(...)
```

## Grands pronos de la saison 2026 (en base, clôture 17/10 21h00)
winner · finalists · tour · first_out · most_nominated / least_nominated (nominations comptées jusqu'à l'annonce de la
tournée) · last_out · couple · last_out_before_tour · battle_king (faits `battle_winner` dans season_facts) ·
elder_vs_youngest (Cameron / Antoine / Brieuc / Félix) · winner_gender · belgian_duel (Brieuc / Leeloo).
`first_finalist` est annulé (pas de « premier qualifié » dans le format de la finale).
