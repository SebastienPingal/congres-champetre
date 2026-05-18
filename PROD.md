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
> - `EditionParticipation.paymentProviderId` (String?) — id du dernier Order PayPal
> - `EditionParticipation.paymentStatus` (String?) — `pending` / `succeeded` / `failed`
> - `EditionParticipation.paidAmount` (Int?) — montant payé en centimes
> - Nouveau modèle `PaymentIntent` (audit trail PayPal)

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

### PayPal (paiements — compte PayPal ou carte bancaire invité)

PayPal accepte les comptes Personnels en France sans SIRET ni asso. Plafond ~2 500 €/an avant vérification approfondie.

**Étape 1 — Compte PayPal**
1. Créer un compte sur [paypal.com/fr/welcome/signup](https://www.paypal.com/fr/welcome/signup/) → « Compte Personnel ».
2. Vérifier l'identité (pièce + IBAN) pour lever le plafond.

**Étape 2 — App développeur**
1. [developer.paypal.com/dashboard/applications](https://developer.paypal.com/dashboard/applications)
2. Onglet **Sandbox** (test) ou **Live** (prod) → "Create App" → type "Merchant".
3. Récupérer `Client ID` et `Secret`.

```env
# En sandbox :
PAYPAL_ENV="sandbox"
PAYPAL_CLIENT_ID="AY..."         # Sandbox client id
PAYPAL_CLIENT_SECRET="EM..."     # Sandbox secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID="AY..."  # même valeur que PAYPAL_CLIENT_ID

# En production :
PAYPAL_ENV="live"
PAYPAL_CLIENT_ID="A..."          # Live client id
PAYPAL_CLIENT_SECRET="E..."      # Live secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID="A..."
```

**Étape 3 — Webhook PayPal**
1. Sur l'app PayPal créée → onglet "Add Webhook"
2. URL : `https://<votre-domaine>/api/payments/webhook`
3. Événements : `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `CHECKOUT.ORDER.VOIDED`
4. Copier le **Webhook ID** (pas un secret — un identifiant).

```env
PAYPAL_WEBHOOK_ID="WH-..."
```

> Sans `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, le bouton PayPal n'apparaît pas (le composant se cache automatiquement).

**Tester en local (sandbox)** :
- En sandbox, PayPal te fournit des comptes acheteurs de test sur [developer.paypal.com/dashboard/accounts](https://developer.paypal.com/dashboard/accounts).
- Pour tester le webhook localement, soit utiliser ngrok / cloudflared pour exposer `localhost:3000`, soit utiliser le simulateur d'événements de [developer.paypal.com](https://developer.paypal.com) (Webhook Simulator).

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
- [ ] Sélectionner des repas payants → bouton PayPal apparaît → paiement sandbox réussi (compte PayPal de test ou carte invité)
- [ ] Après capture → `hasPaid = true` dans la DB (vérifier via `pnpm db:studio`)
- [ ] Webhook PayPal reçu (vérif via le journal d'audit `PaymentIntent.status = "succeeded"`)
- [ ] La page admin `/admin` est accessible avec un compte ADMIN
- [ ] Les emails admin s'envoient correctement

---

## 5. Sécurité

- [ ] `NEXTAUTH_SECRET` est unique et aléatoire (jamais la valeur par défaut)
- [ ] `.env` est dans `.gitignore` (déjà configuré)
- [ ] La DB n'est pas exposée publiquement (port 5432 fermé au réseau)
- [ ] HTTPS activé (PayPal l'exige pour les webhooks en production)
- [ ] `PAYPAL_ENV="live"` et les clés utilisées sont bien les clés **Live**, pas **Sandbox**

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
