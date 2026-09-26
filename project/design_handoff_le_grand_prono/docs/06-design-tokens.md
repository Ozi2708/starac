# 06 — Design tokens et composants

Source de vérité : `design/_ds/…/tokens/*.css` et `components/components.css`. Reporter ces valeurs dans `tailwind.config.ts` (`theme.extend`) et dans un `index.css` de variables CSS. **Mode sombre uniquement.**

## Couleurs
**Violet (fonds)** : 950 `#0d0322` · 900 `#170643` · 800 `#24106a` · 700 `#34179a` · 600 `#4a24c8` · 500 `#6a3cf0` · 400 `#8b67ff` · 300 `#b7a0ff` · 200 `#d8cbff` · 100 `#efe8ff`
**Magenta** : 700 `#8e1aa6` · 600 `#b42ccc` · 500 `#d243e6` · 400 `#e679f2` · 200 `#f5c6fa`
**Flare (accent CTA)** : 600 `#e8650c` · 500 `#ff8a1f` · 400 `#ffa64a` · 200 `#ffd7ab`
**Or (points, rang 1, récompenses uniquement)** : 500 `#f5b638` · 400 `#ffcb5c` · 200 `#ffe8b3`
**Cyan (focus uniquement)** : 500 `#2fc6f5` · 400 `#63d9ff` · 200 `#c2f0ff`
**États** : green-500 `#2fd99a`, green-200 `#b8f5dd` (gains, montée) · red-500 `#ff4a78`, red-200 `#ffc2d2` (pertes, descente, erreurs)

| Sémantique | Valeur |
|---|---|
| surface-page | `#0d0322` + halo `radial-gradient(120% 40% at 50% 0%, rgba(106,60,240,.28), transparent 70%)` |
| surface-raised | `#1a0850` |
| surface-solid | `#200b5c` |
| surface-card / hover / active | `rgba(255,255,255,.06)` / `.10` / `.14` |
| surface-overlay (scrim) | `rgba(9,2,26,.72)` + blur 10px |
| text-primary / secondary / muted | `#f6efff` / `#c9bde8` / `#9486bf` |
| text-inverse | `#170643` |
| border-subtle / strong / glow | `rgba(255,255,255,.10)` / `.22` / `rgba(230,121,242,.65)` |

## Dégradés autorisés (aucun autre)
- `grad-cta` : `linear-gradient(100deg,#ff9a2e 0%,#ff6a3d 38%,#d243e6 100%)` ; au survol : `#ffab4a / #ff7a52 / #e064f0`
- `grad-gold` : `linear-gradient(135deg,#ffe8b3 0%,#ffcb5c 45%,#f5961f 100%)`
- `grad-glitter` : `linear-gradient(180deg,#fff 0%,#efe3ff 45%,#c3adff 100%)`. Sert au texte des titres clés, **un seul par écran**.
- `grad-stage` : `radial-gradient(90% 70% at 22% 38%, rgba(255,138,31,.38) 0%, rgba(210,67,230,.22) 32%, rgba(74,36,200,0) 62%), linear-gradient(160deg,#34179a 0%,#170643 58%,#0d0322 100%)`
- `grad-edge` (bordure 1,5px des cartes premium) : `linear-gradient(135deg, rgba(255,166,74,.85), rgba(210,67,230,.6) 50%, rgba(99,217,255,.5))`
- `grad-protect` (sous les CTA collants) : `linear-gradient(180deg, rgba(13,3,34,0) 0%, rgba(13,3,34,.85) 70%, #0d0322 100%)`

## Typographie
- **Kanit** *italic* 700–900 : display, titres, **tous les chiffres** (`font-variant-numeric: tabular-nums`).
- **Plus Jakarta Sans** 400–700 : texte et libellés.

| Style | Valeur |
|---|---|
| display-xl | italic 900 64/1.0 Kanit, tracking −0.015em |
| display-l | italic 800 44/1.0 Kanit |
| h1 | italic 800 32/1.15 Kanit, tracking −0.015em |
| h2 | italic 700 24/1.15 Kanit |
| h3 | 700 19/1.15 Jakarta |
| body-l | 400 17/1.6 Jakarta |
| body | 400 15/1.45 Jakarta |
| body-s | 500 13/1.45 Jakarta |
| caption | 500 12/1.35 Jakarta |
| overline | 700 11/1.2 Jakarta, MAJUSCULES, tracking 0.14em |
| score | italic 800 28/1 Kanit |
| score héros (carte Mon classement) | italic 900 48/1 Kanit, `grad-gold` en texte, `padding-right: 6px` (sinon l'italique est rogné) |

## Espacements et gabarits
Échelle : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72 · 96.
Gouttière mobile 20 · desktop 40 · largeur max 1200 · cible tactile min 44 · champs 52 · lignes de liste 60 · barre du haut 56 · **BottomNav 72** (+ safe-area).
Espacement vertical entre sections de l'accueil : **28px**. En-tête de section : overline + 12px + contenu.

## Rayons, ombres, flous
Rayons : 6 · 10 · 14 (champs, tuiles stat) · **20 (cartes)** · 28 (dialogues, feuille) · pill (boutons, badges, avatars).
- shadow-card : `0 1px 0 rgba(255,255,255,.08) inset, 0 12px 32px -12px rgba(5,0,20,.7)`
- shadow-raised : `0 1px 0 rgba(255,255,255,.12) inset, 0 20px 48px -16px rgba(5,0,20,.85)`
- shadow-pop : `0 24px 64px -12px rgba(5,0,20,.9)`
- glow-flare (CTA) : `0 0 0 1px rgba(255,166,74,.45), 0 8px 28px -6px rgba(255,120,40,.65)`
- glow-gold : `0 0 0 1px rgba(255,203,92,.6), 0 0 24px -4px rgba(255,203,92,.55)`
- glow-cyan (focus) : `0 0 0 2px rgba(99,217,255,.8), 0 0 16px rgba(99,217,255,.4)`
- Flou glass 18px (cartes, nav, toasts) · scrim 10px.

## Mouvement
`ease-out cubic-bezier(.2,.8,.2,1)` · `ease-spring cubic-bezier(.34,1.56,.64,1)` · durées 120 / 200 / 320 / 600ms.
Pression : `scale(.97)` (boutons icône `.92`) en 120ms. Coche de sélection et pop des dialogues/toasts : spring 320ms. Barres de progression : 600ms. **Pas** de boucle, pas de parallaxe. Tout est désactivé sous `prefers-reduced-motion: reduce`.
Célébrations : discrètes (toast `points` + chiffre qui monte). Effets plus marqués **uniquement** pour la finale.

## Composants (classes de référence dans `components.css`)
- **Button** : pill ; sm 36 / md 48 / lg 56 de haut ; variantes `primary` (grad-cta + glow-flare + texte blanc), `secondary` (glass + bordure strong ; au survol, bordure glow), `glitter`, `ghost`, `danger`. `disabled` à 40 % d'opacité.
- **IconButton** : cercle 44, glass.
- **Badge** : pill 22px, overline tracking 0.1em. Tons `neutral`, `open` (vert), `closed`, `live` (rouge, point pulsé), `gold`, `magenta`.
- **Avatar** : cercle ; initiales en Kanit italic ; fond en dégradé (5 paires, choisies par hash du nom) ; anneaux `gold` (rang 1), `magenta` (moi), `flare` (sélection).
- **Card** : r20, variantes `glass`, `solid`, `stage` (un seul héros par écran), `edge` (bordure grad-edge, pour le premium).
- **CandidateCard** (sélection) : tuile glass r20, avatar 56–72, nom, méta ; sélectionnée : fond flare/magenta 20 %, anneau `inset 0 0 0 2px #ffa64a`, pastille de coche en spring. Candidat éliminé : 38 % d'opacité, `grayscale(.7)`, non cliquable.
- **CandidateTile** (grille Candidats) : ratio 3:4, r20, photo en `cover` ; dégradé bas `transparent 45% → rgba(13,3,34,.92)` ; prénom en Kanit italic 800 21px + Badge statut. Éliminé : photo `grayscale(1)` à 45 %.
- **PronoCard** : Badge statut + PointsChip, question en 17/700, pied de carte avec « ma réponse » ou « Pas encore joué » + horloge.
- **PointsChip** : **skew −10°**, texte contre-incliné, Kanit italic 800 14px ; tons gold, gain, loss, neutral ; lg = 34px.
- **Countdown** : cellules 48×52 (sm : 34×36), fond `rgba(9,2,26,.55)`, chiffres Kanit 28, libellés J / H / Min / Sec.
- **LeaderboardRow** : 60px ; rang Kanit 18 (1 en or, 2 en violet-200, 3 en flare-400) ; avatar 40 ; nom + sous-titre ; flèche ▲▼ (vert/rouge) ; points à droite. Ma ligne : fond flare→magenta 18/10 % et bordure `rgba(255,166,74,.45)`.
- **SegmentedControl** : piste pill 6 % ; option active en grad-glitter avec texte inverse.
- **BottomNav** : 72px, `rgba(13,3,34,.82)` + blur. 5 items : Accueil `house` · Candidats `users` · **Pronos `star` (bulle centrale 52px surélevée, grad-cta)** · Classement `trophy` · Profil `user`. Actif : icône flare-400 avec glow, barre de 3px en haut.
- **Toast** : r14, `rgba(32,11,92,.92)` + blur. Icône 32 selon le ton (success vert, points or, error rouge, info cyan). Entrée : translateY(12px) + scale(.96), spring.
- **Dialog** : r28, `linear-gradient(180deg,#2a0f72,#1a0850)`, scrim 72 % + blur.

## Wordmark
Overline « STAR ACADEMY » en gold-200 au-dessus de « Le Grand Prono » en Kanit 900 italic, texte en grad-glitter. Le **logo officiel** n'existe que dans `key-art.jpg` : l'afficher tel quel (cadrage `background: url(key-art.jpg) -60px 10px / 500px auto` sur un mobile de 390px), ne jamais le redessiner.
