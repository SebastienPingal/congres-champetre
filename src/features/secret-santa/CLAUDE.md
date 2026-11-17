# features/secret-santa

Inscription puis révélation du Secret Santa côté participant (page `/secret-santa`).

| File | Component | Purpose |
|---|---|---|
| `secret-santa-section.tsx` | `SecretSantaSection` | Orchestration : pas ouvert / inscription / tiré mais exclu / cadeau à ouvrir / ouvert |
| `secret-santa-opt-in.tsx` | `SecretSantaOptIn` | Visible entre l'activation et le tirage (`useUpdateProfile({ wantsSecretSanta })`). Trois états : pas répondu → question oui / non ; inscrit → « Tu participes ! » + lien discret « Me désinscrire » (avertit si pas présent) ; refusé → « Finalement, je participe » |
| `gift-reveal.tsx` | `GiftReveal` | Animation pure CSS : cadeau qui se dandine → tremble → couvercle qui saute, confettis, carte avec le nom |

**Cycle de vie :** désactivé → activé par l'admin (`Edition.secretSantaEnabled`) → les participants répondent (`EditionParticipation.wantsSecretSanta`) → tirage parmi les volontaires présents → choix verrouillé.

**Données :** `useSecretSanta()` / `useRevealSecretSanta()` (`src/hooks/use-secret-santa.ts`). `GET /api/secret-santa` renvoie aussi `enabled`, `drawn`, `wantsSecretSanta`, `isAttending`.
- `GET /api/secret-santa` ne renvoie **jamais** le nom tant que `revealedAt` est null — il n'arrive qu'au `POST /api/secret-santa/reveal`, qui pose `revealedAt` à la première ouverture.
- Un cadeau déjà ouvert s'affiche directement ouvert (`instant`), sans animation

**Phases (`GiftPhase`) :** `closed` → `shaking` (au moins `SHAKE_MS`, en parallèle de l'appel API) → `open`.

**Animations :** keyframes `ss-*` dans `src/app/globals.css` (bloc « Secret Santa »), neutralisées sous `prefers-reduced-motion`.

**Navbar :** l'onglet « Secret Santa » apparaît dès que `enabled` (ou si `assigned`). Pastille : présent sans réponse avant le tirage, puis cadeau pas encore ouvert.

**Autres points d'inscription** (hors de ce dossier) : ligne « Participer au Secret Santa ? » dans `PresenceSection` (présents seulement), étape `secretSanta` de l'onboarding, rappel dans `AlertBanner`.

**Habillage festif :** les blocs portent `.ss-festive` (liseré sucre d'orge, halos, `<Snowflakes />` de `src/components/snowflakes.tsx`) et les badges « à faire » `.ss-badge-red`. Tout dérive des tokens du thème actif (`--red`, `--green`, `--surface`), donc ça suit Champêtre / Vermeil / Noël en clair comme en sombre.
