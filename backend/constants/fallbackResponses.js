/**
 * Reponses fallback pour le chatbot quand OpenAI n'est pas disponible
 * Structure: { category: { keywords: [], response: '' } }
 */

const FALLBACK_RESPONSES = {
  // ========== SALUTATIONS ==========
  greeting: {
    keywords: ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir', 'yo', 'cc'],
    response: `Salut ! 👋 Bienvenue sur Harmonith !

Je suis ton assistant virtuel et je suis là pour t'aider avec :

💪 **Fitness & Entraînement :**
• Questions sur les exercices
• Utilisation des calculateurs (IMC, calories, 1RM)
• Conseils d'entraînement (hors avis médical)

📱 **Fonctionnalités de l'app :**
• Dashboard et statistiques
• Système de matching de partenaires
• Abonnement Premium (3,99€/mois)

🛠️ **Support technique :**
• Problèmes techniques
• Configuration du profil
• Utilisation générale

Comment puis-je t'aider aujourd'hui ? 😊`
  },

  // ========== REMERCIEMENTS ==========
  thanks: {
    keywords: ['merci', 'thank', 'thx', 'cool', 'super', 'genial', 'top', 'parfait'],
    response: "De rien ! 😊 C'est toujours un plaisir d'aider. N'hésite pas si tu as d'autres questions - je suis là pour ça ! Bon entraînement et que la force soit avec toi ! 💪🔥"
  },

  // ========== PREMIUM & ABONNEMENT ==========
  premium: {
    keywords: ['premium', 'prix', 'abonnement', 'payant', 'cout', 'combien', 'tarif', 'payer', 'subscription'],
    response: `🌟 **Harmonith Premium - 3,99€/mois**

Avec Premium, tu débloque l'expérience complète :

✅ **Fonctionnalités principales :**
• 💾 Sauvegarde illimitée de toutes tes séances
• 📊 Dashboard complet avec statistiques avancées et graphiques de progression
• 🏆 Système de badges et de points pour te motiver
• 🥇 Accès au Leaderboard pour te comparer aux autres
• 💬 Matching illimité de partenaires d'entraînement
• 💬 Chat privé avec tes matchs sportifs
• 📅 Heatmap d'activité pour visualiser ton assiduité

🎁 **7 jours d'essai gratuit** - Aucun engagement, tu peux annuler à tout moment !

Tu peux essayer dès maintenant sur /pricing 💪`
  },

  // ========== VERSION GRATUITE ==========
  free: {
    keywords: ['gratuit', 'free', 'sans payer', 'gratos', 'version gratuite'],
    response: `🆓 **Version Gratuite d'Harmonith** - Déjà bien équipée !

Avec le plan gratuit, tu as accès à :

✅ **Exercices :**
• Bibliothèque complète d'exercices avec descriptions détaillées
• Vidéos de démonstration
• Instructions étape par étape

✅ **Calculateurs fitness :**
• Calculateur d'IMC (Indice de Masse Corporelle)
• Calcul de calories journalières recommandées
• Calculateur 1RM (charge maximale)

✅ **Entraînement :**
• Suivi de séance en temps réel
• Chronomètre et compteur de répétitions
• Accès limité au matching de partenaires

⚠️ **Limitation :** Les séances ne sont pas sauvegardées

Pour sauvegarder tes séances et débloquer toutes les stats, passe Premium (3,99€/mois, 7 jours gratuits) 🚀`
  },

  // ========== DASHBOARD ==========
  dashboard: {
    keywords: ['dashboard', 'tableau de bord', 'stats', 'statistique', 'graphique', 'progression', 'suivi'],
    response: `📊 **Le Dashboard Harmonith** - Ton centre de contrôle fitness !

Avec le Dashboard Premium, tu as accès à :

📈 **Statistiques avancées :**
• Nombre total de séances et temps d'entraînement
• Calories brûlées cumulées
• Progression semaine par semaine
• Graphiques de performances

🎯 **Analyse de tes activités :**
• Répartition par type d'exercice (cardio, muscu, yoga...)
• Heatmap d'activité pour voir tes jours les plus actifs
• Suivi de tes records personnels

🏆 **Gamification :**
• Badges de récompense débloqués
• Points de progression
• Classement sur le Leaderboard

C'est disponible en Premium (3,99€/mois, 7 jours gratuits). Ça te tente ? 🚀`
  },

  // ========== MATCHING ==========
  matching: {
    keywords: ['match', 'partenaire', 'rencontre', 'binome', 'buddy', 'ami', 'trouver', 'like', 'swipe'],
    response: `🤝 **Système de Matching Harmonith** - Trouve ton binôme sportif !

Le matching te permet de rencontrer des partenaires d'entraînement compatibles :

🎯 **Comment ça marche :**
1. Configure ton profil (objectifs, niveau, préférences)
2. Swipe les profils : Like 💚 ou Dislike ❌
3. Si c'est réciproque = Match ! 🎉
4. Chattez ensemble et planifiez vos séances

💡 **Critères de matching :**
• Objectifs similaires (perte de poids, prise de masse, endurance...)
• Niveau d'expérience compatible
• Préférences d'entraînement
• Localisation géographique

✅ **Gratuit :** Accès limité au matching
⭐ **Premium :** Matching illimité + chat privé avec tes partenaires

Prêt à trouver ton buddy sportif ? 💪`
  },

  // ========== LEADERBOARD ==========
  leaderboard: {
    keywords: ['leaderboard', 'classement', 'rang', 'comparer', 'ranking', 'top', 'meilleurs'],
    response: `🏆 **Leaderboard Harmonith** - Compare-toi aux meilleurs !

Le Leaderboard te permet de voir où tu te situes par rapport aux autres utilisateurs :

📊 **Système de points :**
• Gagne des points à chaque séance complétée
• Plus la séance est intense, plus tu gagnes de points
• Régularité = bonus multiplicateur

🥇 **Classements disponibles :**
• Classement général (tous utilisateurs)
• Classement hebdomadaire
• Classement mensuel
• Classement entre amis/partenaires

🎯 **Pourquoi c'est motivant :**
• Voir ta progression dans le temps
• Te challenger avec la communauté
• Débloquer des badges exclusifs

✨ Fonctionnalité Premium - Essaie 7 jours gratuitement ! 💪`
  },

  // ========== BADGES ==========
  badges: {
    keywords: ['badge', 'recompense', 'achievement', 'trophee', 'medaille', 'accomplissement'],
    response: `🏅 **Système de Badges Harmonith**

Débloque des badges en accomplissant des défis :

🔥 **Badges de régularité :**
• 🔥 Série de 7 jours consécutifs
• ⚡ Série de 30 jours
• 💎 100 séances complétées

💪 **Badges de performance :**
• 🎯 Premier record personnel
• 🏋️ 1000 kg soulevés au total
• 🏃 100 km parcourus

🌟 **Badges spéciaux :**
• 🦾 Première utilisation de tous les calculateurs
• 🤝 Premier match sportif
• 👑 Top 10 du Leaderboard

Chaque badge te donne des points bonus ! Prêt à les collectionner ? 🎖️`
  },

  // ========== EXERCICES ==========
  exercises: {
    keywords: ['exercice', 'mouvement', 'entrainement', 'workout', 'seance', 'training'],
    response: `🏋️ **Bibliothèque d'exercices Harmonith**

Tu as accès à une bibliothèque complète d'exercices classés par :

📋 **Catégories principales :**
• 💪 Musculation (pectoraux, dos, jambes, bras...)
• 🏃 Cardio (course, vélo, natation, HIIT...)
• 🧘 Stretching & Yoga
• 🥊 Sports de combat et entraînement fonctionnel

✅ **Pour chaque exercice :**
• Description détaillée de l'exécution
• Vidéo de démonstration
• Muscles ciblés
• Conseils de sécurité
• Variantes (débutant, intermédiaire, avancé)

Tu cherches un type d'exercice en particulier ? Je peux te guider ! 🎯`
  },

  // ========== MOTIVATION ==========
  motivation: {
    keywords: ['motiv', 'encouragement', 'flemme', 'pas envie', 'fatigue', 'courage', 'demotiv', 'envie'],
    response: `💪 **Boost de motivation incoming !**

Tu te sens démotivé ? C'est normal, ça arrive à tout le monde ! Voici quelques tips :

🔥 **Techniques anti-flemme :**
• Commence par 5 minutes - souvent, tu continueras après
• Mets ta tenue de sport, ça te mettra dans l'ambiance
• Écoute une playlist ultra motivante 🎵
• Rappelle-toi POURQUOI tu as commencé
• Visualise comment tu te sentiras APRÈS la séance

💡 **Astuce Harmonith :**
• Trouve un partenaire via le Matching - c'est plus difficile de zapper quand quelqu'un compte sur toi !
• Regarde tes progrès sur le Dashboard
• Vise un badge ou un objectif du Leaderboard

🎯 **Citation du jour :**
"Le seul entraînement raté, c'est celui que tu n'as pas fait."

Allez, let's go champion ! Tu vas le regretter si tu ne le fais pas, mais jamais si tu le fais ! 🔥💪`
  },

  // ========== NUTRITION ==========
  nutrition: {
    keywords: ['nutrition', 'manger', 'alimentation', 'regime', 'calorie', 'nourriture', 'diet', 'repas'],
    response: `🍎 **Nutrition & Harmonith**

Harmonith se concentre principalement sur le fitness, mais on a quelques outils nutritionnels :

✅ **Ce qu'on propose :**
• Calculateur de calories journalières recommandées
• Estimation des calories brûlées par séance
• Conseils généraux d'alimentation équilibrée

🥗 **Principes de base :**
• Protéines : 1,6-2g par kg de poids corporel (pour la masse musculaire)
• Glucides : Source d'énergie principale pour l'entraînement
• Lipides : 20-30% de ton apport calorique total
• Hydratation : 2-3L d'eau par jour

⚠️ **Important :**
Pour un plan nutritionnel personnalisé, je recommande de consulter un nutritionniste ou diététicien qualifié.

💡 **Astuce :** Utilise notre calculateur de calories dans la section "Outils" ! 📊`
  },

  // ========== PECTORAUX ==========
  chest: {
    keywords: ['pectoraux', 'pecs', 'poitrine', 'chest', 'torse'],
    response: `💪 **Entraînement des Pectoraux**

Dans la bibliothèque d'exercices, retrouve les meilleurs mouvements pour les pecs :

🏋️ **Exercices recommandés :**
• Développé couché (barbell bench press)
• Pompes et variantes
• Écarté aux haltères
• Dips pour les pecs
• Développé incliné

📊 **Programme type :**
• 3-4 exercices par séance
• 8-12 répétitions par série
• 3-4 séries par exercice
• 2-3 séances par semaine

💡 **Conseil pro :** Varie les angles (incliné, décliné, plat) pour un développement complet !

Retrouve tous les détails avec vidéos dans la section Exercices 🎯`
  },

  // ========== DOS ==========
  back: {
    keywords: ['dos', 'dorsaux', 'lats', 'back', 'tractions'],
    response: `🔥 **Entraînement du Dos**

Un dos massif, c'est la base d'un physique équilibré !

🏋️ **Exercices essentiels :**
• Tractions (pull-ups) - le roi du dos
• Rowing barre / haltères
• Tirage vertical
• Soulevé de terre (deadlift)
• Tirage horizontal

📊 **Structure d'entraînement :**
• 4-5 exercices par séance
• 8-12 répétitions
• Focus sur la connexion esprit-muscle
• 2 séances par semaine minimum

🎯 **Astuce :** Tire avec tes coudes, pas avec tes mains, pour mieux activer les dorsaux !

Tous les tutos vidéos sont dans la bibliothèque d'exercices 💪`
  },

  // ========== JAMBES ==========
  legs: {
    keywords: ['jambes', 'cuisses', 'legs', 'quadri', 'squat', 'mollets'],
    response: `🦵 **Entraînement des Jambes**

Never skip leg day ! 💀

🏋️ **Exercices de base :**
• Squat (roi des exercices)
• Presse à cuisses
• Fentes (lunges)
• Leg curl & leg extension
• Soulevé de terre jambes tendues

📊 **Programme type :**
• 5-6 exercices par séance
• 10-15 répétitions (les jambes aiment le volume)
• 4 séries par exercice
• 1-2 séances par semaine

💡 **Fun fact :** Les jambes représentent 50% de ta masse musculaire. Les entraîner booste ta production d'hormones de croissance !

Check les vidéos détaillées dans l'app 🔥`
  },

  // ========== PERTE DE POIDS ==========
  weightLoss: {
    keywords: ['perte de poids', 'maigrir', 'perdre', 'secher', 'mincir', 'kilos', 'weight loss'],
    response: `🔥 **Perte de poids & Sèche**

Pour perdre du poids efficacement :

📊 **Principe de base :**
• Déficit calorique : consomme moins de calories que tu n'en dépenses
• Vise 300-500 kcal de déficit par jour

🏃 **Entraînement recommandé :**
• Cardio : 3-5x par semaine (course, vélo, HIIT)
• Musculation : 2-3x par semaine (maintenir la masse musculaire)
• Étirements : pour la récupération

💡 **Tips Harmonith :**
• Utilise le calculateur de calories dans l'app
• Track tes séances pour voir ta progression
• Le Dashboard Premium te montre tes calories brûlées

⚠️ **Important :** Vise 0,5-1 kg par semaine maximum pour une perte durable !

Tu peux le faire ! 💪🔥`
  },

  // ========== PRISE DE MASSE ==========
  massGain: {
    keywords: ['prise de masse', 'muscle', 'grossir', 'prendre du poids', 'muscler', 'mass', 'gonfler'],
    response: `💪 **Prise de Masse Musculaire**

Tu veux prendre du muscle ? Voici le plan :

📊 **Principes fondamentaux :**
• Surplus calorique : +300-500 kcal par jour
• Protéines : 1,8-2g par kg de poids corporel
• Entraînement en force : 8-12 répétitions

🏋️ **Programme type :**
• Musculation : 4-5x par semaine
• Exercices composés (squat, développé couché, deadlift)
• Progression progressive (surcharge progressive)
• Repos : 7-9h de sommeil par nuit

💡 **Astuce Harmonith :**
• Utilise le calculateur 1RM pour suivre ta force
• Track toutes tes séances en Premium
• Suis ta progression sur le Dashboard

🎯 **Patience :** Vise 0,5-1kg par mois de muscle de qualité !

Let's grow ! 💪🔥`
  },

  // ========== DEBUTANT ==========
  beginner: {
    keywords: ['debutant', 'commencer', 'debuter', 'nouveau'],
    response: `🌱 **Bienvenue dans le monde du fitness !**

Félicitations pour ta décision de commencer ! 🎉

📋 **Par où commencer :**
1. **Semaine 1-2 :** Familiarise-toi avec les mouvements basiques
2. **Semaine 3-4 :** Augmente progressivement l'intensité
3. **Mois 2+ :** Établis une routine régulière

🏋️ **Programme débutant type :**
• 3 séances par semaine (lundi, mercredi, vendredi)
• Corps complet (full body)
• 30-45 minutes par séance
• Focus sur la technique avant la charge

💡 **Conseils essentiels :**
• Échauffe-toi toujours (5-10 min)
• Commence léger, maîtrise la forme
• Écoute ton corps, évite les blessures
• La régularité > l'intensité au début

🎯 **Harmonith t'accompagne :**
• Vidéos explicatives pour chaque exercice
• Variantes débutant disponibles
• Calculateurs pour personnaliser ton parcours

Tu as toutes les cartes en main ! Allez, c'est parti ! 🚀💪`
  },

  // ========== DUREE ENTRAINEMENT ==========
  duration: {
    keywords: ['combien de temps', 'duree', 'minutes', 'heures'],
    response: `⏱️ **Durée d'entraînement optimale**

Ça dépend de ton niveau et tes objectifs :

🏋️ **Musculation :**
• Débutant : 30-45 minutes
• Intermédiaire : 45-60 minutes
• Avancé : 60-90 minutes

🏃 **Cardio :**
• HIIT : 15-30 minutes
• Cardio modéré : 30-60 minutes
• Endurance : 60+ minutes

💡 **Règle d'or :**
Plus long ≠ meilleur ! L'intensité compte plus que la durée.

🎯 **Recommandation générale :**
• 3-5 séances par semaine
• 45-60 minutes par séance
• + 5-10 min d'échauffement
• + 5-10 min d'étirements

⚡ **Astuce Harmonith :** Le chronomètre intégré t'aide à tracker ton temps d'entraînement !

Qualité > Quantité ! 💪`
  },

  // ========== RECUPERATION ==========
  recovery: {
    keywords: ['repos', 'recuperation', 'sommeil', 'dormir', 'courbatures'],
    response: `😴 **Récupération & Repos**

La récupération, c'est où le muscle se construit vraiment !

🛌 **Sommeil :**
• 7-9 heures par nuit minimum
• Le sommeil = hormone de croissance
• Mauvais sommeil = mauvaise récupération

⏸️ **Jours de repos :**
• Minimum 1-2 jours complets par semaine
• Repos actif possible (marche, yoga léger)
• Écoute ton corps !

💆 **Techniques de récupération :**
• Étirements post-séance
• Hydratation (2-3L d'eau/jour)
• Alimentation adaptée (protéines + glucides)
• Bain chaud ou douche froide
• Massage ou foam roller

🩹 **Courbatures :**
• Normal après entraînement intense
• Disparaissent en 24-72h
• Léger mouvement aide (marche, vélo doux)
• Ne t'entraîne pas à fond sur un muscle courbaturé

💡 **Astuce :** Sur Harmonith, la heatmap Premium te montre si tu t'entraînes trop ou pas assez ! 📊

Le repos fait partie de l'entraînement ! 💪😴`
  },

  // ========== BLESSURES ==========
  injury: {
    keywords: ['blessure', 'douleur', 'mal', 'tendinite'],
    response: `🩹 **Prévention des blessures**

⚠️ **IMPORTANT :** En cas de douleur persistante, consulte un médecin ou kiné !

🛡️ **Prévention :**
• Toujours s'échauffer correctement
• Maîtrise la technique avant d'augmenter la charge
• Progression progressive (augmente de 5-10% max par semaine)
• Écoute ton corps - douleur ≠ normal
• Étire-toi régulièrement

🚨 **Signes d'alerte :**
• Douleur aiguë ou soudaine
• Douleur qui persiste après 48-72h
• Gonflement ou rougeur
• Perte de mobilité

💡 **Douleur vs Inconfort :**
• Inconfort musculaire = OK (courbatures)
• Douleur articulaire = PAS OK
• Douleur qui empire = STOP immédiatement

🎯 **En cas de blessure mineure :**
1. RICE : Repos, Glace, Compression, Élévation
2. Arrête l'exercice concerné
3. Laisse le temps de guérir complètement

⚠️ Je ne peux pas remplacer un avis médical. En cas de doute, consulte un professionnel !

Prends soin de toi ! 💪`
  },

  // ========== IMC ==========
  bmi: {
    keywords: ['imc', 'indice de masse'],
    response: `📊 **Calculateur IMC**

L'IMC (Indice de Masse Corporelle) évalue ton poids par rapport à ta taille.

📐 **Formule :**
IMC = Poids (kg) / Taille² (m)

📊 **Interprétation :**
• < 18,5 : Insuffisance pondérale
• 18,5 - 24,9 : Poids normal
• 25 - 29,9 : Surpoids
• > 30 : Obésité

⚠️ **Limites de l'IMC :**
L'IMC ne prend pas en compte la masse musculaire. Un athlète très musclé peut avoir un IMC élevé tout en étant en excellente forme !

💡 **Harmonith :** Utilise notre calculateur IMC dans la section Outils pour un calcul instantané !

L'IMC est un indicateur parmi d'autres, pas une vérité absolue ! 📊`
  },

  // ========== QUI ES-TU ==========
  about: {
    keywords: ['qui es tu', 'tu es qui', 'c\'est quoi', 'harmonith c\'est quoi', 'qu\'est ce que', 'comment ca marche', 'explique', 'presente'],
    response: `🌟 **Bienvenue sur Harmonith !**

Harmonith est ton application fitness complète :

🏋️ **Entraînement :**
• Bibliothèque d'exercices avec vidéos
• Programmes personnalisés (HIIT, circuit, tabata...)
• Chronomètre et suivi en temps réel

📊 **Suivi & Stats (Premium) :**
• Dashboard avec graphiques de progression
• Heatmap d'activité
• Badges et Leaderboard

🤝 **Communauté :**
• Matching de partenaires sportifs
• Chat avec tes buddies d'entraînement

💰 **Tarifs :**
• Version gratuite : Exercices + calculateurs
• Premium : 3,99€/mois (7 jours gratuits)

Je suis ton assistant IA et je peux répondre à tes questions ! Qu'est-ce qui t'intéresse ? 😊`
  },

  // ========== DEMANDE HUMAIN ==========
  humanRequest: {
    keywords: ['humain', 'vraie personne', 'agent', 'conseiller', 'support', 'aide', 'parler a quelqu', 'vrai humain', 'pas un robot', 'pas un bot'],
    response: `🤝 Je comprends que tu souhaites parler à un humain !

Si tu as besoin d'une aide personnalisée, je peux te mettre en contact avec notre équipe support.

💡 **Avant de continuer**, je peux peut-être t'aider avec :
• Questions sur l'app et ses fonctionnalités
• Conseils d'entraînement généraux
• Problèmes techniques courants
• Gestion de ton abonnement

📞 **Veux-tu parler à un conseiller ?**
Réponds "parler à un agent" et je transmets ta demande à notre équipe !

En attendant, n'hésite pas à me poser ta question, je fais de mon mieux pour t'aider ! 😊`
  }
};

/**
 * Reponse par defaut quand aucun mot-cle n'est detecte
 */
const DEFAULT_RESPONSE = `🤔 Je ne suis pas sûr de comprendre ta demande.

Voici ce que je peux t'aider à faire :

**🏋️ Fitness & Entraînement**
• "Comment muscler mes pectoraux ?"
• "C'est quoi le HIIT ?"
• "Programme débutant"

**📱 Fonctionnalités Harmonith**
• "Comment fonctionne le matching ?"
• "C'est quoi le Premium ?"
• "Comment voir mes stats ?"

**🛠️ Support Technique**
• "Comment changer mon email ?"
• "J'ai oublié mon mot de passe"
• "L'app ne fonctionne pas"

**💬 Besoin d'aide humaine ?**
Dis "parler à un agent" et je te mets en contact avec notre équipe !

Reformule ta question et je ferai de mon mieux pour t'aider ! 😊`;

/**
 * Normaliser le texte pour la detection (enlever accents, minuscules)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Verifier si le message contient un ou plusieurs mots-cles
 */
function containsAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

/**
 * Trouver la reponse appropriee basee sur le message utilisateur
 * @param {string} userMessage - Message de l'utilisateur
 * @returns {string} - Reponse appropriee ou reponse par defaut
 */
function findFallbackResponse(userMessage) {
  for (const category of Object.values(FALLBACK_RESPONSES)) {
    if (containsAny(userMessage, category.keywords)) {
      return category.response;
    }
  }
  return DEFAULT_RESPONSE;
}

module.exports = {
  FALLBACK_RESPONSES,
  DEFAULT_RESPONSE,
  normalizeText,
  containsAny,
  findFallbackResponse
};
