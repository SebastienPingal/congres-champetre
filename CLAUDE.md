# CLAUDE.md

Guide de navigation pour Claude Code dans ce dépôt. Pour comprendre l'architecture en profondeur, voir [`ARCHITECTURE.md`](./ARCHITECTURE.md). Pour les points d'amélioration connus, voir [`REFACTOR.md`](./REFACTOR.md).

## TL;DR

App Next.js 15 (App Router) + PostgreSQL/Prisma + NextAuth (OAuth) + TanStack Query + Stripe + Nodemailer. UI **en français**, code en anglais. Une seule `Edition` active à la fois — tout le métier est scopé à l'édition active via `getActiveEdition()` (`src/lib/edition.ts`).

## Commandes

```bash
pnpm dev              # http://localhost:3000
pnpm build            # prisma generate + migrate deploy + next build
pnpm lint
pnpm db:migrate       # prisma migrate dev (nécessite la DB up)
pnpm db:generate
pnpm db:seed          # crée une édition active + 3 slots si vide (PAS d'admin malgré le nom)
pnpm db:studio
docker-compose up -d  # PostgreSQL sur port 5434
```

Pas de tests automatisés à ce jour. `pnpm lint` est la seule vérification statique au-delà du compilateur TS.

## Carte du code

```
prisma/schema.prisma        # source de vérité du modèle (voir aussi ARCHITECTURE.md §3)
prisma/migrations/          # 12 migrations, ordre = timeline du projet

src/middleware.ts           # redirects / + protège /dashboard et /admin
src/app/layout.tsx          # AuthProvider > QueryProvider (ordre important)

src/app/
├── page.tsx                # délégué au middleware
├── auth/{signin,signup}/   # OAuthButtons (Google/GitHub/Discord)
├── dashboard/page.tsx      # orchestrateur — assemble features (~65 lignes)
├── admin/page.tsx          # éditions + timeslots + conferences + stats (utilise fetch direct, pas React Query)
├── admin/users/page.tsx    # UsersTable
├── admin/emails/page.tsx   # broadcast email form
└── api/                    # voir tableau ci-dessous

src/features/               # UI feature-sliced — chaque dossier a un CLAUDE.md
├── participation/          # presence-section, edition-info-card, alert-banner
├── meals/                  # meals-section, payment-section (Stripe-only)
├── conferences/            # conferences-section, conference-edit-form, conference-delete-button
├── onboarding/             # onboarding-modal + steps/ (attending/days/sleeping/meals/speaking/conference)
└── program/                # program-section (lecture seule)

src/hooks/                  # React Query hooks (un CLAUDE.md ici)
├── use-user-profile.ts     # useUserProfile, useUpdateProfile
├── use-meals.ts            # useMeals, useUpdateMealStatus
├── use-conferences.ts      # useCreate/Update/DeleteConference
└── use-time-slots.ts       # useTimeSlots (staleTime 60s)

src/lib/
├── auth.ts                 # NextAuth config (JWT strategy, Google/GitHub/Discord)
├── prisma.ts               # singleton (globalThis en dev)
├── stripe.ts               # singleton lazy via getStripe()
├── edition.ts              # getActiveEdition() / getActiveEditionId() / isRegistrationClosed() / getRegistrationDeadline() — THROW si aucune active
├── mail.ts                 # sendBroadcastEmail + markdown → HTML safe
├── query-keys.ts           # factory typée pour React Query
├── helper.ts               # formatDateTimeRange (fr-FR)
└── utils.ts                # cn() (clsx + tailwind-merge)

src/types/index.ts          # interfaces partagées (UserProfile, MealSlot, TimeSlot, …)

src/components/
├── ui/                     # shadcn/ui primitives — ne pas modifier sauf cas précis
├── admin/                  # composants admin (CLAUDE.md ici) — utilisent fetch direct
├── providers/              # AuthProvider, QueryProvider (CLAUDE.md ici)
├── navbar.tsx
├── oauth-buttons.tsx
├── conference-form.tsx     # ⚠ référencé par features/conferences mais vit en components/
├── conference-edit-form.tsx       # ⚠ dupliqué avec features/conferences/conference-edit-form.tsx
└── conference-delete-button.tsx   # ⚠ dupliqué avec features/conferences/conference-delete-button.tsx

scripts/seed.ts             # crée Edition active + 3 timeslots si la DB est vide
```

## CLAUDE.md secondaires

Ces fichiers documentent leur dossier en détail — consulte-les avant de modifier un composant :

- `src/features/CLAUDE.md` — règles de découpage feature-sliced
- `src/features/participation/CLAUDE.md`
- `src/features/meals/CLAUDE.md`
- `src/features/conferences/CLAUDE.md`
- `src/features/onboarding/CLAUDE.md`
- `src/features/program/CLAUDE.md`
- `src/hooks/CLAUDE.md`
- `src/types/CLAUDE.md`
- `src/components/admin/CLAUDE.md`
- `src/components/providers/CLAUDE.md`
- `src/app/api/payments/CLAUDE.md`

## Modèle de données (vue rapide)

```
User —< EditionParticipation >— Edition —< TimeSlot —1?1— Conference >— User (speaker)
                                   \                  \
                                    \                   —< MealRegistration >— User
                                     —< PaymentIntent
```

Détail dans `ARCHITECTURE.md §3` ; source de vérité : `prisma/schema.prisma`.

Points à retenir :

- `Edition.isActive` : au plus une `true` à un instant donné, garanti applicativement par `PATCH /api/editions/[id]` dans une transaction Prisma.
- `EditionParticipation` (`@@unique([userId, editionId])`) porte **toutes** les réponses du participant : `isAttending`, `attendanceDays`, `sleepsOnSite`, `hasPaid`, `willPayInCash`, `onboardingCompletedAt`, `stripePaymentIntentId/Status`, `paidAmount`. `onboardingCompletedAt = null` → la modal s'affiche.
- `Conference.timeSlotId` est `String? @unique` → un slot a au plus une conférence.
- `TimeSlot.kind` : `CONFERENCE | MEAL | BREAK | OTHER`. Les `MEAL` ont `description`, `price`, `showInRegistration` en plus.
- `MealRegistration` n'existe que si le user a coché PRESENT/ABSENT. Pas de ligne = pas répondu.
- `PaymentIntent` est un journal d'audit Stripe, distinct des champs `stripePaymentIntentId/Status` qui pointent vers le dernier intent en cours.

## API en un coup d'œil

Voir `ARCHITECTURE.md §6` pour le tableau exhaustif. Quelques routes critiques :

| Route | Méthode | Particularité |
|---|---|---|
| `/api/user/profile` | GET/PATCH | Le moteur central — fusionne updates User et EditionParticipation |
| `/api/onboarding` | POST | Distinct de PATCH profile : pose `onboardingCompletedAt` |
| `/api/payments/intent` | POST | Montant **toujours** recalculé en DB, jamais accepté du client. Reste ouvert après la fermeture des inscriptions. |
| `/api/payments/webhook` | POST | **`request.text()` pour le body brut** — vital pour `constructEvent` |
| `/api/editions/[id]` | PATCH | `isActive: true` désactive les autres dans une transaction |
| `/api/admin/users` | DELETE | Supprime la **participation**, pas le User |

Routes admin : chaque handler refait `prisma.user.findUnique` pour vérifier `role === "ADMIN"`. Pattern répété ~10× (cf. `REFACTOR.md`).

## Patterns à respecter

**Récupérer l'édition active** dans une route API :

```ts
import { getActiveEdition } from "@/lib/edition"
const activeEdition = await getActiveEdition()
// ⚠ throw si aucune édition active n'existe → le try/catch de la route renvoie 500
```

**Auth dans une route API** :

```ts
const session = await auth()
if (!session?.user) return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
// Pour admin :
const me = await prisma.user.findUnique({ where: { id: session.user.id } })
if (me?.role !== "ADMIN") return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
```

**Hook de mutation React Query** : sur succès, soit `setQueryData` (cache write direct, ex. `useUpdateProfile`), soit `invalidateQueries({ queryKey: queryKeys.X })` (ex. `useCreateConference`). Les clés sont dans `src/lib/query-keys.ts` — ne pas inliner des `["..."]` ailleurs.

**Composant client/serveur** : tout ce qui consomme `useSession`, `useQuery`, ou un hook Radix doit être `"use client"`. Les pages `/dashboard` et `/admin/*` le sont déjà.

**Stripe** : ne jamais accepter le montant depuis le client. Toujours recalculer côté serveur depuis `MealRegistration.status === "PRESENT"` et `TimeSlot.price`. Le dashboard utilise `PaymentSection` (`features/meals/payment-section.tsx`) — c'est le seul moyen de payer côté participant (pas de virement/IBAN/liquide dans l'UI). Le champ `willPayInCash` reste accessible uniquement depuis `/admin/users` pour marquer manuellement les paiements en espèces.

**Fermeture des inscriptions** : par défaut 7 jours avant `edition.startDate`. Tout endpoint qui modifie la participation (`/api/user/profile` PATCH, `/api/meals` POST, `/api/onboarding` POST, `/api/conferences` POST + `[id]` PATCH/DELETE) renvoie `409` après ce délai pour les non-admins. L'UI passe en read-only et affiche un badge « Inscriptions fermées ». `/api/payments/intent` reste ouvert pour permettre aux utilisateurs déjà inscrits de payer en retard.

**Email** : passer par `sendBroadcastEmail()`. Le markdown est converti via un parser maison (lignes, listes `-`/`*`, `**bold**`, `*italic*`, `[link](url)`, `` `code` ``) avec `escapeHtml` au préalable.

**i18n** : strings user-facing en français. Variables, fonctions, types : anglais.

## Pièges connus

1. **Sans édition active**, presque toutes les pages user et tous les endpoints `/api/*` (sauf auth, editions list, et admin/emails avec `filter=all`) retournent une 500. Toujours seeder ou créer une édition active avant la première utilisation.
2. **`pnpm db:seed`** ne crée **pas** d'admin (malgré le commentaire dans `package.json` et `SETUP.md`). Promouvoir un user en ADMIN via Prisma Studio ou SQL direct après son premier login OAuth.
3. **`webhook` Stripe** : utiliser `request.text()`, jamais `request.json()` — sinon la signature ne vérifie pas. Et la route est en `dynamic = "force-dynamic"`.
4. **Composants `conference-form` / `conference-edit-form` / `conference-delete-button`** existent en double (dans `components/` et `features/conferences/`). Les versions `features/*` utilisent les hooks React Query ; les versions `components/*` utilisent du fetch direct et sont consommées par l'admin. Voir `REFACTOR.md`.
5. **`/admin/page.tsx`** n'utilise pas React Query — il fait des `fetch` + `useState` directement. Si tu y ajoutes des données, suis le pattern existant ou migre l'ensemble vers les hooks (mais c'est un refactor non trivial).
6. **PostgreSQL en local** sur le port **5434** (pas 5432) via `docker-compose.yml`.
7. **Migrations 2026** : les noms incluent des dates futures (2026-02, 2026-04, 2026-05) — c'est intentionnel, calé sur l'événement.

## Documents annexes

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — vue d'ensemble détaillée, modèle de données, flux métier
- [`REFACTOR.md`](./REFACTOR.md) — inconsistances et opportunités de refactor identifiées
- [`README.md`](./README.md) — présentation publique (⚠ contient des infos obsolètes sur l'auth email/password)
- [`SETUP.md`](./SETUP.md) — setup local (⚠ contient des infos obsolètes sur l'admin seedé)
- [`PROD.md`](./PROD.md) — checklist de mise en prod (à jour pour Stripe)
- [`oauth-setup.md`](./oauth-setup.md) — config OAuth Google/Discord/GitHub
