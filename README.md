# 🏛️ Congrès Champêtre

Site minimaliste pour organiser un weekend de conférences dans un cadre champêtre. Permet aux participants de proposer des conférences et aux organisateurs de gérer les créneaux.

## ✨ Fonctionnalités

### 👤 Pour les participants
- ✅ Inscription et authentification sécurisée (email + OAuth)
- ✅ Connexion rapide avec Google, Discord ou GitHub
- ✅ Indication du souhait de faire une conférence
- ✅ Proposition de sujets de présentation
- ✅ Sélection de créneaux préférés
- ✅ Suivi de l'organisation du weekend

### ⚙️ Pour les administrateurs
- ✅ Gestion des créneaux horaires
- ✅ Attribution des conférences aux créneaux
- ✅ Visualisation de toutes les propositions
- ✅ Organisation du planning complet

## 🛠️ Technologies utilisées

- **Framework**: Next.js 15 avec App Router
- **UI**: Tailwind CSS + shadcn/ui
- **Authentification**: NextAuth.js
- **Base de données**: PostgreSQL + Prisma ORM
- **Langage**: TypeScript
- **Package Manager**: pnpm

## 🚀 Installation et développement

### Prérequis
- Node.js 18+
- pnpm
- PostgreSQL

### 1. Installation des dépendances
```bash
pnpm install
```

### 2. Configuration de la base de données
Créez un fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

Modifiez les variables d'environnement dans `.env` :
```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5434/congres_champetre?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-please-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optionnels)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# SMTP (emailing admin global)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
SMTP_FROM="Congres Champetre <noreply@congres-champetre.com>"
SMTP_SECURE="false"
```

### 3. Migration de la base de données
```bash
pnpm db:migrate
```

### 4. Génération du client Prisma
```bash
pnpm db:generate
```

### 5. Seeding (optionnel)
Pour créer un utilisateur admin et des créneaux d'exemple :
```bash
pnpm db:seed
```

Cela créera :
- **Admin** : `admin@congres-champetre.com` / `admin123`
- **Créneaux d'exemple** pour tester l'application

⚠️ **Important** : Changez le mot de passe admin après la première connexion !

### 6. Configuration OAuth (optionnel)

Pour activer l'authentification avec Google, Discord ou GitHub, configurez les applications OAuth :

#### Google OAuth
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez-en un
3. Activez l'API Google+ 
4. Créez des identifiants OAuth 2.0
5. Ajoutez `http://localhost:3000/api/auth/callback/google` dans les URIs de redirection
6. Copiez le Client ID et Client Secret dans votre `.env`

#### Discord OAuth
1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Dans OAuth2, ajoutez `http://localhost:3000/api/auth/callback/discord` comme redirect URI
4. Copiez le Client ID et Client Secret dans votre `.env`

#### GitHub OAuth
1. Allez dans vos [Settings GitHub > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Créez une nouvelle OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copiez le Client ID et générez un Client Secret dans votre `.env`

### 7. Lancement du serveur de développement
```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📝 Scripts disponibles

```bash
# Développement
pnpm dev                 # Lancer le serveur de dev
pnpm build              # Build de production
pnpm start              # Lancer en production
pnpm lint               # Linter le code

# Base de données
pnpm db:migrate         # Exécuter les migrations
pnpm db:generate        # Générer le client Prisma
pnpm db:seed           # Seeder la base de données
pnpm db:studio         # Ouvrir Prisma Studio
```

## 🎯 Structure du projet

```
src/
├── app/                    # Pages et API routes (App Router)
│   ├── admin/             # Panel d'administration
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Dashboard utilisateur
│   └── api/               # API routes
├── components/            # Composants React
│   ├── ui/               # Composants shadcn/ui
│   ├── admin/            # Composants admin
│   └── providers/        # Context providers
├── lib/                   # Utilitaires et configuration
└── types/                # Types TypeScript
```

## 🔐 Authentification

Le système utilise NextAuth.js avec :
- **OAuth Providers** : Google, Discord, GitHub
- **Adapter Prisma** : stockage des sessions en base
- **Rôles** : `USER` et `ADMIN`

## 📊 Base de données

Modèles principaux :
- `User` : utilisateurs avec rôles et statut conférencier
- `TimeSlot` : créneaux horaires disponibles
- `Conference` : conférences proposées par les utilisateurs

## 🎨 Interface utilisateur

Interface minimaliste avec :
- Design responsive
- Couleurs douces (vert/bleu champêtre)
- Émojis pour une meilleure UX
- Animations subtiles avec Tailwind

## 🚀 Déploiement

1. **Variables d'environnement** : configurez les variables de production
2. **Base de données** : déployez PostgreSQL
3. **Migration** : `pnpm db:migrate` en production
4. **Build** : `pnpm build`
5. **Start** : `pnpm start`

## 📄 Licence

Ce projet est libre d'utilisation pour organiser vos propres weekends champêtres ! 🌿