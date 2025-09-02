const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}
const cookieParser = require('cookie-parser');
const config = require('./config');
const { frontUrl } = config;
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.route.js');
const verifyRoutes = require('./routes/verify.route.js');
const passwordResetRoutes = require('./routes/passwordReset.route.js');
const contactRoutes = require('./routes/contact.route.js');
const historyRoutes = require('./routes/history.route.js');
const workoutSessionRoutes = require('./routes/workoutSession.route.js');

const app = express();
if (!config.mongoUri) {
  console.error("❌ MONGO_URI manquant dans la configuration.");
  process.exit(1);
}

mongoose
  .connect(config.mongoUri, {
    dbName: 'nutriform',
    authSource: 'admin',
  })
  .then(() => console.log('🟢 Connecté à MongoDB'))
  .catch(err => {
    console.error('Erreur MongoDB :', err.message || err);
    process.exit(1);
  });

app.use(cors({
  origin: frontUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', verifyRoutes);
app.use('/api', authRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api', contactRoutes);
app.use('/api/history', historyRoutes);
app.use('/api', workoutSessionRoutes);

app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de NutriForm 🚀');
});

app.listen(config.port, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${config.port}`);
});
