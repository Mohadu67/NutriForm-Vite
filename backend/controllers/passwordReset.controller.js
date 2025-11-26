

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendResetEmail } = require('../services/mailer.service');
const { buildFrontBaseUrl } = require('../utils/urls');
const { validatePassword } = require('../utils/passwordValidator');
const logger = require('../utils/logger.js');

exports.requestPasswordReset = async (req, res) => {
  logger.info('[requestPasswordReset] START');
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }
  try {
    const emailNorm = String(email).trim().toLowerCase();
    logger.info('[requestPasswordReset] Looking for user:', emailNorm);
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      logger.info('[requestPasswordReset] User not found');
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; 

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();
    logger.info('[requestPasswordReset] Token saved');

    const front = buildFrontBaseUrl();
    logger.info('[requestPasswordReset] Frontend URL:', front);
    const resetUrl = `${front}/reset-password?token=${encodeURIComponent(token)}`;

    logger.info('[requestPasswordReset] Sending email to:', user.email);
    await sendResetEmail({
      to: user.email,
      toName: user.prenom || user.pseudo || user.email,
      resetUrl,
    });
    logger.info('[requestPasswordReset] Email sent successfully');

    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('[forgotPassword] error:', err);
    logger.error('[forgotPassword] error stack:', err.stack);
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

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
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
