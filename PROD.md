# Checklist avant mise en production

## 1. Base de données

```bash
# Démarrer PostgreSQL (Docker)
docker-compose up -d

# Appliquer toutes les migrations en attente
pnpm db:migrate

# Peupler avec un compte admin + données de test (optionnel)
pnpm db:seed
```

> Le schéma a été étendu depuis la dernière migration. Les champs ajoutés sont :
> - `EditionParticipation.onboardingCompletedAt` (DateTime?)
> - `EditionParticipation.stripePaymentIntentId` (String?)
> - `EditionParticipation.stripePaymentStatus` (String?)
> - `EditionParticipation.paidAmount` (Float?)
> - Nouveau modèle `PaymentIntent` (audit trail Stripe)

---

## 2. Variables d'environnement

Copier `env.example.tmp` vers `.env` et remplir **toutes** les valeurs :

```bash
cp env.example.tmp .env
```

### Base de données
```env
DATABASE_URL="postgresql://postgres:<mot-de-passe>@<host>:5432/congres_champetre"
```

### NextAuth
```env
# Générer avec : openssl rand -base64 32
NEXTAUTH_SECRET="<secret-aléatoire-long>"
NEXTAUTH_URL="https://<votre-domaine>"
```

### OAuth — Google
1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un projet → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Type : Web application
4. Authorized redirect URIs : `https://<votre-domaine>/api/auth/callback/google`

```env
GOOGLE_CLIENT_ID="<id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<secret>"
```

### OAuth — Discord
1. Aller sur [discord.com/developers/applications](https://discord.com/developers/applications)
2. New Application → OAuth2 → Redirects
3. Ajouter : `https://<votre-domaine>/api/auth/callback/discord`

```env
DISCORD_CLIENT_ID="<id>"
DISCORD_CLIENT_SECRET="<secret>"
```

### OAuth — GitHub
1. Aller sur [github.com/settings/developers](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL : `https://<votre-domaine>/api/auth/callback/github`

```env
GITHUB_CLIENT_ID="<id>"
GITHUB_CLIENT_SECRET="<secret>"
```

### Stripe (paiements par carte)
1. Créer un compte sur [stripe.com](https://stripe.com)
2. Activer le mode **live** (pas test) pour la production
3. Récupérer les clés dans Dashboard → Developers → API keys

```env
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

**Webhook Stripe :**
1. Dashboard → Developers → Webhooks → Add endpoint
2. URL : `https://<votre-domaine>/api/payments/webhook`
3. Événements à écouter : `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copier le "Signing secret"

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

> Sans ces 3 variables Stripe, le bouton "Payer par carte" n'apparaît pas (le composant se cache automatiquement si `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est vide).

### Email (optionnel — pour les envois admin)
```env
SMTP_HOST="smtp.exemple.com"
SMTP_PORT="587"
SMTP_USER="votre@email.com"
SMTP_PASSWORD="<mot-de-passe>"
SMTP_FROM="Congrès Champêtre <no-reply@exemple.com>"
```

---

## 3. Build et démarrage

```bash
# Build de production (génère Prisma client + migre + compile Next.js)
pnpm build

# Démarrage
pnpm start
```

Ou avec un process manager :
```bash
pm2 start "pnpm start" --name congres-champetre
```

---

## 4. Vérifications post-déploiement

- [ ] La page `/auth/signin` s'affiche et les 3 boutons OAuth fonctionnent
- [ ] Un nouveau compte → l'onboarding s'affiche → toutes les étapes se sauvegardent
- [ ] Sélectionner des repas payants → bouton "Payer par carte" apparaît → paiement Stripe test
- [ ] Webhook Stripe reçu → `hasPaid = true` dans la DB (vérifier via `pnpm db:studio`)
- [ ] La page admin `/admin` est accessible avec un compte ADMIN
- [ ] Les emails admin s'envoient correctement

---

## 5. Sécurité

- [ ] `NEXTAUTH_SECRET` est unique et aléatoire (jamais la valeur par défaut)
- [ ] `.env` est dans `.gitignore` (déjà configuré)
- [ ] La DB n'est pas exposée publiquement (port 5432 fermé au réseau)
- [ ] HTTPS activé (Stripe l'exige pour les webhooks en production)
- [ ] Les clés Stripe utilisées sont bien les clés **live**, pas **test**

---

## 6. Créer la première édition active

Via `pnpm db:studio` ou via le seed, s'assurer qu'il existe une `Edition` avec `isActive: true`. Sans édition active, toutes les pages utilisateur affichent une erreur.

```sql
-- Vérification rapide
SELECT id, name, "isActive", "startDate" FROM "Edition" WHERE "isActive" = true;
```

---

## 7. Créer le compte admin

Le seed (`pnpm db:seed`) crée un admin par défaut. En production, changer le mot de passe ou utiliser uniquement OAuth et promouvoir un utilisateur via Prisma Studio :

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'votre@email.com';
```
