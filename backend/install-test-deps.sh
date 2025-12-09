#!/bin/bash

echo "=========================================="
echo "Installation des dépendances de test"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installation de mongodb-memory-server...${NC}"
echo "Note: Cette dépendance est volumineuse (~350MB) - ceci est normal"
echo ""

npm install --save-dev mongodb-memory-server

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ mongodb-memory-server installé avec succès${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'installation${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Vérification des dépendances"
echo "=========================================="
echo ""

# Vérifier jest
if npm list jest > /dev/null 2>&1; then
    echo -e "${GREEN}✅ jest installé${NC}"
else
    echo -e "${RED}❌ jest non installé${NC}"
fi

# Vérifier supertest
if npm list supertest > /dev/null 2>&1; then
    echo -e "${GREEN}✅ supertest installé${NC}"
else
    echo -e "${RED}❌ supertest non installé${NC}"
fi

# Vérifier mongodb-memory-server
if npm list mongodb-memory-server > /dev/null 2>&1; then
    echo -e "${GREEN}✅ mongodb-memory-server installé${NC}"
else
    echo -e "${RED}❌ mongodb-memory-server non installé${NC}"
fi

echo ""
echo "=========================================="
echo "Tests disponibles"
echo "=========================================="
echo ""
echo "Lancer tous les tests:"
echo "  npm test"
echo ""
echo "Tests avec coverage:"
echo "  npm run test:coverage"
echo ""
echo "Tests en mode watch:"
echo "  npm run test:watch"
echo ""
echo "Tests spécifiques:"
echo "  npm test -- __tests__/unit/sanitizer.test.js"
echo "  npm test -- __tests__/unit/program.validation.test.js"
echo "  npm test -- __tests__/unit/program.access.test.js"
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo "=========================================="
echo ""
echo "Prochaine étape: npm test"
echo ""
