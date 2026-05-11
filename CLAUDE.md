# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Congrès Champêtre is a French-language web app for organizing a weekend conference event. Participants can register, propose talks, and select preferred time slots. Admins manage editions, time slots, conference assignments, and send emails to participants.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build (runs prisma generate + migrate deploy + next build)
pnpm lint             # ESLint
pnpm db:migrate       # Run Prisma migrations (prisma migrate dev)
pnpm db:generate      # Generate Prisma client
pnpm db:seed          # Seed DB with admin user and sample data (tsx scripts/seed.ts)
pnpm db:studio        # Open Prisma Studio GUI
docker-compose up -d  # Start PostgreSQL on port 5434
```

## Architecture

- **Framework**: Next.js 15 App Router with TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives), components in `src/components/ui/`
- **Auth**: NextAuth.js v5 (beta) with JWT strategy, PrismaAdapter, OAuth providers (Google/GitHub/Discord). Config in `src/lib/auth.ts`. Custom signin page at `/auth/signin`.
- **Database**: PostgreSQL via Prisma ORM. Schema at `prisma/schema.prisma`. Client singleton in `src/lib/prisma.ts`.
- **Email**: Nodemailer with SMTP, config via env vars. Helper in `src/lib/mail.ts`.
- **Server state**: TanStack Query v5 (`@tanstack/react-query`). `QueryProvider` wraps the app in `layout.tsx`. Hooks in `src/hooks/`. Query keys in `src/lib/query-keys.ts`.
- **Payments**: Stripe (`stripe` + `@stripe/react-stripe-js`). API routes at `src/app/api/payments/`. Stripe singleton at `src/lib/stripe.ts`.

## Source Structure

```
src/
├── app/
│   ├── dashboard/page.tsx      # Thin orchestrator (~60 lines), imports feature sections
│   ├── admin/                  # Admin pages
│   └── api/
│       ├── user/profile/       # GET + PATCH user participation data
│       ├── onboarding/         # POST — complete onboarding wizard
│       ├── payments/
│       │   ├── intent/         # POST — create Stripe PaymentIntent
│       │   └── webhook/        # POST — handle Stripe events (raw body!)
│       ├── conferences/        # CRUD
│       ├── meals/              # GET + POST meal registrations
│       └── timeslots/          # GET time slots
├── features/                   # Feature-sliced UI (see src/features/CLAUDE.md)
│   ├── participation/          # Presence, edition info, alert banner
│   ├── meals/                  # Meal toggles + Stripe payment block
│   ├── conferences/            # Conference proposal/edit/delete
│   ├── onboarding/             # First-visit modal (4 steps)
│   └── program/                # Weekend schedule display
├── hooks/                      # React Query hooks (see src/hooks/CLAUDE.md)
├── types/                      # Shared TypeScript interfaces
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client singleton
│   ├── edition.ts              # getActiveEdition() / getActiveEditionId()
│   ├── query-keys.ts           # Typed React Query key factory
│   ├── stripe.ts               # Stripe singleton
│   ├── mail.ts                 # Nodemailer helper
│   └── helper.ts               # formatDateTimeRange()
└── components/
    ├── ui/                     # shadcn/ui primitives
    ├── navbar.tsx
    ├── oauth-buttons.tsx
    └── providers/
        ├── auth-provider.tsx
        └── query-provider.tsx
```

## Key Concepts

- **Editions**: The app supports multiple event editions. Only one edition is active at a time (`isActive: true`). Use `getActiveEdition()` / `getActiveEditionId()` from `src/lib/edition.ts` to get it. Time slots, conferences, and participations are all scoped to an edition.
- **Roles**: `USER` and `ADMIN` (enum in Prisma). Role is stored in JWT token and available in `session.user.role`.
- **Middleware** (`src/middleware.ts`): Redirects `/` to `/dashboard` (authenticated) or `/auth/signin` (unauthenticated). Protects `/dashboard` and `/admin` routes.

## API Routes

All under `src/app/api/`:
- `auth/[...nextauth]/` — NextAuth handler
- `auth/register/` — User registration
- `conferences/` and `conferences/[id]/` — CRUD for conferences
- `editions/` and `editions/[id]/` — CRUD for editions
- `timeslots/` and `timeslots/[id]/` — CRUD for time slots
- `user/profile/` — User profile management (GET + PATCH). Returns `onboardingCompletedAt` and `hasPaid`.
- `onboarding/` — POST: complete onboarding, sets `onboardingCompletedAt = now()`
- `payments/intent/` — POST: create Stripe PaymentIntent for meal total
- `payments/webhook/` — POST: receive Stripe events (use `request.text()` for raw body!)
- `admin/emails/`, `admin/stats/`, `admin/users/` — Admin endpoints

## Database

PostgreSQL runs on port **5434** (not default 5432) via docker-compose. Connection string: `postgresql://postgres:password@localhost:5434/congres_champetre`.

Key models: `User`, `Edition`, `EditionParticipation`, `TimeSlot`, `Conference`, `PaymentIntent`. A `Conference` has an optional one-to-one relation with `TimeSlot` (via unique `timeSlotId`). `TimeSlot` has a `kind` enum: `CONFERENCE`, `MEAL`, `BREAK`, `OTHER`.

`EditionParticipation` has: `isAttending`, `attendanceDays`, `sleepsOnSite`, `hasPaid`, `willPayInCash`, `onboardingCompletedAt` (null = onboarding not done), `stripePaymentIntentId`, `stripePaymentStatus`, `paidAmount`.

**After schema changes**, run `pnpm db:migrate` (needs running DB) then `pnpm db:generate`.

## Language

The UI and user-facing strings are in **French**. Code (variables, functions, comments in lib files) is in English.
