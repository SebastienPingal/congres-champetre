# features/participation

Components for the user's attendance registration.

| File | Component | Purpose |
|---|---|---|
| `presence-section.tsx` | `PresenceSection` | RSVP card: attending checkbox, day selection (BOTH/DAY1/DAY2), sleeping on-site, Google Calendar button |
| `edition-info-card.tsx` | `EditionInfoCard` | Static info: location, dates, participant count |
| `alert-banner.tsx` | `AlertBanner` | Amber warning banner listing incomplete actions (presence, meals, conference) |

**Data:** Uses `useUpdateProfile()` from `src/hooks/use-user-profile.ts`. Receives `UserProfile` as prop from the dashboard.

**Section IDs:** `#section-presence` — used by `AlertBanner` for scroll-to anchoring.
