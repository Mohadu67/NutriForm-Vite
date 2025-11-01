const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('📁 Chargement de .env.local');
} else {
  require('dotenv').config();
  console.log('📁 Chargement de .env');
}
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ NON DÉFINI');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { allowedOrigins } = config;
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.route.js');
const verifyRoutes = require('./routes/verify.route.js');
const passwordResetRoutes = require('./routes/passwordReset.route.js');
const contactRoutes = require('./routes/contact.route.js');
const historyRoutes = require('./routes/history.route.js');
const workoutSessionRoutes = require('./routes/workoutSession.route.js');
const newsletterRoutes = require('./routes/newsletter.route.js');
const newsletterAdminRoutes = require('./routes/newsletter-admin.route.js');
const reviewsRoutes = require('./routes/reviews.js');
const uploadRoutes = require('./routes/upload.js');
const leaderboardRoutes = require('./routes/leaderboard.route.js');
const { startNewsletterCron } = require('./cron/newsletterCron');
const { startLeaderboardCron } = require('./cron/leaderboardCron');

const app = express();
if (!config.mongoUri) {
  console.error("❌ MONGO_URI manquant dans la configuration.");
  process.exit(1);
}

mongoose
  .connect(config.mongoUri, {
    dbName: 'nutriform',
    authSource: 'admin',
  })
  .then(() => console.info('🟢 Connecté à MongoDB'))
  .catch(err => {
    console.error('Erreur MongoDB :', err.message || err);
    process.exit(1);
  });


app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 2000 : 5000, 
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    
    const publicRoutes = ['/api/health', '/uploads'];
    return publicRoutes.some(route => req.path.startsWith(route));
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
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
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/newsletter-admin', newsletterAdminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de NutriForm 🚀');
});

app.listen(config.port, () => {
  console.info(`🚀 Serveur en ligne sur http://localhost:${config.port}`);


  startNewsletterCron();
  startLeaderboardCron();
});
