const User = require('../models/User');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const logger = require('../utils/logger.js');

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'https://harmonith.fr';

async function verifyEmail(req, res) {
  const wantsJson = (req.headers.accept || '').includes('application/json') || req.xhr;

  try {
    const { token } = req.query || {};
    if (!token) {
      if (wantsJson) return res.status(400).json({ status: 'error', message: 'token_missing' });
      return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=token_missing`);
    }

    // Atomic update: avoids race condition when React StrictMode double-fires the effect
    const user = await User.findOneAndUpdate(
      { verificationToken: token, verificationExpires: { $gt: new Date() } },
      { $set: { emailVerifie: true, verificationToken: null, verificationExpires: null } },
      { new: true }
    );

    if (user) {
      logger.info(`[VERIFY] Email verified for user: ${user.email}`);

      // Auto-join leaderboard
      try {
        const existing = await LeaderboardEntry.findOne({ userId: user._id });
        if (!existing) {
          await LeaderboardEntry.create({
            userId: user._id,
            displayName: user.pseudo || user.prenom || 'Anonyme',
            avatarUrl: user.photo || null,
            visibility: 'public',
          });
          logger.info(`[VERIFY] Auto-joined leaderboard for user: ${user.email}`);
        }
      } catch (lbErr) {
        logger.error('[VERIFY] Failed to auto-join leaderboard:', lbErr);
      }
    } else {
      // Token not matched — check why
      const expiredUser = await User.findOne({ verificationToken: token }).select('+emailVerifie');
      if (expiredUser) {
        // Token exists but expired
        if (!expiredUser.emailVerifie) await User.deleteOne({ _id: expiredUser._id });
        if (wantsJson) return res.status(400).json({ status: 'error', message: 'token_expired' });
        return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=token_expired`);
      }
      // Token not found at all — already consumed (double-render) or invalid
      // Be lenient: treat as success since the most common case is a double-render
      logger.info(`[VERIFY] Token not found (likely already consumed), treating as success`);
    }

    if (wantsJson) return res.json({ status: 'success', message: 'Email vérifié avec succès.' });
    return res.redirect(`${FRONTEND_URL}/email-verified?status=success`);
  } catch (err) {
    logger.error('VERIFY_ERROR', err);
    if (wantsJson) return res.status(500).json({ status: 'error', message: 'server_error' });
    return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=server_error`);
  }
}

let cleanerStarted = false;
function startCleanerOnce() {
  if (cleanerStarted) return;
  cleanerStarted = true;
  setInterval(async () => {
    try {
      const now = new Date();
      const res = await User.deleteMany({ emailVerifie: false, verificationExpires: { $lt: now } });
      if (res?.deletedCount) logger.info(`[verify.cleaner] Comptes non vérifiés supprimés: ${res.deletedCount}`);
    } catch (e) {
      logger.error('[verify.cleaner] erreur:', e);
    }
  }, 60 * 60 * 1000);
}

module.exports = { verifyEmail, startCleanerOnce };
