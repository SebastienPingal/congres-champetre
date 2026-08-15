# src/components/admin

Admin-only components for managing editions, time slots, and conferences.

| File | Purpose |
|---|---|
| `edition-manager.tsx` | 2-step wizard: Step 1 creates the edition (name + weekend dates), Step 2 adds optional meal slots. Uses `MealSlotFields`. |
| `timeslot-manager.tsx` | CRUD for time slots. Shows all slots for the active edition. When kind=MEAL, uses `MealSlotData` state for extra fields (description, price, showInRegistration). |
| `meal-slot-fields.tsx` | Reusable form block for a single meal slot (title, start/end datetime, description, price, showInRegistration). Used by edition-manager wizard. Exports `MealSlotData` interface and `emptyMealSlot()` factory. |
| `conference-manager.tsx` | Liste des conférences de l'édition active (édition / suppression) + bouton d'ajout. Les conférences générales portent un badge « Conférence générale ». |
| `conference-create-dialog.tsx` | Création admin d'une conférence. Deux modes : rattachée à un participant inscrit (`speakerId`), ou **générale** (`speakerId: null` + `speakerName` libre optionnel). Assignation de créneau CONFERENCE facultative. |
| `users-table.tsx` | Tableau admin des inscrits (tri, colonnes masquables, édition inline des repas / paiements). Délègue toute la logique de filtrage à `users-filters.tsx`. |
| `users-filters.tsx` | Barre de filtres de `/admin/users`. Expose `useUsersFilters()` (état + persistance localStorage), `<UsersFilters />` (UI) et `matchesFilters(user, filters)` (prédicat). |

**Ajouter un filtre utilisateur :** ajouter une entrée dans `SELECT_FILTERS` (`users-filters.tsx`) avec sa `key`, son `label`, ses `options` et son prédicat `matches` — plus une valeur par défaut `"ALL"` dans `DEFAULT_FILTERS`. L'UI, le comptage des filtres actifs, la persistance et le filtrage suivent automatiquement. Les combinaisons en un clic vivent dans `PRESETS`.

**Edition creation flow:**
1. Admin clicks "Nouvelle édition" → wizard opens at step 1
2. Fills name + weekend dates → POST `/api/editions` → edition created (inactive)
3. Step 2 shown → admin adds meal slots via `MealSlotFields` → each slot posted to `POST /api/timeslots` with `editionId` body param
4. Admin clicks "Terminer" → dialog closes, editions list refreshes

**API note:** `POST /api/timeslots` accepts an optional `editionId` body param (admin only). If omitted, falls back to the active edition.
