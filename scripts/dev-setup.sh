#!/bin/bash

echo "🏛️ Configuration du projet Congrès Champêtre"
echo "============================================"

# Vérifier que pnpm est installé
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm n'est pas installé. Installez-le avec: npm install -g pnpm"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances avec pnpm..."
pnpm install

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "⚠️  Le fichier .env n'existe pas."
    echo "Créez-le en copiant .env.example et en modifiant les valeurs :"
    echo "cp .env.example .env"
    echo ""
    echo "Variables requises :"
    echo "- DATABASE_URL : URL de connexion PostgreSQL"
    echo "- NEXTAUTH_SECRET : clé secrète pour NextAuth"
    echo "- NEXTAUTH_URL : URL de l'application (http://localhost:3000 en dev)"
    exit 1
fi

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
pnpm db:generate

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "Pour démarrer le développement :"
echo "1. Démarrez PostgreSQL (docker-compose up -d ou votre instance locale)"
echo "2. Exécutez les migrations : pnpm db:migrate"
echo "3. (Optionnel) Seedez la base : pnpm db:seed"
echo "4. Lancez le serveur de dev : pnpm dev"
echo ""
echo "🌿 Bon développement !"