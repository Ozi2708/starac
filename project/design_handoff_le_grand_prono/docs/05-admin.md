# 05 — Back-office admin `/admin`

Desktop (≥ 1200px), même thème sombre en plus sobre. Accès : `profiles.role = 'admin'` (garde de route **et** `is_admin()` dans chaque RPC/RLS).

## Gabarit
- Barre du haut de 60px : wordmark glitter 20px + overline « ADMINISTRATION », badge « Saison 2026 » (magenta), nom et avatar de l'admin.
- Sidebar de 190px : items de 40px, r10, icône 17px. Item actif : fond 8 % + bordure subtle.
  Items : Tableau de bord `layout-dashboard` · Saison `calendar` · Candidats `users` · Questions `list-checks` · **Résultats** `flag` · Ligues `trophy` · Journal `history`.
- Zone de contenu : padding 28/32, titre en h1 + caption muted d'explication.
- Toast de confirmation en bas à droite après chaque action (« Enregistré dans le journal »).

## Tableau de bord
- Grille de 3 colonnes de StatTiles : Joueurs inscrits, Ligues, Pronostics enregistrés, Questions ouvertes, En attente de résultats, Prochain prime.
- « Prochaines clôtures » : tableau question · date · réponses « 7 / 8 ».
- « Actions rapides » : Saisir les résultats du prime N (primary), Enregistrer une nomination, Créer une question.

## Saison
- Carte **Dates (heure de Paris)** : premier prime (pilote la bascule avant-saison / saison), clôture des grands pronos, grande finale.
- Carte **Règles** : nombre de finalistes (2), participants à la tournée (8), seuil « moins nommé » (4 semaines éligibles).
- **Barème des grands pronos** : une ligne par question avec un champ numérique (+ bonus tournée parfaite).
- Boutons « Enregistrer » (écrit dans `admin_logs`) et « Archiver la saison ». Créer une nouvelle saison ne touche jamais aux données des précédentes.

## Candidats
Tableau : Candidat (avatar 30 + prénom) · Statut (Badge) · Nominations · Tournée (Switch, indépendant du statut) · Actions (« Nommer » / « Retirer nomination », « Éliminer » / « Réintégrer »).
- « Ajouter un candidat » : formulaire avec photo (upload Supabase Storage, recadrage 3:4), prénom, nom, âge, ville, présentation, date d'entrée.
- Nommer crée la ligne `candidate_nominations` de la semaine en cours. Éliminer renseigne `eliminated_at` et `eliminated_prime_id`.
- Outils de fin de saison : désigner les finalistes et le vainqueur (`status`, `final_rank`).
- Chaque changement est répercuté immédiatement dans l'app et journalisé.

## Questions
- **Liste** : question, méta (prime, points, clôture) et badge de statut (Brouillon neutral, Ouvert vert, Clôturé magenta, Résultat publié gold, Annulé closed).
- **Éditeur** (panneau de 420px) :
  - Type : Réponse unique · Réponses multiples · Oui / Non · Nombre exact · Sélection ordonnée.
  - Champs : Intitulé, Prime (ou « Grand prono »), Catégorie (hebdo / improbable), Points, Bonus, Sélections min/max, Clôture (datetime-local, heure de Paris).
  - Source des réponses : candidats en compétition, nommés, tous, liste libre ou Oui/Non.
  - **Règle de validation** : obligatoire pour publier (contrainte SQL).
  - Boutons « Publier la question » ou « Brouillon ». Désactivés tant que l'intitulé est vide.
- Une fois une question ouverte, son barème et sa règle sont **figés** (seule l'annulation reste possible).
- Actions de ligne : Dupliquer (reprendre les questions récurrentes du prime précédent), Annuler (motif obligatoire → `cancel_question`).

## Résultats (flux principal après chaque prime)
Colonne gauche de 260px : les questions du prime (Clôturé / Publié / Ouvert, nombre de réponses). À droite, un stepper **1 Saisir → 2 Prévisualiser → 3 Publier** :
1. **Saisir** : CandidateCards des options (sélection multiple autorisée pour les égalités). Pour « nombre exact », un champ numérique. « Annuler la question » en ghost.
2. **Prévisualiser** (`rpc preview_result`, **aucune écriture**) :
   - 3 StatTiles : bonnes réponses « 3 / 8 », points distribués, sans réponse.
   - Tableau Joueur · Réponse · Résultat (Correct / Incorrect / Aucune) · Points · Total « avant → après » · Rang « #3 → #2 ».
   - Boutons « Publier les résultats » et « Modifier le résultat ».
3. **Publier** : Dialog « Publier les résultats ? » avec un résumé → `rpc publish_result`. Ensuite, bandeau vert « Résultat publié : Noah · classements de toutes les ligues actualisés » + bouton « Corriger le résultat ».
- **Correction** : même flux ; `version + 1`, les transactions sont remplacées sans doublon, et le journal garde l'ancienne et la nouvelle valeur.
- **Clôturer la semaine** (quand tous les résultats du prime sont publiés) → `snapshot_ranks(prime)` + badges + notifications « progression ».

## Ligues
Tableau lecture seule : nom, membres, admin de ligue, date de création, code masqué. Actions de modération : supprimer une ligue abusive, régénérer un code.

## Journal
Tableau Date · Auteur · Action · Ancienne valeur · Nouvelle valeur (`admin_logs`, JSON rendu lisible). Filtres par entité et par date.
