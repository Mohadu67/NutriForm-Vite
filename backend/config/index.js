function bool(v, def = false) {
  if (v == null) return def;
  const s = String(v).toLowerCase().trim();
  return ["1", "true", "yes", "on"].includes(s);
}

const rawFrontUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const frontUrl = rawFrontUrl.endsWith("/") ? rawFrontUrl.slice(0, -1) : rawFrontUrl;

// Configuration des origines autorisées pour CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [frontUrl];

module.exports = {
  env: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/nutriform",
  jwtSecret: process.env.JWT_SECRET || "secret",
  frontUrl,
  allowedOrigins,
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: bool(process.env.SMTP_SECURE, process.env.NODE_ENV === "production"),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.CONTACT_EMAIL || process.env.SMTP_USER || "no-reply@nutriform.com",
  },
};