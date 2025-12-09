const fs = require('fs');
const logger = require('./utils/logger.js');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  logger.info('📁 Chargement de .env.local');
} else {
  require('dotenv').config();
  logger.info('📁 Chargement de .env');
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
const chatRoutes = require('./routes/chat.route.js');
const supportTicketRoutes = require('./routes/supportTicket.route.js');
const profileRoutes = require('./routes/profile.route.js');
const matchingRoutes = require('./routes/matching.route.js');
const matchChatRoutes = require('./routes/matchChat.route.js');
const pushNotificationRoutes = require('./routes/pushNotification.route.js');
const recipeRoutes = require('./routes/recipe.route.js');
const { startNewsletterCron } = require('./cron/newsletterCron');
const { startLeaderboardCron } = require('./cron/leaderboardCron');

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
    dbName: 'nutriform',
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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 2000 : 5000, 
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {

    const publicRoutes = ['/api/health', '/uploads', '/api/subscriptions/webhook'];
    return publicRoutes.some(route => req.path.startsWith(route));
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
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


const path = require('path');
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
app.use('/api/chat', chatRoutes);
app.use('/api/admin/support-tickets', supportTicketRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/match-chat', matchChatRoutes);
app.use('/api/push', pushNotificationRoutes);
app.use('/api/recipes', recipeRoutes);

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
    } else {
      logger.warn('⚠️  Tâches planifiées désactivées - MongoDB non connecté');
      // Réessayer après connexion
      mongoose.connection.once('open', () => {
        logger.info('⏰ Démarrage des tâches planifiées (après connexion MongoDB)...');
        startNewsletterCron();
        startLeaderboardCron();
      });
    }
  });
}

// Exporter l'app pour les tests
module.exports = app;
