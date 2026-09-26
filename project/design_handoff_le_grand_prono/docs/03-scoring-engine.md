# 03 — Moteur de scoring et tests

Toute règle de calcul est **définie avant l'ouverture** de la question (colonnes `scoring`, `points`, `bonus_points`, `max_selections`, `validation_criteria`). Le calcul est fait par `score_prediction()` et `recompute_question()` (voir `02-database.sql`), **jamais côté client**.

## Cycle de vie d'une question
`draft` → `open` → `closed` → `published`. Une question peut passer à `cancelled` depuis n'importe quel état.
- **draft** : invisible des joueurs, modifiable.
- **open** : les joueurs répondent via `submit_prediction()`. Ils peuvent modifier jusqu'à `closes_at`.
- **closed** : automatique à `closes_at` (pg_cron `close_due_questions()`). Même sans cron, `submit_prediction()` refuse dès `now() >= closes_at`. Les réponses des autres deviennent lisibles et les stats communautaires apparaissent.
- **published** : résultat officiel enregistré, points attribués, classements recalculés.
- **cancelled** : 0 point pour tout le monde ; les transactions existantes sont supprimées.

## Règles par type
| Règle `scoring` | Calcul | Exemples |
|---|---|---|
| `per_correct` | `points × nb de sélections ∈ réponses officielles`. Bonus seulement si **toutes** les sélections sont correctes **et** que la liste officielle complète est trouvée (`hits = |sel| = |officiel| = max_selections`) | Finalistes 30/cand., Tournée 20/cand. + 50, Nommés 15/cand., et toutes les réponses uniques (gagnant, éliminé, évaluations…) avec `max_selections = 1` |
| `all_or_nothing` | Points si l'ensemble choisi = l'ensemble officiel (ordre ignoré) | Couple de la saison (paire, ou option « Aucun couple confirmé ») |
| `exact_number` | Points si le nombre est exactement égal | « Combien d'artistes invités ? » |
| `ordered_positions` | `points ×` nombre de positions exactes | Sélection ordonnée (ex. top 3 des évaluations) |

**Égalités** : l'admin coche **plusieurs** réponses officielles. Toute sélection présente dans la liste est correcte.

## Barème initial (modifiable dans l'admin)
| Grand prono | Pts | Règle | max_selections |
|---|---:|---|---:|
| Le grand gagnant | 100 | per_correct | 1 |
| Les deux finalistes | 30/cand. | per_correct | `seasons.finalists_count` |
| Le premier éliminé (après clôture) | 50 | per_correct | 1 |
| Les 8 de la tournée | 20/cand. + bonus 50 | per_correct | `seasons.tour_count` |
| Le plus nommé | 60 | per_correct (égalités acceptées) | 1 |
| Le moins nommé (≥ `least_nominated_min_weeks` semaines éligibles) | 40 | per_correct (égalités acceptées) | 1 |
| Le premier qualifié pour la finale | 40 | per_correct | 1 |
| Le dernier éliminé avant la finale | 40 | per_correct | 1 |
| Le couple de la saison | 30 | all_or_nothing | 2 (ou l'option « aucun ») |

| Hebdo | Pts | Note |
|---|---:|---|
| Qui sera éliminé ? | 30 | s'ouvre après l'annonce officielle des nommés ; options = nommés |
| Qui sera nommé la semaine prochaine ? | 15/cand. | nombre de sélections fixé par l'admin |
| Premier des évaluations | 20 | seulement si un classement officiel existe cette semaine |
| Immunité | 20 | seulement si la mécanique existe cette semaine |
| Sauvé par les élèves | 25 | seulement si le prime prévoit ce vote |
| Avantage spécial | 20 | activé quand une récompense officielle est annoncée |

**Ne jamais afficher une question portant sur une mécanique absente de la semaine** : l'admin ne la crée pas, ou l'annule.

## Calcul des résultats « plus / moins nommé »
Fourni à l'admin comme **aide** (requête sur `candidate_nominations` et `candidate_eligible_weeks`). L'admin valide la liste avant publication. Une semaine = une nomination, même en cas de plusieurs annonces.

## Scores dérivés
- **Total saison** = `sum(score_transactions.points)` par saison (`v_season_scores`).
- **Score hebdo** = somme par `prime_id` (`v_prime_scores`).
- **Rang** = `RANK()` : les ex æquo partagent le rang et le suivant saute (1, 2, 2, 4).
- **Évolution** = différence avec `rank_snapshots` du prime précédent.
- **Taux de réussite** = `correct_answers / predictions sur questions publiées`.

## Badges (fonction `award_badges(season)` à écrire, appelée après chaque publication)
- `visionnaire` : transaction base > 0 sur la question « gagnant ».
- `tour_manager` : transaction bonus > 0 sur « tournée ».
- `madame_irma` : 3 questions publiées consécutives (ordre `closes_at`) avec points > 0.
- `specialiste` : sur un prime avec ≥ 5 questions publiées, ≥ 80 % correctes.
- `comeback` : gain ≥ 3 places dans `rank_snapshots` d'une ligue entre deux primes.
- `fidele` : prédictions sur ≥ 5 primes distincts.
- `champion` : rang 1 d'une ligue au snapshot final.
Chaque attribution crée une notification `badge_earned`. La contrainte `unique (user, badge, season)` empêche les doublons.

## Scénarios obligatoires (tests automatisés + recette manuelle)
1. **Inscription et grands pronos** : A crée son compte, rejoint la ligue L et enregistre ses grands pronos. Relire `user_predictions` renvoie exactement ses choix.
2. **Confidentialité** : B rejoint L et joue. Tant que `closes_at` n'est pas passé, `select * from user_predictions where user_id = A` exécuté par B renvoie **0 ligne**.
3. **Verrouillage** : après `closes_at`, `rpc('submit_prediction')` par A lève `QUESTION_LOCKED`. Un `insert` ou `update` direct sur `user_predictions` est refusé par RLS (aucune policy d'écriture).
4. **Élimination** : l'admin appelle `preview_result(q, {Noah})`, qui renvoie les bons joueurs avec +30, sans rien écrire (`count(score_transactions)` inchangé).
5. **Publication** : `publish_result(q, {Noah})` crée une transaction par répondant, `v_league_leaderboard` reflète les nouveaux totaux, et une notification est créée pour chaque joueur.
6. **Correction** : `publish_result(q, {Jade})` passe `version` à 2 et remplace les transactions (toujours au plus 1 ligne `base` par joueur et par question). Les totaux correspondent au nouveau résultat. `admin_logs` contient l'ancienne et la nouvelle valeur.
7. **Multi-ligues** : A est membre de L1 et L2. Son total est identique dans les deux vues de ligue, sans aucune ressaisie de pronos.
8. **Fin de saison** : publication de gagnant, finalistes, tournée (A trouve les 8 → 8×20 + 50 = 210), couple et dernier éliminé ; `snapshot_ranks(finale)` ; `award_badges` → champion de chaque ligue ; la page `/finale` affiche le récap.

Cas limites supplémentaires :
- Question annulée → 0 point, transactions supprimées.
- Joueur sans réponse → aucune transaction.
- Égalité officielle avec 2 réponses → les deux groupes marquent.
- Réponse dont `submitted_at >= closes_at` → ignorée (défense en profondeur).
- Tournée à 7/8 → 140 pts, sans bonus.
- Candidat éliminé proposé dans une question « en compétition » → `CANDIDATE_ELIMINATED`.
