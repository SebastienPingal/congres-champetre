# src/components/admin

Admin-only components for managing editions, time slots, and conferences.

| File | Purpose |
|---|---|
| `edition-manager.tsx` | 2-step wizard: Step 1 creates the edition (name + weekend dates), Step 2 adds optional meal slots. Uses `MealSlotFields`. |
| `timeslot-manager.tsx` | CRUD for time slots. Shows all slots for the active edition. When kind=MEAL, uses `MealSlotData` state for extra fields (description, price, showInRegistration). |
| `meal-slot-fields.tsx` | Reusable form block for a single meal slot (title, start/end datetime, description, price, showInRegistration). Used by edition-manager wizard. Exports `MealSlotData` interface and `emptyMealSlot()` factory. |

**Edition creation flow:**
1. Admin clicks "Nouvelle édition" → wizard opens at step 1
2. Fills name + weekend dates → POST `/api/editions` → edition created (inactive)
3. Step 2 shown → admin adds meal slots via `MealSlotFields` → each slot posted to `POST /api/timeslots` with `editionId` body param
4. Admin clicks "Terminer" → dialog closes, editions list refreshes

**API note:** `POST /api/timeslots` accepts an optional `editionId` body param (admin only). If omitted, falls back to the active edition.
