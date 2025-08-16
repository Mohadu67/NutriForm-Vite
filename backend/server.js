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
// Stockage temporaire tokens reset (id utilisateur + token + expiration)
// Déclaré avant les routes pour éviter toute référence avant initialisation
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

// Connexion MongoDB
console.log("🔍 URI MongoDB :", process.env.MONGODB_URI);
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI est manquant dans les variables d\'environnement. Le serveur va s\'arrêter proprement.');
  process.exit(1);
}


mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('🟢 Connecté à MongoDB'))
.catch(err => console.error('Erreur MongoDB :', err));

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes API (inscription + vérification email)

// Healthcheck pour vérification rapide
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// =========================
// Historique IMC & Calories
// =========================

// Enregistrer une entrée d'historique (IMC ou Calories)
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

// Récupérer l'historique pour l'utilisateur connecté (trié par date croissante)
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

// Test simple
app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de NutriForm 🚀');
});

// Page de réinitialisation de mot de passe (HTML minimal servi par le backend)
app.get(['/reset-password.html', '/reset-password'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  console.log('🧩 reset-password page served for', req.originalUrl);
  res.end(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Réinitialiser le mot de passe</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:520px;margin:auto;background:#f7f6f2;color:#111}
    label{display:block;margin:.75rem 0 .25rem}
    input{width:100%;padding:.6rem;border:1px solid #ccc;border-radius:8px}
    button{margin-top:1rem;padding:.6rem 1rem;border:0;border-radius:8px;cursor:pointer;background:#FFB385}
    .error{color:#b00020;margin-top:.5rem}
    .ok{color:#0a7a3b;margin-top:.5rem}
  </style>
</head>
<body>
  <h1>Réinitialiser le mot de passe</h1>
  <p id="status"></p>
  <form id="form">
    <label for="pwd">Nouveau mot de passe</label>
    <input id="pwd" type="password" minlength="8" required />
    <label for="pwd2">Confirmer le mot de passe</label>
    <input id="pwd2" type="password" minlength="8" required />
    <button type="submit">Valider</button>
    <div id="msg" class="error" hidden></div>
  </form>
  <script>
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const form = document.getElementById('form');
    const msg = document.getElementById('msg');
    const status = document.getElementById('status');
    if (!token) {
      status.textContent = 'Lien invalide: token manquant.';
      form.remove();
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = true;
      const p1 = document.getElementById('pwd').value.trim();
      const p2 = document.getElementById('pwd2').value.trim();
      if (p1.length < 8) { msg.textContent = '8 caractères minimum.'; msg.hidden = false; return; }
      if (p1 !== p2) { msg.textContent = 'Les mots de passe ne correspondent pas.'; msg.hidden = false; return; }
      try {
        const res = await fetch('/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: p1 })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Erreur serveur');
        status.className = 'ok';
        status.textContent = 'Mot de passe réinitialisé. Vous pouvez fermer cette page et vous connecter.';
        form.remove();
      } catch (err) {
        msg.textContent = err.message || 'Erreur serveur';
        msg.hidden = false;
      }
    });
  </script>
</body>
</html>`);
});

// Login
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

// Dans la partie haut de ton fichier server.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function buildBaseUrl(req) {
  const fromEnv = process.env.APP_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function buildFrontBaseUrl(req) {
  // Priorité aux variables d'environnement dédiées au FRONT
  const fromEnv = process.env.APP_BASE_URL_FRONT || process.env.FRONTEND_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Fallback dev: on suppose Vite en 5173
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

// Route mot de passe oublié
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Aucun utilisateur avec cet email.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1h

    resetTokens.set(token, { userId: user._id, expires });

    const frontBase = buildFrontBaseUrl(req);
    const resetLink = `${frontBase}/reset-password?token=${token}`;
    console.log('🔁 Lien de réinitialisation généré (FRONT):', resetLink);

    const mailOptions = {
      from: `"NutriForm" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation du mot de passe',
      text: `Cliquez ici pour réinitialiser votre mot de passe: ${resetLink}`,
      html: `<p>Cliquez ici pour réinitialiser votre mot de passe: <a href="${resetLink}">${resetLink}</a></p>`
    };

    try {
      const transporter = await getTransport();
      const info = await transporter.sendMail(mailOptions);
      const preview = nodemailer.getTestMessageUrl(info);
      return res.json({ message: 'Email de réinitialisation envoyé.', previewUrl: preview || null });
    } catch (sendErr) {
      console.error(sendErr);
      return res.status(500).json({ message: 'Erreur envoi email.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Route reset password
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

    user.motdepasse = newPassword; // sera hashé par le hook du modèle
    await user.save();

    resetTokens.delete(token);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});



// =========================
// Formulaire de contact
// =========================
app.post('/api/contact', async (req, res) => {
  const { nom, email, sujet, message } = req.body;

  if (!nom || !email || !message) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const transporter = await getTransport();

    const subjectText = sujet && sujet.trim()
      ? `📩 Nouveau message de ${nom} - Sujet: ${sujet}`
      : `📩 Nouveau message de ${nom}`;

    const mailOptions = {
      from: `"NutriForm Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: subjectText,
      text:
        `Nom: ${nom}\nEmail: ${email}` +
        (sujet && sujet.trim() ? `\nSujet: ${sujet}` : '') +
        `\nMessage:\n${message}`,
      html:
        `<p><b>Nom:</b> ${nom}</p>` +
        `<p><b>Email:</b> ${email}</p>` +
        (sujet && sujet.trim() ? `<p><b>Sujet:</b> ${sujet}</p>` : '') +
        `<p><b>Message:</b><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Message envoyé avec succès ✅' });
  } catch (error) {
    console.error('Erreur envoi formulaire contact:', error);
    res.status(500).json({ message: 'Erreur lors de l’envoi du message ❌' });
  }
});

// Lancement du serveur
app.listen(port, () => {
  console.log(`Serveur en ligne sur http://localhost:${port}`);
});
