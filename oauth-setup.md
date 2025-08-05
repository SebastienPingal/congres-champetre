# 🔐 Configuration OAuth - Guide détaillé

Ce guide vous aide à configurer l'authentification OAuth avec Google, Discord et GitHub.

## 🌐 Google OAuth

### 1. Accéder à Google Cloud Console
- Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/)
- Connectez-vous avec votre compte Google

### 2. Créer/Sélectionner un projet
- Créez un nouveau projet ou sélectionnez un projet existant
- Notez l'ID du projet

### 3. Activer les APIs nécessaires
- Dans le menu, allez à "APIs & Services" > "Library"
- Recherchez et activez "Google+ API" ou "Google People API"

### 4. Créer les identifiants OAuth 2.0
- Allez à "APIs & Services" > "Credentials"
- Cliquez "Create Credentials" > "OAuth 2.0 Client IDs"
- Type d'application : "Web application"
- Nom : "Congrès Champêtre"
- URIs de redirection autorisées :
  - `http://localhost:3000/api/auth/callback/google` (développement)
  - `https://votre-domaine.com/api/auth/callback/google` (production)

### 5. Récupérer les clés
```env
GOOGLE_CLIENT_ID="votre-client-id-google"
GOOGLE_CLIENT_SECRET="votre-client-secret-google"
```

---

## 💬 Discord OAuth

### 1. Accéder au Discord Developer Portal
- Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
- Connectez-vous avec votre compte Discord

### 2. Créer une nouvelle application
- Cliquez "New Application"
- Nom : "Congrès Champêtre"
- Acceptez les conditions

### 3. Configurer OAuth2
- Dans le menu latéral, cliquez "OAuth2"
- Dans "Redirects", ajoutez :
  - `http://localhost:3000/api/auth/callback/discord` (développement)
  - `https://votre-domaine.com/api/auth/callback/discord` (production)

### 4. Récupérer les clés
- Client ID est visible sur la page "General Information"
- Pour le Client Secret, cliquez "Reset Secret" sur la page OAuth2

```env
DISCORD_CLIENT_ID="votre-client-id-discord"
DISCORD_CLIENT_SECRET="votre-client-secret-discord"
```

---

## 🐙 GitHub OAuth

### 1. Accéder aux paramètres GitHub
- Connectez-vous à GitHub
- Allez dans Settings > Developer settings > OAuth Apps
- Ou directement : [GitHub OAuth Apps](https://github.com/settings/developers)

### 2. Créer une nouvelle OAuth App
- Cliquez "New OAuth App"
- Remplissez les informations :
  - **Application name** : "Congrès Champêtre"
  - **Homepage URL** : `http://localhost:3000` (ou votre domaine)
  - **Authorization callback URL** : `http://localhost:3000/api/auth/callback/github`

### 3. Récupérer les clés
- Client ID est visible après création
- Cliquez "Generate a new client secret" pour obtenir le secret

```env
GITHUB_CLIENT_ID="votre-client-id-github"
GITHUB_CLIENT_SECRET="votre-client-secret-github"
```

---

## 🔧 Configuration finale

### Votre fichier `.env` complet :
```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5434/congres_champetre?schema=public"

# NextAuth
NEXTAUTH_SECRET="votre-cle-secrete-super-longue-et-aleatoire"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="votre-client-id-google"
GOOGLE_CLIENT_SECRET="votre-client-secret-google"

DISCORD_CLIENT_ID="votre-client-id-discord"
DISCORD_CLIENT_SECRET="votre-client-secret-discord"

GITHUB_CLIENT_ID="votre-client-id-github"
GITHUB_CLIENT_SECRET="votre-client-secret-github"
```

### ⚠️ Sécurité
- **Jamais** de commit des secrets dans Git
- Utilisez des secrets différents pour dev/staging/production
- Régénérez les secrets en cas de doute
- Limitez les domaines autorisés en production

### 🧪 Test
1. Redémarrez votre serveur après avoir configuré les variables
2. Allez sur `http://localhost:3000/auth/signin`
3. Testez chaque provider configuré
4. Vérifiez que les utilisateurs sont bien créés dans votre base

---

## 🚀 En production

Pour la production, n'oubliez pas de :
1. Mettre à jour les URLs de callback avec votre domaine réel
2. Configurer les variables d'environnement sur votre plateforme
3. Vérifier les domaines autorisés dans chaque console OAuth