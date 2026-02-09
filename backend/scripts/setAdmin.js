const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const User = require('../models/User');
    
    // Remplace par ton email
    const email = process.argv[2];
    if (!email) {
      console.error('❌ Usage: node set-admin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error('❌ Utilisateur non trouvé:', email);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log('✅ Rôle admin assigné à:', user.email);
    console.log('   Nom:', user.prenom || user.pseudo);
    console.log('   Role:', user.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

setAdmin();
