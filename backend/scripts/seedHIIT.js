const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const mongoose = require('mongoose');
const HIITProgram = require('../models/HIITProgram');
const config = require('../config');

async function seedHIIT() {
  try {
    console.log(`📍 Connection à: ${config.mongoUri}`);
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');
    console.log(`📍 DB name: ${mongoose.connection.name}`);

    // Supprimer les programmes existants
    await HIITProgram.deleteMany({});
    console.log('🗑️ Programmes HIIT existants supprimés');

    // Programme débutant
    const beginner = await HIITProgram.create({
      title: 'HIIT Débutant - Full Body',
      description: 'Programme HIIT pour débutants avec des exercices simples au poids du corps. Parfait pour commencer et brûler des calories efficacement.',
      level: 'debutant',
      totalDuration: 15,
      trainer: 'Coach Sarah',
      imageUrl: '/uploads/hiit-beginner.jpg',
      exercises: [
        { name: 'Échauffement - Marche sur place', durationSec: 60, isRest: false },
        { name: 'Jumping Jacks', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Squats', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Mountain Climbers', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Burpees (Version facile)', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Planche', durationSec: 20, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'High Knees', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Fentes alternées', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Jumping Jacks', durationSec: 30, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Squats', durationSec: 30, isRest: false },
        { name: 'Repos actif - Marche', durationSec: 60, isRest: true },
        { name: 'Étirements', durationSec: 60, isRest: false },
      ],
    });

    // Programme intermédiaire
    const intermediate = await HIITProgram.create({
      title: 'HIIT Intermédiaire - Cardio Intense',
      description: 'Programme HIIT intense pour brûler un maximum de calories. Alternance entre cardio et renforcement musculaire.',
      level: 'intermediaire',
      totalDuration: 20,
      trainer: 'Coach Mike',
      imageUrl: '/uploads/hiit-intermediate.jpg',
      exercises: [
        { name: 'Échauffement dynamique', durationSec: 60, isRest: false },
        { name: 'Burpees', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Mountain Climbers rapides', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Squat jumps', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Pompes dynamiques', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'High Knees', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Fentes sautées', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Planche avec rotation', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Box jumps (ou Squat jumps)', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 30, isRest: true },
        { name: 'Burpees', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Mountain Climbers', durationSec: 40, isRest: false },
        { name: 'Repos', durationSec: 20, isRest: true },
        { name: 'Tuck jumps', durationSec: 40, isRest: false },
        { name: 'Repos actif', durationSec: 90, isRest: true },
        { name: 'Étirements', durationSec: 60, isRest: false },
      ],
    });

    // Programme avancé
    const advanced = await HIITProgram.create({
      title: 'HIIT Avancé - Warrior Training',
      description: 'Programme HIIT extrême pour les athlètes confirmés. Préparez-vous à repousser vos limites !',
      level: 'avance',
      totalDuration: 25,
      trainer: 'Coach Alex',
      imageUrl: '/uploads/hiit-advanced.jpg',
      exercises: [
        { name: 'Échauffement intensif', durationSec: 60, isRest: false },
        { name: 'Burpees avec pompe', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Tuck jumps explosifs', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Mountain Climbers ultra rapides', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Squat jumps avec rotation', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Pompes spiderman', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Fentes sautées alternées', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Planche commando', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Box jumps hauts', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Devil press (avec haltères)', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 30, isRest: true },
        { name: 'Burpees avec pompe', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Mountain Climbers ultra rapides', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Tuck jumps explosifs', durationSec: 50, isRest: false },
        { name: 'Repos', durationSec: 15, isRest: true },
        { name: 'Sprint sur place', durationSec: 50, isRest: false },
        { name: 'Repos actif', durationSec: 120, isRest: true },
        { name: 'Étirements complets', durationSec: 90, isRest: false },
      ],
    });

    console.log('✅ Programmes HIIT créés avec succès:');
    console.log(`  - ${beginner.title} (${beginner.exercises.length} exercices)`);
    console.log(`  - ${intermediate.title} (${intermediate.exercises.length} exercices)`);
    console.log(`  - ${advanced.title} (${advanced.exercises.length} exercices)`);

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedHIIT();
