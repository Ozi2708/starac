# Prompt à coller dans Claude Code

---

Tu vas développer **Le Grand Prono**, une application web mobile-first de pronostics entre amis autour de la Star Academy 2026. Jeu privé, sans argent. Tout est en français, avec tutoiement.

**Lis d'abord, dans cet ordre :** `README.md`, `docs/01-architecture.md`, `docs/02-database.sql`, `docs/03-scoring-engine.md`, puis `docs/04-screens.md`, `docs/05-admin.md`, `docs/06-design-tokens.md` et `docs/07-content.md`. Le dossier `design/` contient un prototype HTML haute fidélité. C'est la **référence visuelle et comportementale** : recrée-le, ne le copie pas.

**Stack imposée :** Vite + React 18 + TypeScript strict + Tailwind CSS + React Router + TanStack Query + Supabase (Auth, Postgres, RLS, Storage, Edge Functions) + `lucide-react` + `vite-plugin-pwa`. Tests : Vitest + Testing Library pour le front, **pgTAP** (ou Vitest contre `supabase start`) pour la base.

**Règles absolues :**
1. Aucun score, verrouillage ou classement calculé côté client. Tout passe par les fonctions SQL de `02-database.sql` (`submit_prediction`, `publish_result`, `recompute_question`, vues `v_*`).
2. Une question clôturée refuse toute écriture, même via un appel direct à l'API. Le contrôle se fait dans la fonction RPC **et** dans la politique RLS.
3. Les prédictions des autres joueurs sont invisibles tant que la question n'est pas clôturée.
4. Les points ne sont jamais attribués deux fois : contrainte d'unicité + recalcul transactionnel « delete puis insert ».
5. Ne jamais inventer de candidats ni de résultats officiels en production. Les données de démo vivent dans `supabase/seed.demo.sql`, séparées et marquées « DÉMO ».
6. N'annonce jamais une fonctionnalité comme terminée si elle n'est pas branchée à la base.

**Ordre de travail (commit à chaque étape, tests verts avant de passer à la suivante) :**
- **Phase 1 : fondations.** Scaffold, tokens Tailwind (depuis `06-design-tokens.md`), composants UI de base, migration SQL, Auth (magic link et mot de passe), onboarding (pseudo, avatar), rôles admin, admin Saison et Candidats.
- **Phase 2 : moteur.** Questions (5 types), `submit_prediction`, verrouillage, saisie des résultats avec prévisualisation, `publish_result` et correction, historique `score_transactions`, tests des 8 scénarios.
- **Phase 3 : social.** Ligues (création, code et lien d'invitation, adhésion), classements général, hebdo et par ligue, graphique d'évolution, statistiques individuelles.
- **Phase 4 : premium.** Finitions visuelles, animations (en respectant `prefers-reduced-motion`), badges, notifications internes, récap de fin de saison exportable en image (`html-to-image`), PWA.

Commence par me proposer l'arborescence et la migration SQL initiale. Ensuite, déroule la phase 1.

---
