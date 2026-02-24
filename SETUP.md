# 🚀 Instructions de setup rapide

## 1. Configuration de l'environnement

Créez le fichier `.env` :
```bash
# Copiez les variables d'environnement
DATABASE_URL="postgresql://postgres:password@localhost:5434/congres_champetre?schema=public"
NEXTAUTH_SECRET="votre-cle-secrete-super-longue-et-aleatoire"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optionnels - laissez vide si non utilisés)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# SMTP (emailing admin global)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Congres Champetre <noreply@congres-champetre.com>"
SMTP_SECURE="false"
```

## 2. Base de données PostgreSQL

### Option A : Docker (recommandé)
```bash
# Démarrer PostgreSQL avec Docker
docker-compose up -d
```

### Option B : PostgreSQL local
Installez PostgreSQL et créez une base `congres_champetre`

## 3. Setup du projet

```bash
# Installer les dépendances
pnpm install

# Générer le client Prisma
pnpm db:generate

# Créer les tables
pnpm db:migrate

# (Optionnel) Créer un admin et des données d'exemple
pnpm db:seed
```

## 4. Lancement

```bash
# Démarrer le serveur de développement
pnpm dev
```

Rendez-vous sur [http://localhost:3000](http://localhost:3000)

## 5. Configuration OAuth (optionnel)

Pour utiliser Google, Discord ou GitHub, configurez vos applications OAuth :

- **Google** : [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0
- **Discord** : [Discord Developer Portal](https://discord.com/developers/applications)
- **GitHub** : [GitHub OAuth Apps](https://github.com/settings/developers)

Callbacks URLs : `http://localhost:3000/api/auth/callback/{provider}`

## 6. Connexion admin

Si vous avez exécuté le seed :
- **Email** : `admin@congres-champetre.com`
- **Mot de passe** : `admin123`

⚠️ **Changez ce mot de passe immédiatement !**

## 7. Connexion utilisateur

Les utilisateurs peuvent maintenant se connecter via :
- 🔐 **Email/mot de passe** (classique)
- 🌐 **Google** (si configuré)
- 💬 **Discord** (si configuré) 
- 🐙 **GitHub** (si configuré)

## 8. Commit initial

```bash
git add .
git commit -m "✨ feat: site complet de gestion de congrès champêtre avec OAuth

🏛️ Fonctionnalités :
- 🔐 Authentification NextAuth + Prisma + OAuth (Google/Discord/GitHub)
- 👤 Dashboard utilisateur avec gestion conférences
- ⚙️ Panel admin pour créneaux et assignations
- 🎨 Interface minimaliste avec shadcn/ui
- 📊 Base PostgreSQL complète
- 🐳 Docker Compose pour développement
- 🌐 Connexion multi-providers (email, Google, Discord, GitHub)"
```

---

**🌿 Votre site de congrès champêtre est prêt !**