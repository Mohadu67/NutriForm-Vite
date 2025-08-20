const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ message: 'Token manquant ❌' });

    const user = await User.findOne({ verificationToken: token }).select('+verificationToken +verificationExpires');
    if (!user) return res.status(400).json({ message: 'Token invalide ❌' });

    if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {

        if (!user.emailVerifie) {
        await User.deleteOne({ _id: user._id });
      }
      return res.status(410).json({ message: 'Token expiré ❌' });
    }

    user.emailVerifie = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    return res.json({ message: 'Email vérifié. Tu peux te connecter ✅' });
  } catch (err) {
    console.error('VERIFY_ERROR', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

let cleanerStarted = false;
function startCleanerOnce() {
  if (cleanerStarted) return;
  cleanerStarted = true;
  setInterval(async () => {
    try {
      const now = new Date();
      const res = await User.deleteMany({ emailVerifie: false, verificationExpires: { $lt: now } });
      if (res?.deletedCount) {
        console.log(`[verify.cleaner] Comptes non vérifiés supprimés: ${res.deletedCount}`);
      }
    } catch (e) {
      console.error('[verify.cleaner] erreur:', e);
    }
  }, 60 * 60 * 1000);
}
startCleanerOnce();

module.exports = router;