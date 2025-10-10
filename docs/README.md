# Harmonith (anciennement Nutri'Form)

Application web de fitness et nutrition complète pour suivre ses exercices, calculer ses besoins caloriques et gérer sa progression.

## 🚀 Fonctionnalités

### ✅ Actuellement disponibles
- **Calculateur de calories** - Calcul du métabolisme de base avec 3 formules (Harris-Benedict, Mifflin-St Jeor, Katch-McArdle)
- **Calculateur IMC** - Calcul de l'Indice de Masse Corporelle avec catégorisation détaillée et conseils personnalisés
- **Bibliothèque d'exercices** - Plus de 300 exercices disponibles
  - Musculation (poids du corps, haltères, barres, machines, kettlebells, poulies)
  - Cardio (course, vélo, rameur, elliptique, corde à sauter, etc.)
  - Natation (crawl, brasse)
  - Méditation (pleine conscience, scan corporel, respiration consciente, marche consciente)
  - Étirement et renforcement
- **Moteur de recherche d'exercices intelligent** - Filtrage avancé par type, équipement, groupes musculaires
- **Programmes personnalisés** - Création illimitée de programmes d'entraînement avec drag-and-drop
- **Suivi de progression avec graphiques** - Visualisation de vos performances et évolution
- **Historique des séances d'entraînement** - Consultation de toutes vos séances passées
- **Newsletter** - Inscription à la newsletter pour rester informé
- **Système d'authentification** - Connexion sécurisée avec email/password et JWT
- **Mode sombre/clair** - Interface adaptative avec support du mode sombre manuel et automatique
- **Multilingue** - Support de 4 langues (FR, EN, DE, ES) avec traductions complètes
- **Sécurité renforcée** - Helmet.js et rate limiting pour protéger l'API
- **SEO optimisé** - Schema.org, sitemap, robots.txt, meta tags complets
- **Interface mobile optimisée** - Touch gestures, drag-and-drop mobile friendly

### 🔄 En développement
- **Authentification Google OAuth** - Connexion simplifiée avec compte Google (en cours ⚡)
- **Audio guidé pour méditation** - Sessions de méditation avec accompagnement vocal
- **Notifications push** - Rappels et motivation pour les séances d'entraînement
- **Synchronisation calories avec smartphone** - Connexion avec Apple Health / Google Fit

### 📋 Fonctionnalités planifiées (voir FEATURES.md & ROADMAP.md)
- Authentification via Apple Sign In
- Système de dons pour soutenir le projet
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
- i18next (Internationalisation)
- Microsoft Clarity (Analytics)

### Backend
- Node.js + Express
- MongoDB (Base de données NoSQL)
- Mongoose (ODM)
- JWT (Authentification)
- Helmet.js (Sécurité HTTP)
- Express Rate Limit (Protection contre les abus)

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

## 📋 TODO - Prochaines tâches

### Traductions
- [ ] Compléter les traductions dans les composants suivants :
  - `MuscuTable.jsx`, `CardioTable.jsx`, `PdcTable.jsx` - "+ Ajouter une série" et "Supprimer la série"
  - `NotesSection.jsx` - "Ajouter des notes..."
  - `ExerciceCard.jsx` (dans ExerciceResults) - Labels "Ajouter", "Supprimer"
  - `ExerciseResults.jsx` - "+ Ajouter d'autres exercices", messages d'erreur

### Exercices et types
- [ ] **Remplacer "Renforcement" par "Yoga"** dans CardChoice
  - Changer la position : placer Yoga avant Natation
  - Ajouter des exercices de yoga dans la base de données (db.json)
  - Créer les exercices avec type "yoga", équipement "poids-du-corps"

### Échauffement
- [ ] **Ajouter un bouton "Échauffement" dans le formulaire de suivi d'exercices**
  - Positionner le bouton en haut du formulaire
  - Au clic : proposer une routine d'échauffement de 5 minutes
  - Afficher un chrono de 5 minutes
  - Afficher un GIF animé de l'échauffement
  - Générer un texte explicatif adapté aux exercices sélectionnés par l'utilisateur
  - L'échauffement doit être contextualisé selon les groupes musculaires ciblés

### Audio et notifications
- [ ] Implémenter l'audio guidé pour les séances de méditation
- [ ] Mettre en place le système de notifications push
- [ ] Intégrer la synchronisation avec Apple Health / Google Fit

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