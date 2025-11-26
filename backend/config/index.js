const logger = require('../utils/logger.js');
function bool(v, def = false) {
  if (v == null) return def;
  const s = String(v).toLowerCase().trim();
  return ["1", "true", "yes", "on"].includes(s);
}

const rawFrontUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const frontUrl = rawFrontUrl.endsWith("/") ? rawFrontUrl.slice(0, -1) : rawFrontUrl;

const allowedOriginsList = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [frontUrl];

const allowedOrigins = (origin, callback) => {

  if (!origin) return callback(null, true);


  if (allowedOriginsList.includes(origin)) {
    logger.info('[CORS] ✅ Origin autorisée (liste):', origin);
    return callback(null, true);
  }


  const allowedNetlifySubdomains = [
    'harmonith.netlify.app',
    'harmonith-preview.netlify.app',
    'nutriform-vite.netlify.app'
  ];

  try {
    const url = new URL(origin);
    if (allowedNetlifySubdomains.includes(url.hostname)) {
      logger.info('[CORS] ✅ Origin autorisée (Netlify):', origin);
      return callback(null, true);
    }
  } catch (err) {
    logger.info('[CORS] ❌ URL invalide:', origin);
    return callback(new Error('Non autorisé par CORS'));
  }


  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    logger.info('[CORS] ✅ Origin autorisée (localhost):', origin);
    return callback(null, true);
  }


  logger.info('[CORS] ❌ Origin REFUSÉE:', origin);
  callback(new Error('Non autorisé par CORS'));
};

module.exports = {
  env: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/nutriform",
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'secret') {
      logger.error('❌ FATAL: JWT_SECRET manquant ou invalide');
      process.exit(1);
    }
    if (secret.length < 32) {
      logger.error('❌ JWT_SECRET trop court (min 32 caractères)');
      process.exit(1);
    }
    return secret;
  })(),
  frontUrl,
  allowedOrigins,
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: bool(process.env.SMTP_SECURE, process.env.NODE_ENV === "production"),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.CONTACT_EMAIL || process.env.SMTP_USER || "no-reply@harmonith.fr",
  },
};