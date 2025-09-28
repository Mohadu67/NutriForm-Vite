

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendResetEmail } = require('../services/mailer.service');
const { buildFrontBaseUrl } = require('../utils/urls');

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }
  try {
    const emailNorm = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const front = buildFrontBaseUrl();
    const resetUrl = `${front}/reset-password?token=${encodeURIComponent(token)}`;

    await sendResetEmail({
      to: user.email,
      toName: user.prenom || user.pseudo || user.email,
      resetUrl,
    });

    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgotPassword] error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.verifyResetToken = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    return res.status(200).json({ message: 'Token is valid.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    if ('motdepasse' in user) {
      user.motdepasse = password;
    } else {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(200).json({ message: 'Password has been reset.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
