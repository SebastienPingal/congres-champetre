# Inconsistances & opportunités de refactor

Liste des frictions identifiées lors de l'audit pour la rédaction de `ARCHITECTURE.md`. Aucun changement de code n'a été fait — c'est une « todo list » pour plus tard, triée par sévérité approximative.

> Chaque point indique : **(impact)** **emplacement** — description → **suggestion**.

## 🟥 Critiques (correctness, sécurité, données)

### R1. Composants conférence dupliqués
**`src/components/conference-{edit-form,delete-button}.tsx`** vs **`src/features/conferences/conference-{edit-form,delete-button}.tsx`**.

Deux implémentations parallèles du même composant :

- La version `features/conferences/*` utilise les hooks React Query (`useUpdateConference`, `useDeleteConference`) → invalide proprement le cache.
- La version `components/*` fait du `fetch` direct + `useState` → ne touche pas au cache React Query.

L'admin consomme la version `components/*` (cf. `conference-manager.tsx`, `timeslot-manager.tsx`), le dashboard utilise la version `features/*`. Résultat : quand un admin modifie une conférence, le dashboard ouvert dans un autre onglet ne le voit pas.

**→** Supprimer les versions `components/*` et faire pointer admin sur `features/conferences/*`. Le `ConferenceForm` (qui n'existe qu'en `components/`) peut soit rester là, soit migrer dans `features/conferences/`.

### R2. CLAUDE.md de `features/conferences` ment
Le fichier `src/features/conferences/CLAUDE.md` liste `conference-form.tsx` comme membre du dossier. Le fichier réel vit dans `src/components/conference-form.tsx`. Tous les imports actuels (`conferences-section.tsx`, `onboarding/steps/conference-step.tsx`) sont `@/components/conference-form`.

**→** Soit déplacer le fichier et mettre à jour les imports, soit corriger le CLAUDE.md. La première option est cohérente avec le découpage feature-sliced revendiqué dans `src/features/CLAUDE.md`.

### R3. Doc obsolète sur l'authentification email/password
- `README.md` ligne 8 dit « Inscription et authentification sécurisée (email + OAuth) ».
- `README.md` ligne 86-94 documente un seed qui crée un admin `admin@congres-champetre.com / admin123`.
- `SETUP.md` lignes 76-81 idem.
- `package.json` ligne 12 : `"db:seed": "tsx scripts/seed.ts" # Seed DB with admin user…`.

Or :

- `src/lib/auth.ts` ne configure **que** Google/GitHub/Discord — pas de CredentialsProvider.
- `scripts/seed.ts` ligne 8 affiche explicitement « Pas de création d'admin automatique ».
- `src/app/api/auth/register/` (mentionné dans l'ancien `CLAUDE.md` racine) n'existe pas.

**→** Nettoyer README/SETUP/package.json. Indiquer la procédure réelle : créer un compte OAuth puis `UPDATE "User" SET role = 'ADMIN' WHERE email = …` (déjà documenté dans `PROD.md` §7).

### R4. Webhook Stripe ne gère pas les annulations / refunds
`src/app/api/payments/webhook/route.ts` ne traite que `payment_intent.succeeded` et `payment_intent.payment_failed`. Un `payment_intent.canceled` ou un `charge.refunded` post-paiement laissera `hasPaid = true`.

**→** Soit ajouter les events manquants, soit documenter explicitement que les refunds doivent être gérés à la main par l'admin via `PATCH /api/admin/users` (`hasPaid: false`).

### R5. `getActiveEdition()` throw → 500 partout
`src/lib/edition.ts` throw si aucune édition active. La plupart des routes catchent et renvoient 500 avec un message générique. UX dégradée pour le tout premier déploiement (pas d'édition seedée).

**→** Soit retourner `null` et laisser chaque route choisir (UX message clair vs erreur silencieuse), soit ajouter une page d'onboarding admin « créer la première édition ».

## 🟧 Important (cohérence, dette)

### R6. Anti-pattern : vérification de rôle en DB sur chaque appel admin
Pattern répété dans 10+ routes :

```ts
const session = await auth()
if (!session?.user) return 401
const me = await prisma.user.findUnique({ where: { id: session.user.id } })
if (me?.role !== "ADMIN") return 403
```

Le rôle est déjà dans `session.user.role` (cf. `src/lib/auth.ts` callback `session`). La DB est interrogée pour rien à chaque requête admin.

**→** Extraire `requireUser()` / `requireAdmin()` dans `src/lib/auth.ts` qui lisent depuis la session. Garder le re-fetch DB seulement si la défense en profondeur est explicitement souhaitée (mais alors le documenter).

### R7. PATCH `/api/user/profile` géant
257 lignes, fait à la fois `User.update` (wantsToSpeak + side-effect: delete conferences) **et** `EditionParticipation.upsert` (avec règles métier conditionnelles : `sleepsOnSite=true` interdit si `!isAttending`, `isAttending=true` force `attendanceDays=BOTH` si nouvelle participation, etc.). Difficile à tester.

**→** Séparer en deux routes (`/api/user/profile` pour le `User`, `/api/user/participation` pour `EditionParticipation`) ou au minimum extraire un service `lib/participation.ts` testable.

### R8. Couplages magiques User ↔ Conference
- `POST /api/conferences` force `User.wantsToSpeak = true` automatiquement.
- `DELETE /api/conferences/[id]` force `User.wantsToSpeak = false` — même si l'admin a supprimé une seule des conférences d'un user (en pratique il n'y en a qu'une, mais la contrainte n'est pas explicite).
- `PATCH /api/user/profile` avec `wantsToSpeak=false` **supprime toutes les conférences** du user pour l'édition active.

Effets de bord cachés. Difficile à raisonner.

**→** Soit assumer le couplage et le documenter en commentaire (« `wantsToSpeak` ⇔ `conferences.length > 0` »), soit virer le champ `wantsToSpeak` et le dériver de la présence d'une conférence.

### R9. `/admin/page.tsx` n'utilise pas React Query
La page admin principale (`src/app/admin/page.tsx`) fait du `fetch` + `useState` + `useEffect` manuel sur 4 endpoints en parallèle. Incohérent avec le dashboard user qui passe par React Query. Pas de cache, pas de revalidation.

**→** Migrer vers des hooks `useAdminStats`, `useEditions`, `useTimeSlots` (existe déjà), `useConferences`.

### R10. `EditionManager` et `UsersTable` idem
`src/components/admin/edition-manager.tsx` (~474 lignes) et `src/components/admin/users-table.tsx` : `fetch` direct, état local lourd. `EditionManager` reduce manuellement les jours du weekend pour `wizardDays` à chaque render (IIFE dans le body).

**→** Hooks dédiés + `useMemo` pour `wizardDays`.

### R11. `Navbar` re-fetch `/api/editions` à chaque mount
`src/components/navbar.tsx` ligne 22-30 : `useEffect` qui fetch toutes les éditions juste pour afficher le nom de l'active. C'est exactement la même donnée que `useUserProfile().edition.name`.

**→** Lire depuis `useUserProfile()` (déjà invalidé proprement après changement d'édition).

### R12. Types `TimeSlot` / `Conference` dupliqués
Définitions inline dans plusieurs fichiers : `src/app/admin/page.tsx` (lignes 11-42), `src/components/admin/timeslot-manager.tsx` (lignes 15-33), `src/components/admin/conference-manager.tsx` (lignes 12-27), `src/components/conference-edit-form.tsx` (lignes 11-23). Variantes subtilement différentes (`description?: string` vs `string | null`).

**→** Utiliser `src/types/index.ts` partout. Étendre si nécessaire (`AdminTimeSlot extends TimeSlot { description?: string | null; price?: number | null }`).

### R13. `OnboardingModal` double-save
À chaque step, l'app :

1. écrit `localStorage` (persistance brouillon),
2. appelle `useUpdateProfile()` (persistance serveur),

… puis l'étape finale appelle `POST /api/onboarding` qui re-upsert les mêmes champs. Risque de race + complexité.

**→** Soit le local storage seul puis flush au final step (une seule écriture serveur), soit retirer le local storage (la modal est non-fermable de toute façon, et le risque de fermer l'onglet est minoritaire).

### R14. `paidAmount: Float`
Stocker du montant en `Float` est un *anti-pattern* classique (erreurs de précision binaires). Le reste du flux Stripe utilise des cents (`Int amount` dans `PaymentIntent` model), ce qui est correct.

**→** Passer `paidAmount` en `Int` (cents) ou `Decimal`. Migration nécessaire.

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

Si tu n'as qu'une heure :

1. **R3** (doc auth obsolète — confusion utilisateur immédiate)
2. **R1** (composants dupliqués — bugs réels de désynchro UI admin/user)
3. **R29** (`SMTP_PASS` vs `SMTP_PASSWORD` — déploiement cassé silencieusement)

Si tu as une demi-journée, ajoute **R6** (helper `requireAdmin`) et **R12** (types dupliqués) — ce sont des gains de lisibilité immédiats sans changement comportemental.
