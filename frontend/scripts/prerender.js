import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../src/shared/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes à prérendrer avec leurs métadonnées
const routes = [
  {
    path: '/imc',
    title: 'Calculateur IMC Gratuit - Harmonith | Indice de Masse Corporelle',
    description: 'Calculateur IMC (Indice de Masse Corporelle) gratuit et fiable. Évaluez votre corpulence en quelques secondes et recevez des conseils personnalisés selon votre catégorie.',
    ogTitle: 'Calculateur IMC Gratuit - Harmonith',
    ogDescription: 'Calculez votre IMC gratuitement et découvrez si votre poids est adapté à votre taille avec des conseils personnalisés.',
  },
  {
    path: '/calorie',
    title: 'Calculateur de Calories Gratuit - Harmonith | Besoins Caloriques Personnalisés',
    description: 'Calculateur de calories gratuit et précis basé sur la formule Mifflin-St Jeor. Découvrez vos besoins caloriques quotidiens selon votre objectif : perte de poids, maintien ou prise de masse.',
    ogTitle: 'Calculateur de Calories Gratuit - Harmonith',
    ogDescription: 'Calculez vos besoins caloriques quotidiens gratuitement avec notre outil basé sur des formules scientifiques validées.',
  },
  {
    path: '/exo',
    title: '300+ Exercices de Musculation et Fitness - Harmonith | Programme Personnalisé',
    description: 'Plus de 300 exercices de musculation, cardio, yoga et étirements. Créez vos séances d\'entraînement personnalisées et suivez votre progression avec Harmonith.',
    ogTitle: '300+ Exercices de Musculation et Fitness - Harmonith',
    ogDescription: 'Base complète d\'exercices couvrant tous les groupes musculaires. Créez votre programme d\'entraînement personnalisé gratuitement.',
  },
  {
    path: '/outils',
    title: 'Outils de Calcul Fitness Gratuits - Harmonith | IMC, Calories, 1RM',
    description: 'Calculateurs fitness gratuits : IMC, besoins caloriques (Mifflin-St Jeor) et 1RM (7 formules scientifiques). Outils précis pour optimiser votre entraînement.',
    ogTitle: 'Outils de Calcul Fitness Gratuits - Harmonith',
    ogDescription: 'Suite complète de calculateurs fitness gratuits pour optimiser votre entraînement et votre nutrition.',
  },
  {
    path: '/about',
    title: 'À propos - Harmonith | Notre mission et notre équipe',
    description: 'Découvrez Harmonith, l\'application fitness française qui accompagne tous les niveaux. Outils de calcul précis, programmes personnalisés et suivi de progression pour atteindre vos objectifs.',
    ogTitle: 'À propos - Harmonith',
    ogDescription: 'Application fitness 100% gratuite avec outils scientifiques de qualité pour tous les niveaux. Découvrez notre mission et nos principes.',
  },
  {
    path: '/contact',
    title: 'Contact - Harmonith | Questions et Support',
    description: 'Contactez l\'équipe Harmonith pour toute question sur nos outils fitness. FAQ complète et formulaire de contact disponibles.',
    ogTitle: 'Contact - Harmonith',
    ogDescription: 'Questions sur Harmonith ? Consultez notre FAQ ou contactez-nous directement.',
  },
];

const distPath = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distPath, 'index.html');

// Lire le fichier index.html de base
const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Fonction pour injecter les métadonnées dans le HTML
function injectMetadata(html, route) {
  let modifiedHtml = html;

  // Remplacer le titre
  modifiedHtml = modifiedHtml.replace(
    /<title>.*?<\/title>/,
    `<title>${route.title}</title>`
  );

  // Remplacer la description
  modifiedHtml = modifiedHtml.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${route.description}">`
  );

  // Remplacer og:title
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${route.ogTitle}">`
  );

  // Remplacer og:description
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${route.ogDescription}">`
  );

  // Remplacer og:url
  modifiedHtml = modifiedHtml.replace(
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="https://harmonith.fr${route.path}">`
  );

  // Remplacer twitter:url
  modifiedHtml = modifiedHtml.replace(
    /<meta name="twitter:url" content=".*?">/,
    `<meta name="twitter:url" content="https://harmonith.fr${route.path}">`
  );

  return modifiedHtml;
}

// Créer les répertoires et fichiers pour chaque route
routes.forEach((route) => {
  const routePath = path.join(distPath, route.path);

  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
  }

  // Générer le HTML avec les métadonnées injectées
  const htmlWithMetadata = injectMetadata(baseHtml, route);

  // Écrire le fichier index.html dans le répertoire de la route
  fs.writeFileSync(path.join(routePath, 'index.html'), htmlWithMetadata);

  logger.info(`✓ Prérendu: ${route.path}`);
});

logger.info('\n✅ Prerendering terminé avec succès!');
