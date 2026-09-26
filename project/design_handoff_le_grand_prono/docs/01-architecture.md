# 01 — Architecture

## Stack
- **Front :** Vite, React 18, TypeScript strict, Tailwind CSS (thème étendu avec les tokens), React Router 6, TanStack Query, `lucide-react`, `date-fns` + `date-fns-tz` (affichage **Europe/Paris**), `html-to-image` (exports partageables), `vite-plugin-pwa`.
- **Back :** Supabase (Postgres 15, Auth, RLS, Storage, Realtime optionnel, Edge Functions pour les tâches planifiées).
- **Tests :** Vitest + Testing Library, pgTAP pour les fonctions SQL, Playwright (optionnel) pour les 8 scénarios de bout en bout.

## Arborescence proposée
```
src/
  app/                 routes, layouts (MobileLayout avec BottomNav, AdminLayout avec Sidebar)
  components/ui/       Button, IconButton, Badge, Avatar, Card, CandidateCard, CandidateTile,
                       PronoCard, PointsChip, Countdown, ProgressBar, LeaderboardRow, StatTile,
                       SegmentedControl, Tabs, BottomNav, Toast, Dialog, Switch, Input
  features/
    auth/              connexion, onboarding (pseudo + avatar)
    season/            hook useSeason() : phase (pre | open | running | finished), dates
    home/              tableau de bord
    predictions/       hub (Semaine | Grands pronos | Improbables), écran de sélection, confirmation
    candidates/        grille + fiche
    leaderboard/       Général | Semaine | Évolution
    leagues/           liste, page, création, adhésion
    profile/           stats, badges, mes pronostics, paramètres
    notifications/
    finale/            cérémonie + récap partageable
    admin/             dashboard, saison, candidats, questions, résultats, ligues, journal
  lib/                 supabaseClient, format (points, dates Paris), rank helpers (affichage seulement)
  types/               types générés : `supabase gen types typescript`
supabase/
  migrations/0001_init.sql      ← docs/02-database.sql
  seed.sql                      badges, barème par défaut
  seed.demo.sql                 candidats et joueurs fictifs (projet de démo séparé)
  tests/*.sql                   pgTAP
  functions/deadline-reminders/ Edge Function planifiée (notifications « clôture dans 2 h »)
```

## Routes
| Route | Écran | Accès |
|---|---|---|
| `/` | Avant-saison si `phase = pre`, sinon tableau de bord | public / joueur |
| `/connexion`, `/bienvenue` | Auth, onboarding | public |
| `/pronos` `?tab=semaine\|saison\|improbables` | Hub pronostics | joueur |
| `/pronos/:questionId` | Sélection / consultation verrouillée | joueur |
| `/candidats`, `/candidats/:id` | Grille, fiche | joueur |
| `/classement` `?vue=general\|semaine\|evolution` | Classements | joueur |
| `/ligues`, `/ligues/:id`, `/rejoindre/:code` | Ligues | joueur |
| `/profil`, `/notifications` | Profil, notifications | joueur |
| `/finale` | Cérémonie de fin de saison | joueur (quand `phase = finished`) |
| `/admin/*` | Back-office | `profiles.role = 'admin'` (garde de route + RLS) |

## Phase de saison (calculée, jamais stockée à la main)
`pre` avant `seasons.first_prime_at`, `open` jusqu'à `grand_predictions_close_at`, `running` jusqu'à publication du vainqueur, `finished` ensuite. L'accueil bascule automatiquement.

## Données et multi-saison
Toutes les tables métier portent un `season_id`. Une seule saison `is_current = true`. Les saisons archivées restent consultables en lecture seule.

## Temps
Tout est stocké en `timestamptz` (UTC) et affiché en Europe/Paris, avec le suffixe « heure de Paris » près de chaque clôture. Le serveur utilise toujours `now()` comme référence, jamais l'horloge du client.

## Hors MVP (à reporter si ça menace la stabilité)
Notifications push (l'architecture est prête : table `notifications` + Edge Function), Realtime sur les classements, upload d'image de ligue (MVP : initiale sur dégradé).
