#!/bin/bash

# Script de déploiement Harmonith avec SSR
# Ce script build le frontend (client + serveur SSR) et prépare le déploiement

set -e # Arrêter en cas d'erreur

echo "🚀 Début du déploiement Harmonith avec SSR..."

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Vérifier que nous sommes à la racine du projet
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

log_info "✅ Répertoire racine du projet détecté"

# 2. Vérifier Node.js et npm
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
    exit 1
fi

log_info "Node.js version: $(node -v)"
log_info "npm version: $(npm -v)"

# 3. Installer les dépendances du frontend
log_info "📦 Installation des dépendances frontend..."
cd frontend
npm install
cd ..

# 4. Installer les dépendances du backend (jsdom pour SSR)
log_info "📦 Installation des dépendances backend..."
cd backend
npm install
cd ..

# 5. Build du frontend (client + serveur)
log_info "🔨 Build du frontend (client + serveur SSR)..."
cd frontend

# Build client
log_info "   → Build client..."
npm run build:client

# Build serveur SSR
log_info "   → Build serveur SSR..."
npm run build:server

cd ..

log_info "✅ Build frontend terminé"

# 6. Vérifier que les builds ont réussi
if [ ! -d "frontend/dist" ]; then
    log_error "Le build client a échoué (frontend/dist manquant)"
    exit 1
fi

if [ ! -d "frontend/dist/server" ]; then
    log_error "Le build serveur SSR a échoué (frontend/dist/server manquant)"
    exit 1
fi

if [ ! -f "frontend/dist/server/entry-server.js" ]; then
    log_error "Le fichier entry-server.js est manquant"
    exit 1
fi

log_info "✅ Vérification des builds réussie"

# 7. Afficher les statistiques
log_info "📊 Statistiques des builds:"
echo "   Client: $(du -sh frontend/dist | cut -f1)"
echo "   Serveur SSR: $(du -sh frontend/dist/server | cut -f1)"

# 8. Instructions de déploiement
echo ""
log_info "🎉 Build terminé avec succès!"
echo ""
echo "📋 Prochaines étapes pour déployer:"
echo "   1. Assurez-vous que votre serveur a Node.js installé"
echo "   2. Copiez les dossiers suivants sur votre serveur:"
echo "      - backend/"
echo "      - frontend/dist/"
echo "   3. Sur le serveur, installez les dépendances de production:"
echo "      cd backend && npm install --production"
echo "   4. Configurez vos variables d'environnement (.env)"
echo "   5. Démarrez le serveur:"
echo "      cd backend && npm start"
echo ""
log_info "Le serveur Express servira automatiquement:"
log_info "   - L'API sur /api/*"
log_info "   - Le frontend avec SSR sur toutes les autres routes"
echo ""
