const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const mongoose = require('mongoose');
const HIITProgram = require('../models/HIITProgram');
const config = require('../config');

async function test() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connecté');

    console.log('\n1. Test find({})');
    const all = await HIITProgram.find({});
    console.log('  Résultat:', all.length, 'programmes');

    console.log('\n2. Test find({ isActive: true })');
    const active = await HIITProgram.find({ isActive: true });
    console.log('  Résultat:', active.length, 'programmes');

    console.log('\n3. Premier programme:');
    if (all.length > 0) {
      console.log('  isActive:', all[0].isActive);
      console.log('  Type de isActive:', typeof all[0].isActive);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

test();
