require('dotenv').config();

const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const User = require('./models/User');
const History = require('./models/History');
const authRouter = require('./models/createUser');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;


const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';


const resetTokens = new Map();

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token manquant.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
}

console.log("🔍 URI MongoDB :", process.env.MONGODB_URI);
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI est manquant dans les variables d\'environnement. Le serveur va s\'arrêter proprement.');
  process.exit(1);
}


mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('🟢 Connecté à MongoDB'))
.catch(err => console.error('Erreur MongoDB :', err));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));


app.post('/api/history', auth, async (req, res) => {
  try {
    const { type, value, poids, taille, categorie, date } = req.body || {};

    if (!['imc', 'calories'].includes(type)) {
      return res.status(400).json({ message: 'type invalide (imc|calories)' });
    }

    const num = Number(value);
    if (!Number.isFinite(num)) {
      return res.status(400).json({ message: 'value doit être un nombre' });
    }

    const when = date ? new Date(date) : new Date();

    const item = await History.create({
      userId: req.userId,
      type,
      value: num,
      poids,
      taille,
      categorie,
      date: when,
    });

    console.log('📥 History saved', { userId: req.userId, type, value: num, poids, taille, categorie, at: when.toISOString() });

    return res.status(201).json({ message: 'Historique enregistré ✅', itemId: item._id });
  } catch (err) {
    console.error('POST /api/history error', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

app.get('/api/history', auth, async (req, res) => {
  try {
    const list = await History.find({ userId: req.userId }).sort({ date: 1 }).lean();
    console.log('📤 History returned', { userId: req.userId, count: list.length });
    return res.json({ history: list });
  } catch (err) {
    console.error('GET /api/history error', err);
    return res.status(500).json({ message: 'Erreur serveur ❌' });
  }
});

app.use('/api', authRouter);

app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de NutriForm 🚀');
});

app.get(['/reset-password.html', '/reset-password'], (req, res) => {
  const token = req.query.token;
  const frontBase = (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const redirectUrl = `${frontBase}/reset-password${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  console.log('🔀 Redirection reset-password ->', redirectUrl);
  res.redirect(302, redirectUrl);
});

app.post('/login', async (req, res) => {
  const { email, motdepasse } = req.body;
  
  try {
    const user = await User.findOne({ email }).select('+motdepasse emailVerifie');
    console.log("✅ Utilisateur trouvé :", user);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (!user.emailVerifie) {
      return res.status(403).json({ message: 'Email non vérifié. Vérifie ta boîte mail.' });
    }

    const passwordMatch = await user.verifierMotdepasse(motdepasse);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Connexion réussie.', token, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

async function getTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
}

app.post('/forgot-password', async (req, res) => {
  const { email, subject, text, html } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email requis.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Aucun utilisateur avec cet email.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1h

    resetTokens.set(token, { userId: user._id, expires });

    const frontBase = buildFrontBaseUrl(req);
    const resetLink = `${frontBase}/reset-password?token=${encodeURIComponent(token)}`;
    console.log('🔁 Lien de réinitialisation généré (FRONT):', resetLink);

    const subjectText = subject || 'Réinitialisation du mot de passe';
    const textBody = text || 'Cliquez ici pour réinitialiser votre mot de passe: ' + resetLink;
    const htmlBody = html || '<p>Cliquez ici pour réinitialiser votre mot de passe: <a href="' + resetLink + '">' + resetLink + '</a></p>';

    const mailOptions = {
      from: `"NutriForm" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subjectText,
      text: textBody,
      html: htmlBody
    };

    try {
      const transporter = await getTransport();
      const info = await transporter.sendMail(mailOptions);
      const preview = nodemailer.getTestMessageUrl(info);
      return res.json({ message: 'Email de réinitialisation envoyé.', previewUrl: preview || null, resetLink });
    } catch (sendErr) {
      console.error(sendErr);
      return res.status(500).json({ message: 'Erreur envoi email.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!resetTokens.has(token)) {
    return res.status(400).json({ message: 'Token invalide ou expiré.' });
  }

  const data = resetTokens.get(token);
  if (Date.now() > data.expires) {
    resetTokens.delete(token);
    return res.status(400).json({ message: 'Token expiré.' });
  }

  try {
    const user = await User.findById(data.userId);
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé.' });

    user.motdepasse = newPassword;
    await user.save();

    resetTokens.delete(token);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});


app.post('/api/contact', async (req, res) => {
  const { nom, email, sujet, message } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const nomSafe = String(nom).trim();
  const emailSafe = String(email).trim();
  const sujetSafe = sujet ? String(sujet).trim() : '';
  const messageSafe = String(message).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailSafe)) {
    return res.status(400).json({ message: 'Email invalide.' });
  }

  try {
    const transporter = await getTransport();

    const subjectText = sujetSafe
      ? `📩 Nouveau message de ${nomSafe} - Sujet: ${sujetSafe}`
      : `📩 Nouveau message de ${nomSafe}`;

    const fromAddress = process.env.EMAIL_USER || process.env.CONTACT_EMAIL || 'no-reply@nutriform.app';
    const toAddress = process.env.CONTACT_EMAIL || process.env.EMAIL_USER || fromAddress;

    const mailOptions = {
      from: `"NutriForm Contact" <${fromAddress}>`,
      to: toAddress,
      replyTo: emailSafe,
      subject: subjectText,
      text:
        `Nom: ${nomSafe}\nEmail: ${emailSafe}` +
        (sujetSafe ? `\nSujet: ${sujetSafe}` : '') +
        `\nMessage:\n${messageSafe}`,
      html:
        `<p><b>Nom:</b> ${nomSafe}</p>` +
        `<p><b>Email:</b> ${emailSafe}</p>` +
        (sujetSafe ? `<p><b>Sujet:</b> ${sujetSafe}</p>` : '') +
        `<p><b>Message:</b><br/>${messageSafe.replace(/\n/g, '<br/>')}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = (require('nodemailer').getTestMessageUrl && require('nodemailer').getTestMessageUrl(info)) || null;

    res.status(200).json({ message: 'Message envoyé avec succès ✅', previewUrl });
  } catch (error) {
    console.error('Erreur envoi formulaire contact:', error);
    res.status(500).json({ message: 'Erreur lors de l’envoi du message ❌' });
  }
});

app.listen(port, () => {
  console.log(`Serveur en ligne sur http://localhost:${port}`);
});
