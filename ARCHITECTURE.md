# Architecture — Congrès Champêtre

Document de référence sur l'architecture applicative, le modèle de données et les flux métier. Il complète le `CLAUDE.md` (qui sert d'index de navigation) en expliquant le « pourquoi » des choix techniques et la façon dont les morceaux s'imbriquent.

## 1. Vue d'ensemble

Application web monolithique Next.js 15 (App Router) qui sert :

- une **interface participant** (`/dashboard`) pour s'inscrire à un weekend, déclarer sa présence, ses repas et proposer une conférence ;
- une **interface admin** (`/admin/*`) pour gérer les éditions, les créneaux horaires, l'attribution des conférences, les utilisateurs et l'envoi d'emails groupés ;
- une **API REST** sous `/api/*` consommée par les deux interfaces ;
- un **webhook Stripe** pour synchroniser le statut de paiement.

Le tout est conçu pour un événement annuel récurrent : une seule édition est « active » à un instant donné, toutes les données métier (créneaux, conférences, participations, paiements) sont scopées à cette édition.

## 2. Stack technique

| Couche | Technologie | Notes |
|---|---|---|
| Runtime | Next.js 15 (App Router) + React 19 + TypeScript 5 | Server Components là où c'est utile, Client Components avec `"use client"` pour tout ce qui consomme React Query / NextAuth |
| Auth | NextAuth.js 5 (beta 29) + `@auth/prisma-adapter` | Strategy `jwt`, providers Google / GitHub / Discord (pas de credentials) |
| ORM | Prisma 6 | Client singleton (`src/lib/prisma.ts`) |
| DB | PostgreSQL 15 (Alpine) | Port **5434** local via `docker-compose.yml` (5432 en prod) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react | Primitives dans `src/components/ui/` |
| Server state | TanStack Query v5 + Devtools | `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, pas de refetch on focus |
| Formulaires | `react-hook-form` + `zod` + `@hookform/resolvers` | Surtout pour la validation côté API (le formulaire d'email admin par exemple) |
| Paiement | `stripe` v22 + `@stripe/react-stripe-js` v6 | PaymentIntents + webhook signé |
| Email | `nodemailer` + SMTP | Markdown léger → HTML safe, pièces jointes images < 5 MB |
| Dates | `date-fns` + `Intl.DateTimeFormat('fr-FR')` | Toutes les dates user-facing sont en français |
| Package manager | `pnpm` | `pnpm-lock.yaml` est la source de vérité |

## 3. Modèle de données

Schéma défini dans `prisma/schema.prisma`. Vue logique :

```
User ─┬─< Account / Session (NextAuth)
      ├─< Conference (speaker)
      ├─< EditionParticipation
      ├─< MealRegistration
      └─< PaymentIntent

Edition ─┬─< TimeSlot ─┬─ Conference (1:1 optionnel via timeSlotId unique)
         │             └─< MealRegistration
         ├─< Conference
         ├─< EditionParticipation
         └─< PaymentIntent
```

### Entités

- **User** : identité OAuth. `role: USER | ADMIN`. `wantsToSpeak: Boolean?` (intent global, indépendant de l'édition).
- **Edition** : un weekend. `isActive: Boolean` — au plus une édition active à la fois (contrainte applicative dans `PATCH /api/editions/[id]`). `startHour` / `endHour` bornent la grille horaire de l'éditeur de créneaux.
- **EditionParticipation** : table de jonction `User × Edition` avec toutes les réponses du participant à cette édition (présence, jours, dort sur place, paiement). `@@unique([userId, editionId])` garantit l'unicité.
- **TimeSlot** : créneau horaire de l'édition. `kind: CONFERENCE | MEAL | BREAK | OTHER`. Les MEAL ajoutent `description`, `price` (€), `showInRegistration` (visible côté participant).
- **Conference** : proposition de talk d'un user pour une édition. Lien optionnel vers un TimeSlot (1:1, `timeSlotId @unique`). Si le slot est rempli, plus aucune autre conférence ne peut s'y assigner.
- **MealRegistration** : statut d'un user pour un repas (`PRESENT` / `ABSENT`). Pas de ligne = pas encore répondu.
- **PaymentIntent** : journal d'audit Stripe (id, amount, currency, status). Distinct des champs `stripePaymentIntentId` / `stripePaymentStatus` sur `EditionParticipation` qui pointent vers le dernier intent en cours.

### Migrations

12 migrations dans `prisma/migrations/`. La séquence raconte l'évolution :

1. `20250805` init — schéma de base User/TimeSlot/Conference
2. `20250808` RSVP + TimeSlot kinds (conférence 1:1)
3. `20250812` suppression de `isAvailable`
4. `20250828` champs paiement Stripe
5. `20260224` passage multi-éditions (extraction `Edition` et `EditionParticipation`)
6. `20260412…` (×3) repas : description, prix, registration, statut, showInRegistration
7. `20260511…` (×3) onboarding + PaymentIntent, edition hours, option `UNKNOWN` dans `AttendanceDays`

## 4. Architecture applicative

### Routing (App Router)

```
src/app/
├── layout.tsx                    # AuthProvider > QueryProvider (ordre important)
├── page.tsx                      # délégué au middleware (redirect)
├── globals.css
├── middleware.ts                 # protège /dashboard et /admin, redirige /
├── auth/
│   ├── signin/page.tsx           # OAuthButtons only
│   └── signup/page.tsx           # idem (alias UX)
├── dashboard/page.tsx            # orchestrateur (~65 lignes) — assemble features
├── admin/
│   ├── page.tsx                  # créneaux + conférences + éditions + stats
│   ├── users/page.tsx            # UsersTable
│   └── emails/page.tsx           # formulaire de broadcast
└── api/                          # voir §6
```

### Middleware

`src/middleware.ts` enveloppe NextAuth (`auth((req) => …)`). Trois branches :

1. `/` → redirige vers `/dashboard` (si connecté) ou `/auth/signin`.
2. `/dashboard` ou `/admin/*` sans session → redirige vers `/auth/signin`.
3. Tout le reste → pass-through.

Le matcher exclut `/api/*`, `_next/static`, `_next/image`, `favicon.ico` — l'auth des routes API est faite *dans* chaque handler via `auth()`.

### Client / Server boundary

- **Layout, middleware** : code serveur, accède à NextAuth et Prisma.
- **Pages `/dashboard`, `/admin/*`** : `"use client"` parce qu'elles consomment React Query et NextAuth session côté client.
- **Composants UI** : `"use client"` partout (Radix + interactions).
- **API routes** : serveur uniquement, accèdent à Prisma + auth via `auth()` côté server.

Aucune utilisation de Server Actions à ce jour — tout passe par les routes `/api/*` consommées en fetch + React Query.

## 5. Authentification & autorisation

### Configuration (`src/lib/auth.ts`)

- Stratégie : JWT (pas de table `Session` utilisée pour les sessions actives, même si le modèle existe — c'est le résidu d'une config antérieure).
- Providers : Google, GitHub, Discord (Credentials non configurés).
- Callback `jwt` : au signin, on charge le user en DB pour récupérer son `name` et son `role`, on les met dans le token.
- Callback `session` : on copie `id` (`sub`), `role`, `name` du token dans `session.user`.
- Custom signin page : `/auth/signin`.

Le type `Session.user` est augmenté via `declare module "next-auth"` (étend `DefaultSession["user"]` avec `id`, `role`).

### Autorisation côté API

Chaque route privée fait :

```ts
const session = await auth()
if (!session?.user) return 401

// Pour les routes admin :
const me = await prisma.user.findUnique({ where: { id: session.user.id } })
if (me?.role !== "ADMIN") return 403
```

Le rôle est ré-interrogé en DB plutôt que lu depuis `session.user.role` (point d'amélioration documenté dans `REFACTOR.md`).

### Autorisation côté UI

La navbar affiche les liens `/admin/*` uniquement si `session.user.role === "ADMIN"`. Le middleware ne distingue pas USER/ADMIN — un user lambda qui tape `/admin` peut atteindre la page mais l'API renverra 403 et l'UI restera vide.

## 6. API REST

Convention : routes RESTish dans `src/app/api/<resource>/route.ts`, ressources nestées sous `[id]/route.ts`. Toutes les réponses sont du JSON, les erreurs ont la forme `{ error: string }` avec un code HTTP cohérent.

| Méthode | Route | Auth | But |
|---|---|---|---|
| `*` | `/api/auth/[...nextauth]` | — | Handler NextAuth |
| `GET` | `/api/user/profile` | user | Profil + participation + édition active |
| `PATCH` | `/api/user/profile` | user | MAJ partielle de user/participation (le moteur central de l'inscription) |
| `POST` | `/api/onboarding` | user | Marque `onboardingCompletedAt = now()` + MAJ des réponses |
| `GET` | `/api/conferences` | public | Liste pour l'édition active |
| `POST` | `/api/conferences` | user (admin pour autre `speakerId`) | Crée la conférence du user. Pose `wantsToSpeak: true` |
| `PATCH` | `/api/conferences/[id]` | owner ou admin | MAJ titre/description/timeSlot |
| `DELETE` | `/api/conferences/[id]` | owner ou admin | Supprime + pose `wantsToSpeak: false` |
| `GET` | `/api/timeslots` | public | Liste pour l'édition active |
| `POST` | `/api/timeslots` | admin | Crée un slot (accepte `editionId` body pour cibler une édition non-active) |
| `GET/PATCH/DELETE` | `/api/timeslots/[id]` | public / admin / admin | Standard. DELETE refuse si une Conference est liée |
| `GET` | `/api/editions` | public | Liste toutes les éditions (avec compteurs) |
| `POST` | `/api/editions` | admin | Crée (toujours inactive) |
| `PATCH` | `/api/editions/[id]` | admin | MAJ. `isActive: true` désactive toutes les autres dans une transaction |
| `DELETE` | `/api/editions/[id]` | admin | Refuse si édition active |
| `GET` | `/api/meals` | user (anon possible mais sans `status`) | Slots MEAL `showInRegistration=true` + statut du user |
| `POST` | `/api/meals` | user | Upsert `MealRegistration` (PRESENT/ABSENT) |
| `POST` | `/api/payments/intent` | user | Calcule total des repas PRESENT payants → PaymentIntent Stripe |
| `POST` | `/api/payments/webhook` | signature Stripe | `payment_intent.succeeded` → `hasPaid=true`, `payment_intent.payment_failed` → `failed` |
| `GET` | `/api/admin/stats` | admin | `totalUsers`, `attendingUsers`, `attendingRate` |
| `GET` | `/api/admin/users` | admin | Liste enrichie users + meal slots de l'édition active |
| `DELETE` | `/api/admin/users` | admin | Supprime *la participation* d'un user (pas l'user) |
| `PATCH` | `/api/admin/users` | admin | Toggle `hasPaid`/`willPayInCash` OU update meal status d'un user |
| `POST` | `/api/admin/emails` | admin | Broadcast (zod-validated, multipart pour image attachment) |

### Singletons côté serveur

- `prisma` : `src/lib/prisma.ts`, mis sur `globalThis` en dev pour survivre au HMR.
- `stripe` : `src/lib/stripe.ts`, lazy via `getStripe()` (throw si `STRIPE_SECRET_KEY` absente).

### Helpers métier

- `getActiveEdition()` / `getActiveEditionId()` (`src/lib/edition.ts`) — utilisé partout dans `/api/*`. **Throw** si aucune édition active n'existe (les routes catchent et retournent 500).

## 7. Paiements Stripe

Flux côté participant :

1. Le participant coche des repas avec `price != null` → total calculé côté client (affichage) et serveur (`intent` route).
2. Il choisit « Virement » comme mode → bouton « Payer par carte » apparaît (`MealPaymentBlock`).
3. Click → `POST /api/payments/intent` → le serveur :
   - somme les `timeSlot.price` des `MealRegistration` PRESENT du user dans l'édition active ;
   - réutilise un PaymentIntent en `requires_payment_method` si le montant correspond ;
   - sinon crée un nouveau PaymentIntent avec `metadata.userId` + `metadata.editionId` ;
   - upsert `EditionParticipation.stripePaymentIntentId` + crée une ligne `PaymentIntent` (audit) ;
   - renvoie `{ clientSecret, amount }`.
4. Stripe `Elements` + `PaymentElement` montés dans un Dialog, `confirmPayment({ redirect: "if_required" })`.
5. Sur succès → `invalidateQueries({ queryKey: queryKeys.userProfile })` côté client.

Flux côté Stripe :

1. Stripe émet `payment_intent.succeeded` → `POST /api/payments/webhook`.
2. La route **lit le body brut** (`request.text()`) — indispensable pour `constructEvent` qui vérifie la signature.
3. Sur succès → `EditionParticipation.hasPaid = true` + `paidAmount = amount/100` (cents → euros). Ligne `PaymentIntent` passe à `succeeded`.
4. Sur échec → `stripePaymentStatus = failed`.

**Variables d'environnement requises** : `STRIPE_SECRET_KEY` (serveur), `STRIPE_WEBHOOK_SECRET` (vérification webhook), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client). Sans la clé publique, `MealPaymentBlock` ne s'affiche pas.

**Sécurité** : le montant n'est jamais accepté du client — toujours recalculé en DB.

## 8. Architecture frontend

### Providers (`src/app/layout.tsx`)

```
AuthProvider (SessionProvider)
  └─ QueryProvider (QueryClient + Devtools)
      └─ {children}
```

L'ordre compte : la session NextAuth doit être disponible pour les hooks Query qui lisent éventuellement la session.

### Découpage feature-sliced

```
src/features/
├── participation/   # PresenceSection, EditionInfoCard, AlertBanner
├── meals/           # MealsSection, MealPaymentBlock
├── conferences/     # ConferencesSection, ConferenceEditForm, ConferenceDeleteButton
├── onboarding/      # OnboardingModal + 6 steps
└── program/         # ProgramSection (lecture seule)
```

**Règle de dépendance** : un feature n'importe **pas** d'un autre feature. Pour partager du code, on passe par `src/components/ui/`, `src/hooks/` ou `src/lib/`.

Chaque dossier feature a son propre `CLAUDE.md` qui documente ses fichiers, son flux et ses ancres DOM (`#section-repas`, `#section-presence`, `#section-conferences`) utilisées par `AlertBanner` pour le scroll-to.

### Hooks React Query (`src/hooks/`)

| Hook | Endpoint | Pattern |
|---|---|---|
| `useUserProfile` | GET `/api/user/profile` | Query |
| `useUpdateProfile` | PATCH `/api/user/profile` | Mutation → `setQueryData(userProfile, data.user)` (cache write direct) |
| `useMeals` | GET `/api/meals` | Query |
| `useUpdateMealStatus` | POST `/api/meals` | Mutation → `setQueryData(meals, …)` (write optimiste) |
| `useTimeSlots` | GET `/api/timeslots` | Query, `staleTime: 60s` (slots changent rarement) |
| `useCreateConference` | POST `/api/conferences` | Mutation → invalide `userProfile` + `timeslots` |
| `useUpdateConference` | PATCH `/api/conferences/[id]` | idem |
| `useDeleteConference` | DELETE `/api/conferences/[id]` | idem |

Toutes les clés sont centralisées dans `src/lib/query-keys.ts` (factory typée).

### Types partagés (`src/types/index.ts`)

`UserProfile`, `MealSlot`, `TimeSlot`, `ConferenceRecord`, `EditionInfo` + enums (`AttendanceDays`, `MealStatus`, `SlotKind`, `Role`). Ces interfaces reflètent la *forme renvoyée par l'API* (donc dates en `string`, pas `Date`).

## 9. Onboarding

Modal non-fermable montrée tant que `user.onboardingCompletedAt === null`.

```
attending=oui  → days → sleeping → meals* → speaking → [conference]? → DONE
attending=non  →                              speaking → [conference]? → DONE
attending=null →                              speaking → [conference]? → DONE

* meals step skipped si aucun MEAL slot dans l'édition active
```

À chaque étape :

- Stockage immédiat en `localStorage` (`onboarding_progress_<userId>`) pour reprendre si l'onglet est fermé.
- Appel `useUpdateProfile()` pour persister la réponse côté serveur.
- Bouton **« Répondre plus tard »** : appelle `POST /api/onboarding` immédiatement avec les réponses partielles → `onboardingCompletedAt` posé → la modal disparaît mais reviendra non.

Le `POST /api/onboarding` est intentionnellement distinct du `PATCH /api/user/profile` : c'est lui qui sert de « marqueur de complétion ».

## 10. Email broadcast (admin)

`/admin/emails` → `POST /api/admin/emails` (multipart si pièce jointe image).

Étapes :

1. Auth admin.
2. Parsing : `parseRequest()` accepte JSON ou `multipart/form-data`. Validation Zod (`subject` 3-200, `message` 5-10000).
3. Pièce jointe : image (png/jpeg/gif/webp), max 5 MB, lue en Buffer.
4. Sélection destinataires selon `filter` : `all`, `participants`, `non_participants`, `not_paid`, `paid`, `speakers`. Les filtres autres que `all` exigent une édition active.
5. `sendBroadcastEmail` (`src/lib/mail.ts`) : crée un transporter SMTP, dédup les destinataires, convertit le message en HTML safe (markdown basique : `#`, `-`, `*…*`, `**…**`, `[…](…)`, `\`…\``), envoie séquentiellement.
6. Réponse : `{ total, sent, failed, errors[0..20] }`.

Pas de queue / retry : si SMTP timeout, l'admin retry à la main.

## 11. Conventions

### Langue

- **UI et chaînes user-facing** : français. Émojis utilisés modérément (alert, success, error).
- **Code** : noms d'identifiants, commentaires des `lib/*`, messages de commit : anglais.
- **Commentaires dans les composants `features/*`** et messages d'erreur API : mélange — souvent en français parce qu'ils sont user-facing.

### Style de code

- TypeScript strict (`tsconfig.json` est minimal mais Next 15 active strict par défaut).
- ESLint : `next/core-web-vitals` (config dans `eslint.config.mjs`).
- Pas de tests automatiques à ce jour.

### Sécurité

- Pas de Credentials Provider → pas de mot de passe à stocker. Les comptes existent uniquement via OAuth.
- Les routes admin ré-interrogent toujours la DB pour le rôle (défense en profondeur même si la session est compromise).
- Le webhook Stripe est signé. La signature est vérifiée avant toute action DB.
- `.env` ignoré par git (`.gitignore`). `env.example.tmp` documente les variables.

## 12. Variables d'environnement

Bloc minimal en dev (voir aussi `SETUP.md`, `PROD.md`) :

```env
DATABASE_URL=postgresql://postgres:password@localhost:5434/congres_champetre?schema=public
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Au moins un provider OAuth :
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
GITHUB_CLIENT_ID=…
GITHUB_CLIENT_SECRET=…
DISCORD_CLIENT_ID=…
DISCORD_CLIENT_SECRET=…

# Optionnel — sans ça, MealPaymentBlock ne s'affiche pas :
STRIPE_SECRET_KEY=…
STRIPE_WEBHOOK_SECRET=…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=…

# Optionnel — sans ça, /api/admin/emails throw au runtime :
SMTP_HOST=…
SMTP_PORT=587
SMTP_USER=…
SMTP_PASS=…
SMTP_FROM=Congrès Champêtre <no-reply@…>
SMTP_SECURE=false
```

## 13. Flux clés (résumés)

### Premier login d'un participant

1. `/` → middleware → `/auth/signin` → click Google → callback NextAuth → JWT créé (role lu en DB).
2. Redirect `/dashboard` → `useUserProfile()` GET `/api/user/profile`.
3. Le `user.onboardingCompletedAt === null` → `OnboardingModal` s'affiche.
4. Au fil des steps : `useUpdateProfile()` sauvegarde chaque réponse (upsert `EditionParticipation`).
5. Step final → `POST /api/onboarding` → `onboardingCompletedAt = now()` → invalidation → modal disparaît.
6. Dashboard rendu : `AlertBanner` + `EditionInfoCard` + `PresenceSection` + (`MealsSection` si présent + repas) + (`ConferencesSection` si présent).

### Création d'une conférence

1. `ConferenceForm` → titre + description + créneau optionnel.
2. `useCreateConference` POST `/api/conferences` → vérifie qu'aucune conf existe déjà pour ce user dans cette édition → crée + set `wantsToSpeak: true`.
3. Cache invalidé : `userProfile` + `timeslots`.

### Paiement carte

Détaillé en §7.

### Création d'une édition (admin)

1. `EditionManager` wizard step 1 : nom + dates → `POST /api/editions` → édition créée *inactive*.
2. Step 2 (optionnel) : ajouter des repas (`MealSlotFields`) → boucle `POST /api/timeslots` avec `editionId` + `kind: MEAL`.
3. Pour activer : bouton « Activer » dans la liste → `PATCH /api/editions/[id]` avec `isActive: true` → transaction qui désactive toutes les autres.

## 14. Pour aller plus loin

- **Index de navigation** → `CLAUDE.md` à la racine + un `CLAUDE.md` dans presque chaque dossier `src/*`.
- **Setup local** → `SETUP.md`.
- **Mise en production** → `PROD.md`.
- **OAuth** → `oauth-setup.md`.
- **Points de friction connus** → `REFACTOR.md`.
