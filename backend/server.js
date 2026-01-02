const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger.js');

// Chargement des variables d'environnement selon NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = nodeEnv === 'production'
  ? ['.env.production', '.env.prod', '.env']
  : ['.env.local', '.env.development', '.env'];

let envLoaded = false;
for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
    logger.info(`📁 Chargement de ${envFile} (NODE_ENV=${nodeEnv})`);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  logger.warn('⚠️ Aucun fichier .env trouvé');
}
logger.info('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ NON DÉFINI');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { allowedOrigins } = config;
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth.route.js');
const verifyRoutes = require('./routes/verify.route.js');
const passwordResetRoutes = require('./routes/passwordReset.route.js');
const contactRoutes = require('./routes/contact.route.js');
const historyRoutes = require('./routes/history.route.js');
const workoutSessionRoutes = require('./routes/workoutSession.route.js');
const programRoutes = require('./routes/program.route.js');
const newsletterRoutes = require('./routes/newsletter.route.js');
const newsletterAdminRoutes = require('./routes/newsletter-admin.route.js');
const reviewsRoutes = require('./routes/reviews.js');
const uploadRoutes = require('./routes/upload.js');
const leaderboardRoutes = require('./routes/leaderboard.route.js');
const subscriptionRoutes = require('./routes/subscription.route.js');
const xpRedemptionRoutes = require('./routes/xpRedemption.route.js');
const chatRoutes = require('./routes/chat.route.js');
const supportTicketRoutes = require('./routes/supportTicket.route.js');
const profileRoutes = require('./routes/profile.route.js');
const matchingRoutes = require('./routes/matching.route.js');
const matchChatRoutes = require('./routes/matchChat.route.js');
const chatUploadRoutes = require('./routes/chatUpload.js');
const pushNotificationRoutes = require('./routes/pushNotification.route.js');
const recipeRoutes = require('./routes/recipe.route.js');
const notificationRoutes = require('./routes/notification.route.js');
const challengeRoutes = require('./routes/challenge.route.js');
const badgeRoutes = require('./routes/badge.route.js');
const linkPreviewRoutes = require('./routes/linkPreview.route.js');
const rateLimitRoutes = require('./routes/rateLimit.route.js');
const partnerRoutes = require('./routes/partner.route.js');
const analyticsRoutes = require('./routes/analytics.route.js');
const exerciseRoutes = require('./routes/exercises.js');
const { startNewsletterCron } = require('./cron/newsletterCron');
const { startLeaderboardCron } = require('./cron/leaderboardCron');
const { startChallengeCron } = require('./cron/challengeCron');
const { startDailyNotificationCron } = require('./cron/dailyNotificationCron');
const { startXpPremiumCron } = require('./cron/xpPremiumCron');
const { startContentCreationCron } = require('./cron/contentCreationCron');

const app = express();
const httpServer = http.createServer(app);

// Configuration Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Rendre io accessible dans toute l'app
app.set('io', io);

// ⚠️ IMPORTANT: Trust proxy pour Render (1 seul proxy en amont)
app.set('trust proxy', 1);

if (!config.mongoUri) {
  logger.error("❌ MONGO_URI manquant dans la configuration.");
  process.exit(1);
}

// Connexion MongoDB en arrière-plan (non bloquante)
logger.info('🔄 Tentative de connexion à MongoDB...');
logger.info('📍 URI:', config.mongoUri.replace(/\/\/.*@/, '//*****@')); // Masquer le mot de passe

mongoose
  .connect(config.mongoUri, {
    authSource: 'admin',
    serverSelectionTimeoutMS: 10000, // Timeout après 10 secondes
    socketTimeoutMS: 45000,
  })
  .then(() => logger.info('🟢 Connecté à MongoDB'))
  .catch(err => {
    logger.error('❌ Erreur MongoDB :', err.message || err);
    logger.error('💡 Vérifiez que MongoDB est accessible et que vos identifiants sont corrects');
    logger.error('⚠️  Le serveur continue de tourner mais certaines fonctionnalités ne seront pas disponibles');
  });


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://pagead2.googlesyndication.com", "https://*.googlesyndication.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://res.cloudinary.com",
        "https://images.unsplash.com",
        "https://jow.fr",
        "https://cdn.aistoucuisine.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.harmonith.fr",
        "https://res.cloudinary.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://region1.google-analytics.com",
        "https://*.clarity.ms",
        "https://pagead2.googlesyndication.com",
        "https://*.adtrafficquality.google",
        "https://cdn.jsdelivr.net",
        "https://*.google.com"
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 2000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Si c'est une requête API, renvoyer du JSON
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
      });
    }
    // Sinon, renvoyer la page HTML fun
    res.status(429).sendFile(path.join(__dirname, 'public', 'rate-limit.html'));
  },
  skip: (req) => {
    // Whitelist pour les tests de charge (comparaison stricte d'IP)
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',').map(ip => ip.trim()) || [];
    const clientIP = req.ip || req.connection.remoteAddress;
    // Normaliser l'IP (enlever le préfixe ::ffff: pour IPv4 mappées en IPv6)
    const normalizedIP = clientIP?.replace(/^::ffff:/, '');
    if (normalizedIP && whitelistedIPs.includes(normalizedIP)) {
      return true;
    }

    const publicRoutes = ['/api/health', '/uploads', '/api/subscriptions/webhook', '/api/rate-limit'];
    return publicRoutes.some(route => req.path.startsWith(route));
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Compression gzip pour réduire la taille des réponses (gain ~60-80%)
app.use(compression({
  level: 6, // Bon compromis vitesse/compression
  threshold: 1024, // Compresser seulement si > 1KB
  filter: (req, res) => {
    // Ne pas compresser les SSE ou WebSocket upgrades
    if (req.headers['accept'] === 'text/event-stream') return false;
    return compression.filter(req, res);
  }
}));

// ⚠️ IMPORTANT: Webhook Stripe AVANT express.json() pour recevoir raw body
app.post('/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/subscription.controller').handleWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(globalLimiter);

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../frontend/public/uploads')));


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', verifyRoutes);
app.use('/api', authRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api', contactRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/workouts', workoutSessionRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/newsletter-admin', newsletterAdminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/xp-redemption', xpRedemptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin/support-tickets', supportTicketRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/match-chat', matchChatRoutes);
app.use('/api/chat-upload', chatUploadRoutes);
app.use('/api/push', pushNotificationRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/link-preview', linkPreviewRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exercises', exerciseRoutes);

// Servir les fichiers statiques du frontend (en production)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  logger.info('📦 Serveur de fichiers statiques activé');

  // Assets statiques (JS, CSS, images, etc.)
  app.use(express.static(frontendDistPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      // Cache agressif pour les assets avec hash
      if (filepath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // SSR désactivé temporairement - causait des conflits React (double instance)
  // Servir index.html pour toutes les routes frontend (mode SPA)
  app.use((req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

} else {
  logger.warn('⚠️  Build frontend non trouvé, serveur API uniquement');
  app.get('/', (_req, res) => {
    res.send('Bienvenue sur le backend de NutriForm 🚀');
  });
}

// Configuration Socket.io pour la messagerie temps réel
require('./socket/messageSocket')(io);

// Démarrer le serveur seulement si pas en mode test
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(config.port, () => {
    logger.info(`🚀 Serveur HTTP en ligne sur http://localhost:${config.port}`);
    logger.info(`🔌 WebSocket activé sur le même port`);
    logger.info(`📋 Environnement: ${config.env}`);
    logger.info(`🌐 Frontend URL: ${config.frontUrl}`);

    // Démarrer les crons uniquement si MongoDB est connecté
    if (mongoose.connection.readyState === 1) {
      logger.info('⏰ Démarrage des tâches planifiées...');
      startNewsletterCron();
      startLeaderboardCron();
      startChallengeCron();
      startDailyNotificationCron();
      startXpPremiumCron();
      startContentCreationCron();
    } else {
      logger.warn('⚠️  Tâches planifiées désactivées - MongoDB non connecté');
      // Réessayer après connexion
      mongoose.connection.once('open', () => {
        logger.info('⏰ Démarrage des tâches planifiées (après connexion MongoDB)...');
        startNewsletterCron();
        startLeaderboardCron();
        startChallengeCron();
        startDailyNotificationCron();
        startXpPremiumCron();
        startContentCreationCron();
      });
    }
  });
}

// Exporter l'app pour les tests
module.exports = app;
