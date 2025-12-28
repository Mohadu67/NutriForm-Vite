const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function setPremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Récupérer votre email depuis les arguments de commande
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Usage: node scripts/setPremium.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Mettre à jour le subscription
    user.subscription = {
      tier: 'premium',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    };

    await user.save();

    console.log('✅ User updated successfully!');
    console.log({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: user.subscription,
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setPremium();
