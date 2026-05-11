# src/features

Feature-sliced folder. Each subfolder owns one domain: components, helpers, and anything specific to that feature.

| Folder | Domain |
|---|---|
| `participation/` | Presence RSVP, attendance days, sleeping on-site, edition info card, alert banner |
| `meals/` | Meal registration toggles (PRESENT/ABSENT), payment mode selector, Stripe card payment |
| `conferences/` | Conference proposal form, edit form, delete button, speaker toggle section |
| `onboarding/` | First-visit step-by-step modal (4 questions, "je ne sais pas encore" on each) |
| `program/` | Weekend schedule display (read-only, grouped by day) |

**Dependency rule:** Feature components import from `src/hooks/` but NOT from other features. Shared UI goes in `src/components/ui/`.

Each feature folder has its own `CLAUDE.md` with specifics.
