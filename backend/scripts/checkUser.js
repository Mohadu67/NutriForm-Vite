const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2] || 'hamiani.mohammed@hotmail.com';

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log('📋 User Info:');
    console.log('Email:', user.email);
    console.log('Pseudo:', user.pseudo);
    console.log('Role:', user.role);
    console.log('\n📦 Subscription:');
    console.log(JSON.stringify(user.subscription, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
