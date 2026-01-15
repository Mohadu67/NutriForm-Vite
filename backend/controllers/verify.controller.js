const User = require('../models/User');
const logger = require('../utils/logger.js');

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'https://harmonith.fr';

async function verifyEmail(req, res) {
  try {
    const { token } = req.query || {};
    if (!token) {
      return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=token_missing`);
    }

    const user = await User.findOne({ verificationToken: token })
      .select('+verificationToken +verificationExpires +emailVerifie');

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=token_invalid`);
    }

    if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {
      if (!user.emailVerifie) await User.deleteOne({ _id: user._id });
      return res.redirect(`${FRONTEND_URL}/email-verified?status=error&message=token_expired`);
    }

    user.emailVerifie = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    logger.info(`[VERIFY] Email verified for user: ${user.email}`);

    // Rediriger vers page frontend qui détecte mobile et ouvre l'app
    return res.redirect(`${FRONTEND_URL}/email-verified?status=success`);
  } catch (err) {
    logger.error('VERIFY_ERROR', err);
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
