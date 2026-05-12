# Inconsistances & opportunités de refactor

Liste des frictions identifiées lors de l'audit pour la rédaction de `ARCHITECTURE.md`. Triée par sévérité approximative.

> Chaque point indique : **(impact)** **emplacement** — description → **suggestion**.
> Les points marqués ✅ ont été résolus.

## 🟥 Critiques (correctness, sécurité, données)

### ✅ R1. Composants conférence dupliqués *(résolu)*
`components/conference-{edit-form,delete-button}.tsx` supprimés. `conference-manager.tsx` et `timeslot-manager.tsx` pointent désormais vers `features/conferences/*` (versions React Query qui invalident le cache).

### ✅ R2. CLAUDE.md de `features/conferences` mentait *(résolu)*
`conference-form.tsx` déplacé de `src/components/` vers `src/features/conferences/`. Imports mis à jour dans `conferences-section.tsx` et `onboarding/steps/conference-step.tsx`.

### ✅ R3. Doc obsolète sur l'authentification email/password *(résolu)*
README.md et SETUP.md nettoyés : suppression des références email/password et admin seedé. La procédure réelle (OAuth + `UPDATE "User" SET role = 'ADMIN'`) est documentée.

### R4. Webhook Stripe ne gère pas les annulations / refunds
`src/app/api/payments/webhook/route.ts` ne traite que `payment_intent.succeeded` et `payment_intent.payment_failed`. Un `payment_intent.canceled` ou un `charge.refunded` post-paiement laissera `hasPaid = true`.

**→** Soit ajouter les events manquants, soit documenter explicitement que les refunds doivent être gérés à la main par l'admin via `PATCH /api/admin/users` (`hasPaid: false`).

### ✅ R5. `getActiveEdition()` throw → 500 partout *(résolu)*
`NoActiveEditionError` introduit dans `src/lib/edition.ts`. Toutes les routes API vérifient `instanceof NoActiveEditionError` dans leur catch et retournent un **503** explicite au lieu d'un 500 opaque.

## 🟧 Important (cohérence, dette)

### ✅ R6. Anti-pattern : vérification de rôle en DB sur chaque appel admin *(résolu)*
`requireUser()` et `requireAdmin()` ajoutés dans `src/lib/auth.ts`, lisent `session.user.role` depuis le JWT. Les 10+ routes admin mises à jour — plus aucun `prisma.user.findUnique` pour la vérification de rôle.

### ✅ R7. PATCH `/api/user/profile` géant *(résolu)*
Service `src/lib/participation.ts` extrait : `buildParticipationUpdate()` (validation + règles métier) et `upsertParticipation()`. La route profile délègue et passe de ~257 à ~90 lignes.

### ✅ R8. Couplages magiques User ↔ Conference *(résolu)*
Couplage assumé et documenté via commentaires dans les 3 points d'effet de bord : `POST /api/conferences`, `DELETE /api/conferences/[id]`, `PATCH /api/user/profile`.

### ✅ R9. `/admin/page.tsx` n'utilise pas React Query *(résolu)*
Page migrée vers `useTimeSlots`, `useConferences`, `useAdminStats`, `useEditions` (nouveaux hooks). Plus de fetch manuel ni de useState/useEffect pour les données serveur.

### ✅ R10. `EditionManager` et `UsersTable` idem *(résolu)*
`EditionManager` utilise `useEditions()` + `useMemo` pour `wizardDays` (remplace l'IIFE). `UsersTable` utilise `useAdminUsers()` + `patchCachedUsers` (setQueryData) pour les mises à jour optimistes.

### ✅ R11. `Navbar` re-fetch `/api/editions` à chaque mount *(résolu)*
`useEffect`/`fetch` supprimé. `editionName` lu depuis `useUserProfile().data?.edition?.name`.

### ✅ R12. Types `TimeSlot` / `Conference` dupliqués *(résolu)*
`AdminTimeSlot` et `Conference` ajoutés dans `src/types/index.ts`. Interfaces inline supprimées dans `admin/page.tsx`, `timeslot-manager.tsx` et `conference-manager.tsx`.

### ✅ R13. `OnboardingModal` double-save *(résolu)*
localStorage supprimé. La modal est non-fermable ; le risque de rechargement en cours d'onboarding est minoritaire. Chaque step continue d'écrire sur le serveur via `useUpdateProfile()`.

### ✅ R14. `paidAmount: Float` *(résolu)*
Migré en `Int` (centimes) dans `prisma/schema.prisma`. Migration SQL `20260512000000_paid_amount_float_to_int` fournie (conversion `ROUND(old * 100)`). Webhook Stripe adapté : stocke `intent.amount` directement sans diviser par 100.

## 🟨 Mineur (qualité de vie)

### R15. Pas de validation de longueur sur `Conference.title/description`
Aucune contrainte côté schéma ni côté API. Un user peut poster 10 MB de titre. Le SMTP broadcast a bien des limites Zod (`subject` 3-200, `message` 5-10000), mais pas les conférences.

**→** Ajouter une validation Zod côté `POST/PATCH /api/conferences`.

### R16. Validation manuelle des enums `AttendanceDays`
Dans `/api/user/profile` PATCH et `/api/onboarding` POST : la liste `["NONE","DAY1","DAY2","BOTH","UNKNOWN"]` est dupliquée littéralement. Si on ajoute une valeur à l'enum Prisma, on doit penser à mettre à jour les deux routes.

**→** Importer `AttendanceDays` depuis `@prisma/client` et vérifier `Object.values(AttendanceDays).includes(...)`. Ou utiliser Zod avec `z.nativeEnum(AttendanceDays)`.

### R17. Stats admin sans filtre `attendingUsers` par édition active
`/api/admin/stats` retourne `totalUsers` (tous users, toutes éditions) et `attendingUsers` (participations actives pour l'édition courante). Mélange. Le `attendingRate` = `attendingUsers / totalUsers` est trompeur si plusieurs éditions cohabitent.

**→** Normaliser : soit `totalUsersForActiveEdition` (avec une participation, même inactive), soit ajouter le total de l'édition (`participantCount` est déjà calculé dans `/api/user/profile`).

### R18. Email broadcast séquentiel
`src/lib/mail.ts` `sendBroadcastEmail` : boucle `for…of` avec `await` séquentiel sur chaque destinataire. Pour 50 utilisateurs et un SMTP qui répond en 500ms, ça prend 25s sur une seule requête HTTP — risque de timeout serverless.

**→** `Promise.all` avec un semaphore (ex. 10 envois en parallèle), ou queue + worker, ou `bulkSend` du transporter Nodemailer.

### R19. Tri « last » bizarre dans `TimeSlotManager`
Ligne 374-379 :

```ts
.sort((a, b) => {
  if (a.title.toLowerCase() === "last") return 1
  if (b.title.toLowerCase() === "last") return -1
  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
})
```

Force les slots dont le titre est littéralement « last » à la fin. Hack non documenté.

**→** Soit ajouter un champ `order: Int?` ou `isLast: Boolean` au schéma, soit supprimer ce comportement.

### R20. `paymentIntent` réutilisation : amount-only matching
`/api/payments/intent` réutilise un PaymentIntent existant si l'`amount` correspond. Mais l'utilisateur a pu changer de mode (`willPayInCash: true`) entre deux clics → on lui crée un intent inutile. Ou il a changé ses repas (même total mais composition différente) → l'intent semble valide.

**→** Annuler l'intent existant avant d'en créer un nouveau, ou matcher sur un hash des `mealRegistrations` PRESENT.

### R21. `seed.ts` crée des slots sans `kind` explicite
Le seed crée 3 slots à 9h/12h/15h dans la journée de demain, tous en `CONFERENCE` (default). Les titres « Présentation de midi » et « Session après-midi » suggèrent autre chose. Données de test confusionnelles.

**→** Soit créer un mix réaliste (1 conférence, 1 repas avec price, 1 break), soit retirer le seed des slots et laisser l'admin remplir.

### R22. CLAUDE.md d'origine listait une route inexistante
L'ancien `CLAUDE.md` racine mentionnait `auth/register/` qui n'existe pas (`grep` → 0 match). Probable résidu de la version Credentials abandonnée. (Corrigé dans la version actuelle du CLAUDE.md.)

### R23. Émojis console.error inégaux
`🚨`, `🧨`, `📭`, `❌`, sans `📧` etc. — pas grave, juste bruit. Ne pas refactoriser pour ça seul, mais ne pas en rajouter de nouveaux.

### R24. `willPayInCash` défaut `false`
Sémantiquement, `false` = « payera par virement / carte ». Mais c'est aussi la valeur par défaut **avant tout choix de l'utilisateur**. Impossible de distinguer « pas choisi » de « a choisi virement ». Pour l'instant l'UI affiche les deux boutons côte à côte et l'un est sélectionné par défaut — pas dramatique, mais ambigu.

**→** Passer en `Boolean?` (nullable) pour exprimer l'absence de choix.

### R25. `Edition.startHour/endHour` non validés
Pas de contrainte 0-24, pas de validation côté API. Un admin peut créer une édition avec `startHour: 25`.

**→** Validation Zod simple sur la route.

## 🟦 Documentation / hygiène

### R26. README hors d'âge
`README.md` mentionne « connexion email + OAuth », un seed avec admin et password, et une structure de projet qui ne reflète plus le découpage `features/`. À réécrire ou pointer explicitement vers `CLAUDE.md` / `ARCHITECTURE.md`.

### R27. `oauth-setup.md` redondant
Le contenu est repris dans `SETUP.md` §5 et `PROD.md` §2. À fusionner ou supprimer.

### R28. Pas de tests
Aucun framework de test configuré. Pour un projet aussi central que la sécurité du flux Stripe et l'autorisation admin, un minimum de tests d'intégration sur les routes API serait raisonnable.

**→** Au moins ajouter Vitest + supertest pour `/api/payments/*`, `/api/user/profile`, et les routes admin.

### R29. Variables d'environnement non documentées en un seul endroit
Le fichier `env.example.tmp` existe mais n'est pas synchronisé avec ce qui est réellement lu par le code. Cf. `SMTP_PASSWORD` mentionné dans `PROD.md` ligne 103 mais le code lit `SMTP_PASS` (`src/lib/mail.ts` ligne 41).

**→** Auditer toutes les `process.env.*` lectures et générer un `.env.example` cohérent (et le commiter, contrairement au `.tmp` actuel).

---

## Méta : priorisation suggérée

Toutes les catégories **Critique** et **Important** sont résolues (✅ R1–R14).

Points ouverts les plus impactants parmi les **Mineurs** :

1. **R29** (`SMTP_PASS` vs `SMTP_PASSWORD` — déploiement cassé silencieusement)
2. **R28** (pas de tests — routes Stripe et auth sans filet)
3. **R15** (validation Zod sur `Conference.title/description` — injection potentielle de contenu volumineux)
