# Star Academy – Le Grand Prono · Design System

**Le Grand Prono** is a friends-only prediction game (pronostics, no money) built around each season of the TV show *Star Academy*. From the first prime, players predict the big outcomes — winner, finalists, the 8 candidates of the tour, weekly nominations, the couple of the season — plus weekly pronos that move the league ranking. Players create private leagues, follow the ranking live, and chase bonus challenges, stats and rewards until the final.

Two surfaces:
- **Mobile app** (primary, iOS/Android) — play weekly pronos, grands pronos, league ranking, profile. → `ui_kits/app/`
- **Website** — marketing landing + logged-in league dashboard. → `ui_kits/web/`

Brief: ergonomic and fluid; premium and immersive, but fun.

## Sources
- `uploads/a0WP5000000mGLpMAM_original.jpg` — official *Star Academy* key art (1920×1080), copied to `assets/key-art.jpg`. It is the **only** provided source. No codebase, Figma, logo file, fonts or product screens were supplied — every component and screen here is an original design derived from the key art's palette and mood.
- The show's logo only exists baked into the key art. **No standalone logo file exists in this system**; the product name is set in type (see "Wordmark"). Do not redraw the Star Academy logo. Using the show's name/imagery in a public product likely requires a licence from the rights holder.

## Index
- `styles.css` — entry point (imports only): Google Fonts, Lucide icon font, `tokens/*`, `components/components.css`.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (radii, shadows, glows, motion), `base.css` (body defaults + `.gp-*` type/text utilities).
- `components/` — React primitives + shared `components.css` (`gp-*` classes).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `ui_kits/app/`, `ui_kits/web/` — click-through recreations.
- `assets/key-art.jpg` — hero imagery.
- `thumbnail.html`, `SKILL.md`.

## Components
All read from `window.LeGrandPronoDesignSystem_2fc6cd` in consuming HTML.
- **core/** — Icon, Button, IconButton, Badge, Avatar
- **forms/** — Input, Switch, Checkbox, SegmentedControl
- **display/** — Card, CandidateCard, PronoCard, PointsChip, Countdown, ProgressBar, LeaderboardRow, StatTile
- **navigation/** — Tabs, BottomNav
- **feedback/** — Toast, Dialog

No source defined an inventory, so this is an authored standard set sized to a prediction game; domain components (CandidateCard, PronoCard, PointsChip, Countdown, LeaderboardRow) replace generic ones (Select, Tooltip were intentionally omitted — pick grids and segmented controls cover selection on mobile).

---

## CONTENT FUNDAMENTALS
- **Language:** French. **Tutoiement always** ("à toi de prouver", "Valider ton prono ?"). The product speaks as a playful host/friend, never as a brand "nous" corporate voice; "on" is fine ("On réessaie dans un instant.").
- **Tone:** competitive banter, confident, warm. Short sentences with rhythm: *"Une saison. Des pronos. Un seul gagnant."* Challenge the player ("Tes amis t'attendent déjà."), celebrate wins ("+30 pts ! Bien vu, Inès est sauvée."), soften losses (never mock the user).
- **Show vocabulary** is used as-is: *prime, nominé·e, sauvé·e, évaluations, château, tournée, finale, candidat·e*. Product vocabulary: *prono(s), grand prono, ligue, classement, joker, défi bonus, points (pts)*.
- **Casing:** sentence case for UI and headlines. UPPERCASE only via the overline/badge styles (tracked 0.14em): "PRIME 6 · SAMEDI 21H10", "EN DIRECT". Button labels are verb-first, sentence case: "Valider mon prono", "Créer ma ligue", "Rejoindre la ligue".
- **Numbers:** points as "+30 pts" / "371 pts" (French typographic space before ! ? : is respected: "Valider ton prono ?"). Times as "21h10", dates as "sam. 21h". Ranks "#3".
- **Inclusive writing:** use the middle dot where gender is unknown — "Gagnant·e", "Éliminé·e".
- **Emoji:** not used in UI. Icons carry meaning. (User-generated league names may contain emoji.)
- **Legal honesty:** always "jeu entre amis, sans argent". Never use gambling vocabulary like "mise d'argent", "cote", "gains" in the money sense; "tu mises sur…" is acceptable only for points.

## VISUAL FOUNDATIONS
- **Mood:** a TV stage at night — deep violet darkness, magenta haze, one hot orange flare, glitter. Dark-mode only.
- **Color:** backgrounds are violet-950/900 (`--surface-page` #0d0322). Surfaces are translucent white over violet (glass, 6–14%). One warm accent does the work: **flare orange → magenta** CTA gradient. Gold is reserved for points, rank #1 and rewards. Cyan is the focus/rim-light color only. Green/red only for point gains/losses and movement.
- **Gradients:** only the named ones — `--grad-stage` (hero backgrounds; radial orange flare top-left over violet), `--grad-cta`, `--grad-gold`, `--grad-glitter` (headline text + glitter buttons), `--grad-edge` (hairline card borders). No other gradients.
- **Type:** *Kanit* italic 700–900 for display, headings and all numbers — it echoes the heavy slanted show logo. *Plus Jakarta Sans* for body and UI labels. Numbers are always Kanit italic, tabular. Key headlines may use glitter-gradient text (one per screen).
- **Signature motif — the slant:** points chips are skewed −10° (text counter-skewed), display type is italic. Use the slant for scoring moments only.
- **Imagery:** the key art is the hero background (full-bleed, `cover`), always under a **protection gradient** (violet→transparent, left-to-right on desktop, top-to-bottom on mobile) so type sits on flat dark violet. Imagery vibe: saturated purple/magenta with warm orange light, sparkle bokeh, no grain. Candidate photos are circular with optional colored rings.
- **Backgrounds:** page background is flat `--surface-page` with a soft violet radial glow at the top; never a repeating pattern.
- **Cards:** radius 20 (`--radius-lg`), 1px inner white hairline at 10%, soft deep shadow (`--shadow-card`), glass blur 18px. Variants: glass (default), solid, stage (one hero per screen), edge (gradient hairline for bonus/premium). No colored left-border cards.
- **Radii:** 6 / 10 / 14 / 20 / 28 / pill. Buttons, badges, segmented controls, avatars are pills/circles; fields 14; cards 20; dialogs 28.
- **Shadows & glow:** depth = dark shadows; emphasis = colored glow (`--glow-flare` on primary CTA, `--glow-gold` on rewards, `--glow-cyan` focus ring). Active icons get a matching drop-shadow glow.
- **Borders:** 1px `rgba(255,255,255,.10)` subtle, .22 strong, magenta glow on hover.
- **Transparency & blur:** blur 18px on glass cards, sticky headers, bottom nav, toasts; 10px + 72% violet scrim behind dialogs.
- **Hover:** surfaces lighten (+4% white) and borders turn magenta-glow; CTA gradient brightens; interactive cards lift 2px.
- **Press:** scale(.97) (icon buttons .92), 120ms.
- **Animation:** `--ease-out` for UI (200ms), `--ease-spring` for selection ticks, toggles, toasts and dialogs pop (320ms). Live badge pulses. Progress fills over 600ms. No page-level parallax, no bouncing loops.
- **Layout:** mobile gutter 20px, bottom nav 72px fixed with raised center "Pronos" action; sticky CTA over a bottom protection gradient on pick screens. Desktop max width 1200, gutter 40, sticky blurred header 72px, sticky right aside.
- **Density:** generous — min tap 44px, fields 52px, list rows 60px.

## ICONOGRAPHY
- **System:** [Lucide](https://lucide.dev) via the `lucide-static@0.460.0` icon font (linked from unpkg in `styles.css`). Use through the `<Icon name="trophy"/>` component (or `<i class="gp-icon icon-trophy">`). 2px stroke, rounded caps — matches the rounded, friendly UI. **Substitution flag:** no icon set was provided; Lucide is our choice.
- **Color:** icons inherit text color (secondary by default). Accent icons use flare, gold or magenta with a soft glow.
- **Key glyphs:** star (points, pronos), trophy (classement), crown (saison / gagnant), medal, ticket (tournée), heart (couple), flame (élimination, séries), users (ligue), bell, clock, zap (joker), sparkles (bonus), key-round (code de ligue).
- **No emoji, no unicode-as-icon**, no custom-drawn SVG. No brand logo SVG exists.

## Wordmark
Until a real product logo exists: overline "STAR ACADEMY" (gold-200) above "Le Grand Prono" in Kanit 900 italic with `.gp-glitter-text`. See `guidelines/brand-wordmark.html`.

## Fonts
Loaded from Google Fonts (no font files were provided): **Kanit** (display/numbers — chosen as nearest free match to the heavy italic show logo) and **Plus Jakarta Sans** (body). Replace with licensed brand fonts if they exist.
