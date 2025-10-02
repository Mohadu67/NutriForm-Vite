# Harmonith (anciennement Nutri'Form)

Application web de fitness et nutrition complète pour suivre ses exercices, calculer ses besoins caloriques et gérer sa progression.

## 🚀 Fonctionnalités

### ✅ Actuellement disponibles
- **Calculateur de calories** - Calcul du métabolisme de base avec 3 formules (Harris-Benedict, Mifflin-St Jeor, Katch-McArdle)
- **Calculateur IMC** - Calcul de l'Indice de Masse Corporelle avec catégorisation détaillée et conseils personnalisés
- **Bibliothèque d'exercices** - Plus de 300 exercices disponibles
- **Programmes personnalisés** - Création illimitée de programmes d'entraînement
- **Suivi de progression avec graphiques** - Visualisation de vos performances et évolution
- **Historique des séances d'entraînement** - Consultation de toutes vos séances passées
- **Newsletter** - Inscription à la newsletter pour rester informé

### 🔄 En développement
- **Authentification Google OAuth** - Connexion simplifiée avec compte Google (en cours ⚡)
- Système d'authentification (email/password)

### 📋 Fonctionnalités planifiées (voir FEATURES.md & ROADMAP.md)
- Authentification via Apple Sign In
- Système de dons pour soutenir le projet
- Mode sombre/clair
- Système d'amis et suivi social
- Classements et leaderboards
- Système de compte Premium avec fonctionnalités avancées
- Mode hors-ligne (PWA)
- Application mobile (React Native)

## 🛠️ Technologies

### Frontend
- React 18 + Vite
- React Router
- CSS Modules
- Microsoft Clarity (Analytics)

### Backend
- Node.js + Express
- MongoDB (Base de données NoSQL)
- Mongoose (ODM)

## 📦 Installation

```bash
# Cloner le repo
git clone [url-du-repo]

# Installer les dépendances (root)
npm install

# Installer les dépendances frontend
cd frontend
npm install

# Installer les dépendances backend
cd ../backend
npm install

# Configurer les variables d'environnement
# Créer un fichier .env dans /backend avec :
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=3000

# Démarrer le projet (depuis la racine)
npm run dev
```

## 📝 Licence

Ce projet est sous licence **MIT License**.

Vous êtes libre de :
- ✅ Utiliser le code à des fins commerciales
- ✅ Modifier le code
- ✅ Distribuer le code
- ✅ Utiliser le code en privé

Conditions :
- 📄 Inclure une copie de la licence et du copyright dans toute distribution
- ⚠️ Le logiciel est fourni "tel quel", sans garantie d'aucune sorte

Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

Voir la section "Qui sommes-nous ?" sur le site