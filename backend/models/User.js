const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const imcSchema = new mongoose.Schema(
  {
    valeur: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const caloriesSchema = new mongoose.Schema(
  {
    valeur: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [EmailRegex, 'Email invalide']
    },
    motdepasse: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    prenom: { type: String, trim: true, maxlength: 60 },
    pseudo: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      sparse: true
    },
    imc: [imcSchema],
    calories: [caloriesSchema],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    emailVerifie: { type: Boolean, default: false },
    verificationToken: { type: String, default: null, select: false },
    verificationExpires: { type: Date, default: null, select: false },
    resetPasswordToken: { type: String, default: null, index: true, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);

// Validation du pseudo (optionnel) : a-z 0-9 . _ -
userSchema.path('pseudo').validate(function (v) {
  if (!v) return true;
  return /^[a-z0-9._-]+$/.test(v);
}, 'Pseudo invalide. Autorisé: a-z 0-9 . _ - (3-30 caractères)');

// Index pour accélérer les recherches de resetToken (non-TTL)
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('motdepasse')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.motdepasse = await bcrypt.hash(this.motdepasse, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.verifierMotdepasse = function (plain) {
  return bcrypt.compare(plain, this.motdepasse);
};

userSchema.methods.creerTokenVerificationEmail = function (ttlMinutes = 60) {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return token;
};

userSchema.methods.creerTokenResetPassword = function (ttlMinutes = 60) {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return token;
};

userSchema.methods.invaliderTokenResetPassword = function () {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

function hideSensitive(_, ret) {
  delete ret.motdepasse;
  delete ret.verificationToken;
  delete ret.verificationExpires;
  return ret;
}
userSchema.set('toJSON', { transform: hideSensitive });
userSchema.set('toObject', { transform: hideSensitive });

module.exports = mongoose.model('User', userSchema);
