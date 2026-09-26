# 04 — Écrans de l'app mobile

Référence : `design/Le Grand Prono Prototype.dc.html`, téléphone 390×844. Gouttière de 20px, contenu en colonne flex. Barre de statut iOS de 50px en haut (safe-area). BottomNav fixe de 72px sur Accueil, Pronos, Candidats, Classement, Profil et Ligues. Le contenu défilant garde 120px de padding bas.

---

## 1. Avant-saison `/` (phase `pre`)
**But** : comprendre le jeu, créer un compte, rejoindre une ligue avant la révélation des candidats.
- **Héros** : `key-art.jpg` cadré pour montrer le logo entier sur 300px de haut (`-60px 10px / 500px auto`, fond `#2a1275`). Dégradé de protection `rgba(13,3,34,.45) 0% → 0 16% → 0 70% → #0d0322 100%`.
- **Contenu** (commence à y=230, gap 28) :
  - Badges « Avant-saison » (magenta) et « Démo » (en démo seulement).
  - Overline « SAISON 2026 · LE JEU DE PRONOS » en gold-200.
  - « Le Grand Prono » : Kanit 900 italic 46px, texte en grad-glitter.
  - Signature en body-l secondary.
  - Overline « PREMIER PRIME DANS », Countdown md vers `seasons.first_prime_at`, puis caption « Sam. 17 oct. · 21h10, heure de Paris ».
  - Les 3 étapes : lignes de 14px de padding séparées par une bordure subtle, numéro en Kanit 900 italic 26px flare-400, texte en body 600.
  - Boutons lg pleine largeur : « Créer mon compte » (primary), « Rejoindre une ligue » (secondary, icône `key-round`).
  - Mention légale en caption muted centrée.
- Bascule automatiquement vers le tableau de bord quand `now() >= first_prime_at` (hook `useSeason`).

## 2. Onboarding (non maquetté, suivre le système)
Auth Supabase (magic link et mot de passe) → pseudo (2–24 caractères, unique, erreur inline) → avatar (upload ou initiales) → « Créer ma ligue » ou « Rejoindre avec un code ». Si l'utilisateur arrive par `/rejoindre/:code`, l'adhésion se fait automatiquement après l'inscription.

## 3. Tableau de bord `/` (variante 1a retenue)
Ordre vertical, gap 28 :
1. **En-tête** : Avatar 44 (anneau magenta) · caption du nom de la ligue principale (cliquable, ouvre la page de la ligue) · h3 « Salut {pseudo} » · IconButton cloche (pastille flare s'il y a des non-lus, ouvre `/notifications`).
2. **Héros** (carte stage r20) : key art en haut (`42% -12px / 470px auto`) sous le dégradé `transparent 30% → rgba(23,6,67,.94) 62%` ; espace de 150px pour laisser voir le logo ; badges « Semaine 6 » (gold) et « Prime 6 · sam. 21h10 » ; h2 « Prochain prime dans » ; Countdown md.
3. **MON CLASSEMENT** (carte edge, padding 18) :
   - Ligne du haut : Avatar 48, pseudo, « Ligue principale · N joueurs », puis **score** Kanit 900 48px en grad-gold avec « pts » en caption.
   - Grille de 3 colonnes séparées par des filets : « #3 » Rang ligue · « ▲1 » en vert (Cette semaine) · « +45 » (Pts prime N).
   - Toute la carte est cliquable et mène au Classement.
4. **MES PROCHAINS PRONOSTICS** (compteur « 3 à faire » à droite) :
   - Rangée « Prochaine clôture » : icône horloge flare + Countdown sm sans les jours.
   - Les 2 premières PronoCards non jouées.
   - Bouton lg « Faire mes pronostics · 95 pts en jeu ».
   - **État vide** (tout est joué) : carte avec bordure verte 35 %, icône `circle-check`, « Tous tes pronos sont validés ».
5. **MA LIGUE** (lien « Classement complet » à droite) : carte glass padding 6 contenant les 3 premières LeaderboardRow.
6. **DERNIERS RÉSULTATS · PRIME N** (carte, 3 lignes séparées par des filets) :
   - Dernier éliminé : avatar en niveaux de gris + badge « Éliminé ».
   - Nommés : avatars empilés à −10px.
   - Tes points : pastille or + PointsChip gain.
7. Mention légale.
S'adapte à la saison : pas de « Derniers résultats » avant le premier résultat ; pendant la phase `open`, la section 4 met en avant les grands pronos et leur clôture.

## 4. Hub Pronostics `/pronos`
h1 « Pronostics » + SegmentedControl pleine largeur : **Semaine | Grands pronos | Improbables**.
- **Semaine** : carte stage (key art à 30 % + dégradé horizontal) avec badge « Prime 6 », date, « Prochaine clôture dans » + Countdown sm, « En jeu » (points restants, Kanit or 22px) et ProgressBar flare « Mes pronos validés 1 / 4 ». Puis une PronoCard par question ouverte ou verrouillée (statut Ouvert / Joué / Fermé / Gagné, ma réponse, « Ferme ven. 18h00 »). En bas, une note sur le fuseau de Paris et le verrouillage.
- **Grands pronos** :
  - Phase `open` : carte edge « LES GRANDS PRONOS · CLÔTURE DANS » + Countdown sm + « 2 / 9 complétés ».
  - Sinon : carte « Verrouillés depuis le 17 oct. » avec icône cadenas.
  - Ensuite, la liste des 9 grands pronos (choix tronqué à 3 noms, puis « +5 »).
- **Improbables** : titre « Les paris improbables » en glitter + explication. Pour chaque pari, une carte avec badge statut, PointsChip (`sparkles`), question en 17/700, « Validé si : … » (icône `scale`), SegmentedControl des réponses (enregistrement direct, puis toast) et la clôture.
État vide : « Pas de pronos ouverts pour l'instant… ».

## 5. Sélection `/pronos/:id`
- Barre : IconButton retour + Badge (Ouvert / Joué / Verrouillé avec cadenas).
- Overline (« PRIME 6 · PRONO DE LA SEMAINE » ou « GRAND PRONO DE LA SAISON »), h1 = question, description, PointsChip (« 20 pts / candidat » pour les choix multiples) et « Clôture ven. 18h00 (heure de Paris) ».
- **Choix multiple** : carte « MA SÉLECTION POUR LA TOURNÉE », compteur Kanit « 5 / 8 », grille de 4 emplacements (avatar 44, ou cercle en pointillé numéroté), barre de progression.
- **Grille 3 colonnes** de CandidateCard (avatar 56 si plus de 6 candidats, sinon 72). Méta : Mon choix / Nommé·e / En compétition / Éliminé·e.
- **Barre collante en bas** sur grad-protect :
  - Compteur (« 5 / 8 candidats sélectionnés » ou « Ton choix : Inès »).
  - Bouton lg « Valider mon prono », ou « Enregistrer mes modifications » si déjà joué. Désactivé tant que le nombre n'est pas atteint ou que rien n'a changé.
- Au 9e choix sur 8 : toast info « Sélection complète ».
- Validation : Dialog de confirmation → `rpc submit_prediction` → toast succès et retour au hub. En cas d'erreur `QUESTION_LOCKED`, afficher le verrou et recharger.
- **Verrouillé** : grille en lecture seule (sélection visible) ; la barre du bas devient la carte « Prono verrouillé » avec la date de clôture.

## 6. Candidats `/candidats` et fiche `/candidats/:id`
- **Grille** : h1 + SegmentedControl Tous / En lice / Éliminés ; grille de 2 colonnes gap 12 de CandidateTile 3:4 ; badge statut (En compétition neutral, Nommé·e magenta, Immunisé·e vert, Éliminé·e closed, Finaliste et Vainqueur gold). La photo occupe toute la tuile.
- **Fiche** :
  - Héros photo de 400px, dégradé bas vers `#0d0322`, retour en surimpression. En bas : badges statut et Tournée (gold `ticket`, si `on_tour`), prénom en Kanit 900 44px, « 21 ans · Lyon ».
  - Présentation en body-l.
  - 3 StatTiles : Nominations, Semaines, Tournée (Qualifié·e / À venir).
  - **Historique des nominations** : une pastille de 28px par semaine (magenta si nommé·e, estompée après l'élimination) + légende.
  - **Résultats officiels** : liste « Semaine 5 · Nommé·e, sauvé·e ».
  - **Ce qu'en pense la communauté** : ProgressBar cyan par question **verrouillée** (vue `v_candidate_pick_stats`), puis une ligne cadenas « Prochain éliminé : visible après la clôture (sam. 20h00) ».

## 7. Classement `/classement`
En-tête : caption ligue + h1 « Classement » + bouton sm « Mes ligues ». SegmentedControl **Général | Semaine | Évolution**.
- **Général** :
  - Rang 1 : carte surface-raised, bordure or 45 %, halo or discret, chiffre « 1 » en Kanit 900 44px or, avatar 56 à anneau or, overline « EN TÊTE », pseudo, points en Kanit 900 30px or.
  - Rangs 2 et 3 : deux cartes glass sobres côte à côte (rang en Kanit 26px secondary, avatar 40, pseudo, points).
  - Rangs 4 et suivants : LeaderboardRow.
  - Ma ligne mise en évidence. Si je suis hors du top visible, garder ma ligne collante en bas.
  - Note : « À égalité de points, les joueurs partagent le même rang. »
- **Semaine** : carte edge « MEILLEURE PROGRESSION · Rayan gagne 3 places » + PointsChip, puis le classement des points du dernier prime.
- **Évolution** : graphique en ligne (322×220), axe Y du rang #1 à #8 (1 en haut), axe X P1…Pn. Ma courbe en flare-400 (3,5px), celles des amis comparés en `#e679f2`, `#b7a0ff`, `#ffe8b3` (2px), point final de 5px. Chips « Comparer avec (3 max) » : en ajouter un 4e remplace le plus ancien. Données : `rank_snapshots`.

## 8. Ligues `/ligues`, `/ligues/:id`
- **Liste** : cartes glass interactives (vignette 56 r14 avec initiale sur dégradé, ou image), nom, « 8 joueurs · tu es #3 ». Boutons « Créer une ligue » (primary) et « Rejoindre avec un code » (secondary).
- **Dialog création** : champ « Nom de la ligue » → `rpc create_league` → page de la ligue + toast avec le code.
- **Dialog adhésion** : champ code (format `XXXX-XXXX`) → `rpc join_league`. Code invalide : toast erreur.
- **Page d'une ligue** :
  - Vignette 72 r20 + nom en h1 28px + « N joueurs · tu es admin ».
  - Carte edge « CODE D'INVITATION » (code en Kanit 28px, tracking 0.06em) avec boutons « Copier » et « Partager le lien » (Web Share API, sinon copie).
  - « Joueur de la semaine », classement de la ligue, « Dernières récompenses » (badges des membres).
  - « Partager le classement en image » : `html-to-image` sur une carte 1080×1350.
  - Note admin de ligue : il gère les membres (retrait) et les invitations, jamais les scores.

## 9. Profil `/profil`
- En-tête : avatar 64, pseudo en h2, ligue et date d'inscription.
- 4 StatTiles : Points (grad-gold) · Rang · Bonnes réponses « 12 / 19 » · Taux « 63 % ».
- **Mes badges** : grille de 4 colonnes, médaillons de 52px. Obtenu : grad-gold + glow-gold, icône `#3a1a00`. Pas encore obtenu : 5 % de blanc, icône muted. Au tap, toast avec la description et la date d'obtention.
- **Historique des points** : barres par prime (hauteur ∝ points), la dernière en grad-gold, valeur « +45 » au-dessus.
- **Mes pronostics** : SegmentedControl Par prime / Grands pronos, groupes titrés (« PRIME 5 »), lignes question + ma réponse + points + Badge (Correct vert, Partiel magenta, Incorrect closed, En attente neutral, Annulé closed, À faire magenta). Bonne réponse et points visibles **uniquement après publication**.
- **Paramètres** : Switch notifications (`profiles.notif_enabled`), Mes ligues, Mes données (export et suppression, RGPD).
- Mention légale.

## 10. Notifications `/notifications`
Retour + bouton ghost « Tout marquer lu ». Lignes : icône 36 dans un cercle 8 %, titre en body-s 700, message en secondary, heure en caption, point flare si non lu. Types : ouverture des pronos, clôture dans 2 h (Edge Function planifiée), résultats publiés, points gagnés, badge, forte progression.

## 11. Fin de saison `/finale` (phase `finished`)
Cérémonie sobre :
- Key art et logo en haut, badges « Grande finale » (gold `crown`).
- « Le vainqueur de la Star Academy 2026 est », avatar ou photo 104 à anneau or, prénom en Kanit 900 60px grad-gold.
- **Ton récap de saison** : carte edge, exportable en image 1080×1920. Elle contient le wordmark et l'avatar, le rang final en Kanit 900 76px or (« #2 · 2e sur 8 · ligue »), 4 StatTiles (points, réussite, meilleur prono, meilleur prime), une sparkline de rang flare-400, les badges obtenus et le pied « legrandprono.app · jeu entre amis, sans argent ».
- Boutons « Partager mon récap » et « Voir le classement final ».
- **Champions des ligues** : une ligne par ligue.
Seul écran autorisé à un effet de révélation plus marqué (fondu et montée échelonnés, 600ms), toujours désactivable par `prefers-reduced-motion`.

## États transverses
- **Chargement** : squelettes aux dimensions réelles (fond `rgba(255,255,255,.06)`, légère pulsation d'opacité), jamais de spinner plein écran.
- **Erreur** : toast erreur + action Réessayer. Les mutations restent en attente tant que le serveur n'a pas confirmé (TanStack Query, sans optimistic update sur les pronos).
- **Verrou** : dès qu'une question passe `closes_at` pendant que l'écran est ouvert, le compte à rebours à zéro déclenche un refetch et affiche l'état verrouillé.
