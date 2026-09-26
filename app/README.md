# Le Grand Prono · Star Academy 2026

> Une saison. Des pronos. Un seul gagnant.
> Jeu de pronostics privé entre amis, sans argent. Créé par des fans, sans affiliation avec TF1 ni la production.

Application web mobile-first (PWA) et back-office admin, recréées d'après le prototype Claude Design
(`../project/Le Grand Prono Prototype.dc.html`) et le dossier de passation (`../project/design_handoff_le_grand_prono/`).

**Stack :** Vite · React 18 · TypeScript strict · Tailwind CSS · React Router · TanStack Query · Supabase (Auth, Postgres, RLS, Storage, Edge Functions) · lucide-react · date-fns-tz · html-to-image · vite-plugin-pwa · Vitest.

## Démarrer en local

Prérequis : Node 20+, Docker (pour `supabase start`).

```bash
npm install
npx supabase start                  # Postgres + Auth + Storage en local, applique les migrations
npx supabase status -o env          # récupère API_URL et ANON_KEY
cp .env.example .env                # puis renseigne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                         # http://127.0.0.1:5173
```

### Données de démo (projet séparé uniquement)
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run db:demo
```
Crée une saison « Star Academy 2026 · DÉMO » en semaine 6 (prime 6 le samedi suivant à 21h10), 12 candidats et
15 joueurs fictifs, deux ligues, les primes 1 à 5 publiés et clôturés. Tout est marqué « DÉMO ».
- joueur : `demo@legrandprono.app` / `grandprono-demo` (Sam)
- admin : `admin-demo@legrandprono.app` / `grandprono-demo` (Alex) → `/admin`

Ne jamais charger ce fichier sur le projet de production.

### Passer en production
1. Crée un projet Supabase, puis `npx supabase link --project-ref <ref>` et `npx supabase db push`.
2. Auth → URL Configuration : ajoute l'URL du site dans *Site URL* et *Redirect URLs* (liens magiques).
3. Clôture automatique et rappels : active l'extension `pg_cron` avant la migration (planification incluse), ou déploie
   `supabase/functions/deadline-reminders` et appelle-la toutes les 10 min avec la clé service.
4. Connecte-toi une première fois, choisis ton pseudo, puis donne-toi le rôle admin :
   `update profiles set role = 'admin' where pseudo = 'TonPseudo';`
5. Dans `/admin/saison` : crée la saison (dates, règles), ajoute les primes. Dans `/admin/candidats` : ajoute les candidats
   dès leur révélation. Retour dans Saison : « Générer les 9 grands pronos », ajuste le barème, puis « Ouvrir les grands pronos ».
6. `npm run build` et déploie `dist/` (Vercel, Netlify…) avec les deux variables `VITE_SUPABASE_*`.

## Tests

```bash
npm test          # affichage : dates Paris, statuts, rangs partagés
npm run test:db   # les 8 scénarios du cahier des charges + cas limites, contre un vrai Postgres avec RLS
```
`test:db` crée une base jetable par exécution. Par défaut il vise `postgres://postgres:postgres@localhost:5432/postgres` ;
avec `supabase start` : `TEST_PG_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres npm run test:db`.
Un petit shim (`supabase/tests/shim`) recrée les rôles et `auth.uid()` de Supabase pour tourner aussi sur un Postgres nu.

## Architecture

```
src/
  app/            routes, MobileLayout (BottomNav), gardes d'accès
  components/ui/  composants du design system (classes gp-* reprises du DS, icônes lucide-react)
  features/       home · auth · predictions · candidates · leaderboard · leagues · profile · notifications · finale · admin
  lib/            client Supabase, requêtes TanStack Query, formats (heure de Paris), erreurs RPC traduites
  styles/         tokens et composants du design system + utilitaires
supabase/
  migrations/     schéma, RLS, RPC, vues de classement, storage/cron
  functions/      deadline-reminders (Edge Function planifiée)
  seed.sql        rien d'inventé (badges créés par la migration)
  seed.demo.sql   données fictives DÉMO
  tests/db/       scénarios Vitest contre Postgres
```

### Règles tenues côté serveur
- **Aucun score calculé côté client.** Points : `score_prediction` / `recompute_question` (delete puis insert, verrou
  consultatif, contrainte `unique (question, user, kind)`). Classements : vues `v_general_leaderboard`,
  `v_league_leaderboard`, `v_prime_scores` (RANK : ex æquo au même rang).
- **Verrouillage :** `submit_prediction` refuse après `closes_at` (`QUESTION_LOCKED`) ; aucune policy d'écriture sur
  `user_predictions` ; une réponse modifiée après la clôture est ignorée au calcul.
- **Confidentialité :** les pronos des autres et les stats communautaires ne sont lisibles qu'après la clôture.
- **Barème figé** dès l'ouverture (trigger), règle de validation obligatoire pour ouvrir, annulation avec motif.
- **Journal admin automatique** (trigger d'audit : auteur, date, ancienne et nouvelle valeur) + publication / correction.
- **Phase de saison** calculée en SQL (`v_seasons.phase` : pre · open · running · finished) ; l'accueil bascule seul.

### Écarts assumés par rapport au prototype
- Le prototype simulait tout dans le navigateur ; ici tout passe par Supabase.
- Les candidats sans photo gardent la tuile dégradée avec initiale, comme dans le prototype, jusqu'à l'upload de visuels
  officiels depuis l'admin (bucket `candidates`).
- Le classement ajoute un sélecteur « Tous les joueurs / mes ligues » (le prototype montrait seulement la ligue principale).
- Semaine « clôturée » : le bouton « Clôturer la semaine » (Résultats) fige les rangs pour le graphique d'évolution et
  les flèches, attribue les badges et envoie les notifications de progression.

## Hors périmètre / à faire
- Notifications push (la table `notifications` et l'Edge Function sont prêtes).
- Upload d'image de ligue (bucket et policy prêts, pas encore d'écran ; la vignette utilise l'initiale).
- Recadrage 3:4 à l'upload des photos candidats (l'image est affichée en `cover`).
- Tests end-to-end Playwright automatisés (le parcours a été vérifié à la main sur la base de démo).
