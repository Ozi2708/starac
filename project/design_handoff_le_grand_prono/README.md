# Handoff : Star Academy — Le Grand Prono

> « Une saison. Des pronos. Un seul gagnant. »
> Jeu de pronostics privé entre amis autour de la Star Academy 2026. Sans argent, sans mise, sans gains réels. Non affilié à TF1 ni à la production.

## Overview
Application web **mobile-first** (PWA) + **back-office admin desktop**. Les joueurs pronostiquent les grands événements de la saison et les primes hebdomadaires, marquent des points calculés **côté serveur**, et s'affrontent dans des **ligues privées**. L'admin gère saison, candidats, questions, résultats et classements sans toucher au code.

## About the Design Files
Les fichiers de `design/` sont des **références de design en HTML** : un prototype cliquable qui montre l'aspect et le comportement attendus. **Ce n'est pas du code de production à copier.** La tâche est de **recréer ces écrans** dans la stack cible — **React + TypeScript + Vite + Tailwind CSS + Supabase (Postgres, Auth, RLS, Edge Functions)** — avec ses propres patterns. Toute la logique de score, de verrouillage et de classement du prototype est simulée côté client : en production, elle **doit** vivre dans Postgres (voir `docs/02-database.sql`).

## Fidelity
**Haute fidélité.** Couleurs, typo, rayons, espacements, textes et interactions sont définitifs. Recréer au pixel près à partir des tokens (`docs/06-design-tokens.md`). Seules les données (candidats, joueurs, scores) sont fictives.

## Contenu du dossier
| Fichier | Rôle |
|---|---|
| `CLAUDE_CODE_PROMPT.md` | **Le prompt à coller dans Claude Code** pour démarrer |
| `docs/01-architecture.md` | Stack, arborescence, routes, phases de dev |
| `docs/02-database.sql` | Schéma Supabase complet : tables, enums, RLS, fonctions RPC, vues de classement |
| `docs/03-scoring-engine.md` | Règles de calcul exactes + scénarios de test obligatoires |
| `docs/04-screens.md` | Spécification écran par écran (app mobile) |
| `docs/05-admin.md` | Spécification du back-office |
| `docs/06-design-tokens.md` | Couleurs, typo, rayons, ombres, motion, composants |
| `docs/07-content.md` | Ton, vocabulaire, textes, mentions légales |
| `design/Le Grand Prono Prototype.dc.html` | Prototype cliquable (mobile + admin reliés) |
| `design/Le Grand Prono.dc.html` | Exploration des 3 tableaux de bord (1a retenu) |
| `design/_ds/…` | Design system source (tokens CSS + composants) |
| `design/assets/key-art.jpg` | Visuel officiel de la saison (contient le logo) |

### Ouvrir le prototype
Servir le dossier `design/` avec un serveur statique (`npx serve design`) puis ouvrir `Le Grand Prono Prototype.dc.html`. Téléphone à gauche, admin à droite. Les boutons au-dessus du téléphone permettent de sauter d'écran en écran. Le réglage `grandsOuverts` (props du composant) bascule les grands pronos en mode ouvert pour tester la sélection « 8 de la tournée ».

## Priorités (non négociables)
1. **Interface premium** : sombre, sobre, jamais kitsch. Respecter le design system à la lettre.
2. **Mécanique irréprochable** : verrouillage et calcul des points **côté serveur**, idempotents, historisés, testés.
3. **Admin extrêmement simple** : toute la saison doit pouvoir se gérer sans toucher au code.

## Critères d'acceptation
Les 8 scénarios de `docs/03-scoring-engine.md § Scénarios` doivent passer en tests automatisés (pgTAP ou Vitest contre une base Supabase locale) **et** à la main dans l'UI.

## Assets
- `key-art.jpg` : visuel officiel Star Academy (1920×1080). Il contient le logo officiel : ne pas le redessiner. Il faudra une autorisation des ayants droit pour tout usage public.
- Icônes : **Lucide** (`lucide-react` en production ; police `lucide-static@0.460.0` dans le prototype).
- Polices : **Kanit** (display, chiffres) et **Plus Jakarta Sans** (texte), via Google Fonts.
- Photos candidats : **à fournir**. Le prototype affiche des tuiles dégradées avec l'initiale en attendant. Prévoir l'upload dans Supabase Storage.
