require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.route.js');
const verifyRoutes = require('./routes/verify.route.js');
const passwordResetRoutes = require('./routes/passwordReset.route.js');
const contactRoutes = require('./routes/contact.route.js');
const historyRoutes = require('./routes/history.route.js');

const app = express();
const port = process.env.PORT || 3000;

console.log('🔍 URI MongoDB :', process.env.MONGODB_URI);
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI est manquant dans les variables d'environnement.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('🟢 Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB :', err));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes principales
app.use('/api', verifyRoutes);
app.use('/api', authRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api', contactRoutes);
app.use('/api', historyRoutes);

// Accueil
app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de NutriForm 🚀');
});

app.listen(port, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${port}`);
});
