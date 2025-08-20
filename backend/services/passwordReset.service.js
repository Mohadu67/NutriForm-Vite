const crypto = require('crypto');

function createResetToken(store, userId, ttlMs = 3600000) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + ttlMs;
  store.set(token, { userId, expires });
  return { token, expires };
}

function buildResetLink(frontBaseUrl, token) {
  const base = (frontBaseUrl || '').replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

async function requestResetLink({ email, User, frontBaseUrl, store }) {
  const user = await User.findOne({ email });
  if (!user) return { error: 'Aucun utilisateur avec cet email.' };
  const { token, expires } = createResetToken(store, user._id);
  return {
    resetLink: buildResetLink(frontBaseUrl, token),
    expiresAt: new Date(expires).toISOString(),
    userId: user._id.toString(),
    token,
  };
}

function validateToken(store, token) {
  if (!token) return { valid: false, reason: 'Token manquant.' };
  const data = store.get(token);
  if (!data) return { valid: false, reason: 'Token invalide ou expiré.' };
  if (Date.now() > data.expires) {
    store.delete(token);
    return { valid: false, reason: 'Token expiré.' };
  }
  return { valid: true, userId: data.userId, expiresAt: new Date(data.expires).toISOString() };
}

async function applyNewPassword({ token, newPassword, store, User }) {
  const check = validateToken(store, token);
  if (!check.valid) return { valid: false, reason: check.reason };
  const user = await User.findById(check.userId);
  if (!user) return { valid: false, reason: 'Utilisateur non trouvé.' };

  user.motdepasse = newPassword;
  await user.save();
  store.delete(token);
  return { valid: true };
}

module.exports = {
  createResetToken,
  buildResetLink,
  requestResetLink,
  validateToken,
  applyNewPassword,
};