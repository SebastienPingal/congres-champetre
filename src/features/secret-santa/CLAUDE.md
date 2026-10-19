# features/secret-santa

Révélation du Secret Santa côté participant (page `/secret-santa`).

| File | Component | Purpose |
|---|---|---|
| `secret-santa-section.tsx` | `SecretSantaSection` | Orchestration : état vide (pas de tirage), cadeau à ouvrir, état ouvert |
| `gift-reveal.tsx` | `GiftReveal` | Animation pure CSS : cadeau qui se dandine → tremble → couvercle qui saute, confettis, carte avec le nom |

**Données :** `useSecretSanta()` / `useRevealSecretSanta()` (`src/hooks/use-secret-santa.ts`).
- `GET /api/secret-santa` ne renvoie **jamais** le nom tant que `revealedAt` est null — il n'arrive qu'au `POST /api/secret-santa/reveal`, qui pose `revealedAt` à la première ouverture.
- Un cadeau déjà ouvert s'affiche directement ouvert (`instant`), sans animation

**Phases (`GiftPhase`) :** `closed` → `shaking` (au moins `SHAKE_MS`, en parallèle de l'appel API) → `open`.

**Animations :** keyframes `ss-*` dans `src/app/globals.css` (bloc « Secret Santa »), neutralisées sous `prefers-reduced-motion`.

**Navbar :** l'onglet « Secret Santa » n'apparaît que si `assigned`, avec une pastille tant que le cadeau n'est pas ouvert.

**Habillage festif :** les blocs portent `.ss-festive` (liseré sucre d'orge, halos, `<Snowflakes />` de `src/components/snowflakes.tsx`) et les badges « à faire » `.ss-badge-red`. Tout dérive des tokens du thème actif (`--red`, `--green`, `--surface`), donc ça suit Champêtre / Vermeil / Noël en clair comme en sombre.
