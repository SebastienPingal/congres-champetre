# features/participation

Components for the user's attendance registration.

| File | Component | Purpose |
|---|---|---|
| `presence-section.tsx` | `PresenceSection` | Flat RSVP block: tri-state "présent ?" / jours / hébergement / Google Calendar |
| `edition-info-card.tsx` | `EditionInfoCard` | Strip inline (sans Card) — Lieu / Dates / Participants avec icônes vertes mutées |
| `alert-banner.tsx` | `AlertBanner` | Amber warning banner listing incomplete actions (presence, meals, conference) |

**Data:** Uses `useUpdateProfile()` from `src/hooks/use-user-profile.ts`. Receives `UserProfile` as prop from the dashboard.

**Layout :** `PresenceSection` est un `<section>` plat (pas de `Card`). Statut affiché via badge outline subtil (amber « À compléter » / green « Confirmé » / gray « Inscriptions fermées »).

**Section IDs:** `#section-presence` — historiquement utilisé par `AlertBanner` pour scroll-to. ⚠ Avec le layout sidebar/sections mutuellement exclusives, l'ancrage ne scrolle plus vers une section masquée — à refactorer si la nav inter-sections via `AlertBanner` redevient utile (lifter `setActive` du dashboard).
