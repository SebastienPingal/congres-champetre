# src/types

Shared TypeScript interfaces used across the entire app.

- **index.ts** — All domain types: `UserProfile`, `MealSlot`, `TimeSlot`, `ConferenceRecord`, `EditionInfo`, plus enums (`AttendanceDays`, `MealStatus`, `SlotKind`, `Role`).

These interfaces mirror the Prisma schema shape as returned by the API routes. When adding a new field to the DB, update the relevant interface here AND the API route response.
