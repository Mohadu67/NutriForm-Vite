const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const mongoose = require('mongoose');
const HIITProgram = require('../models/HIITProgram');
const config = require('../config');

async function checkHIIT() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connecté à MongoDB');

    const programs = await HIITProgram.find({});
    console.log(`\n📊 Nombre de programmes HIIT: ${programs.length}\n`);

    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   ID: ${program._id}`);
      console.log(`   Niveau: ${program.level}`);
      console.log(`   Durée: ${program.totalDuration} min`);
      console.log(`   Exercices: ${program.exercises.length}`);
      console.log(`   Active: ${program.isActive}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkHIIT();
