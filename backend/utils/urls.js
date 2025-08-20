// backend/utils/urls.js

function buildBaseUrl(req) {
  const fromEnv = process.env.FRONTEND_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function buildFrontBaseUrl(req) {
  const fromEnv = process.env.FRONTEND_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:5173';
}

module.exports = { buildBaseUrl, buildFrontBaseUrl };