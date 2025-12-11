/**
 * Script de migration des programmes JSON vers MongoDB
 * Usage: node scripts/migratePrograms.js
 *
 * Ce script importe les 3 programmes du fichier JSON statique dans MongoDB.
 * À exécuter une seule fois sur le VPS.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Program = require('../models/program.model');

const programsData = {
  "programs": [
    {
      "id": "prog-001",
      "name": "HIIT Tabata Classique",
      "description": "Protocole Tabata authentique : 4 minutes d'intensité maximale. Parfait pour brûler des calories rapidement.",
      "type": "tabata",
      "difficulty": "intermédiaire",
      "estimatedDuration": 4,
      "estimatedCalories": 80,
      "tags": ["hiit", "cardio", "full-body", "rapide"],
      "muscleGroups": ["abdos", "jambes", "cardio"],
      "equipment": ["aucun", "poids-du-corps"],
      "coverImage": "https://img.passeportsante.net/1200x675/2020-11-27/i97844-.jpeg",
      "instructions": "Le protocole Tabata consiste en 8 cycles de 20 secondes d'effort maximal suivies de 10 secondes de repos. Donnez tout ce que vous avez pendant les phases d'effort !",
      "tips": "Échauffez-vous bien avant de commencer. Si vous êtes débutant, réduisez l'intensité mais gardez le rythme.",
      "cycles": [
        { "order": 1, "type": "exercise", "exerciseId": "exo-021", "exerciseName": "Mountain climbers", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/MountainClimbers.gif" },
        { "order": 2, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 3, "type": "exercise", "exerciseId": "exo-039", "exerciseName": "Burpees", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/Burpees.gif" },
        { "order": 4, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 5, "type": "exercise", "exerciseId": "exo-021", "exerciseName": "Mountain climbers", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/MountainClimbers.gif" },
        { "order": 6, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 7, "type": "exercise", "exerciseId": "exo-039", "exerciseName": "Burpees", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/Burpees.gif" },
        { "order": 8, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 9, "type": "exercise", "exerciseId": "exo-021", "exerciseName": "Mountain climbers", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/MountainClimbers.gif" },
        { "order": 10, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 11, "type": "exercise", "exerciseId": "exo-039", "exerciseName": "Burpees", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/Burpees.gif" },
        { "order": 12, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 13, "type": "exercise", "exerciseId": "exo-021", "exerciseName": "Mountain climbers", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/MountainClimbers.gif" },
        { "order": 14, "type": "rest", "restSec": 10, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 15, "type": "exercise", "exerciseId": "exo-039", "exerciseName": "Burpees", "exerciseType": "hiit", "durationSec": 20, "intensity": 10, "repeat": 1, "image": "/data/exo/Burpees.gif" }
      ]
    },
    {
      "id": "prog-002",
      "name": "Circuit Cardio Endurance",
      "description": "Enchaînement de 3 exercices cardio pour développer votre endurance. Idéal pour les débutants.",
      "type": "circuit",
      "difficulty": "débutant",
      "estimatedDuration": 30,
      "estimatedCalories": 250,
      "tags": ["cardio", "endurance", "débutant"],
      "muscleGroups": ["jambes", "cardio"],
      "equipment": ["velo-stationnaire", "rameur", "tapis-de-course"],
      "coverImage": "https://t3.ftcdn.net/jpg/08/12/89/18/240_F_812891845_SLIhyR2Z0eKHrGSC9JTeyfiCi1iPBmgQ.jpg",
      "instructions": "Enchaînez les 3 exercices cardio avec des transitions courtes. Maintenez un rythme modéré et constant. Hydratez-vous pendant les transitions.",
      "tips": "Si vous sentez que c'est trop facile, augmentez l'intensité. Si c'est trop dur, prenez des pauses supplémentaires.",
      "cycles": [
        { "order": 1, "type": "exercise", "exerciseId": "exo-001", "exerciseName": "Vélo stationnaire", "exerciseType": "cardio", "durationMin": 10, "durationSec": 600, "intensity": 6, "image": "/data/exo/VeloStationnaire.gif" },
        { "order": 2, "type": "transition", "restSec": 60, "notes": "Transition vers le rameur, hydratez-vous", "image": "/data/exo/Crunch.gif" },
        { "order": 3, "type": "exercise", "exerciseId": "exo-007", "exerciseName": "Rameur", "exerciseType": "cardio", "durationMin": 10, "durationSec": 600, "intensity": 7, "image": "/data/exo/Rameur.jpeg" },
        { "order": 4, "type": "transition", "restSec": 60, "notes": "Transition vers le tapis de course", "image": "/data/exo/Crunch.gif" },
        { "order": 5, "type": "exercise", "exerciseId": "exo-003", "exerciseName": "Course sur tapis", "exerciseType": "cardio", "durationMin": 8, "durationSec": 480, "intensity": 7, "image": "/data/exo/CourseTapis.jpeg" },
        { "order": 6, "type": "rest", "restSec": 120, "notes": "Récupération finale - marchez lentement", "image": "/data/exo/Crunch.gif" }
      ]
    },
    {
      "id": "prog-003",
      "name": "HIIT Full Body 15min",
      "description": "Programme HIIT complet sollicitant tout le corps. Alternance de 45 secondes d'effort et 15 secondes de repos.",
      "type": "hiit",
      "difficulty": "avancé",
      "estimatedDuration": 15,
      "estimatedCalories": 180,
      "tags": ["hiit", "full-body", "perte-de-poids", "intense"],
      "muscleGroups": ["full-body", "abdos", "jambes", "pectoraux", "dos"],
      "equipment": ["aucun", "poids-du-corps"],
      "coverImage": "https://t4.ftcdn.net/jpg/04/29/23/25/240_F_429232544_ajLgWAMHxEkd3OwpodRTIfMq3MpyXPFy.jpg",
      "instructions": "5 exercices enchaînés 3 fois. Chaque exercice dure 45 secondes avec 15 secondes de repos. Donnez le maximum pendant les phases d'effort !",
      "tips": "Ce programme est intense. Écoutez votre corps et n'hésitez pas à adapter l'intensité si nécessaire. L'important est de maintenir une bonne forme.",
      "cycles": [
        { "order": 1, "type": "exercise", "exerciseId": "exo-039", "exerciseName": "Burpees", "exerciseType": "hiit", "durationSec": 45, "intensity": 9, "repeat": 1, "image": "/data/exo/Burpees.gif" },
        { "order": 2, "type": "rest", "restSec": 15, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 3, "type": "exercise", "exerciseId": "exo-021", "exerciseName": "Mountain climbers", "exerciseType": "hiit", "durationSec": 45, "intensity": 9, "repeat": 1, "image": "/data/exo/MountainClimbers.gif" },
        { "order": 4, "type": "rest", "restSec": 15, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 5, "type": "exercise", "exerciseId": "exo-012", "exerciseName": "Pompes", "exerciseType": "poids_du_corps", "durationSec": 45, "intensity": 8, "repeat": 1, "image": "/data/exo/Pompe.gif" },
        { "order": 6, "type": "rest", "restSec": 15, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 7, "type": "exercise", "exerciseId": "exo-040", "exerciseName": "Squats", "exerciseType": "poids_du_corps", "durationSec": 45, "intensity": 8, "repeat": 1, "image": "/data/exo/SquatPoidsCorps.gif" },
        { "order": 8, "type": "rest", "restSec": 15, "repeat": 1, "image": "/data/exo/Crunch.gif" },
        { "order": 9, "type": "exercise", "exerciseId": "exo-038", "exerciseName": "Jumping jacks", "exerciseType": "hiit", "durationSec": 45, "intensity": 7, "repeat": 1, "image": "/data/exo/JumpingJacks.gif" },
        { "order": 10, "type": "rest", "restSec": 30, "notes": "Repos entre les tours", "repeat": 1, "image": "/data/exo/Crunch.gif" }
      ],
      "cycleRepeat": 3
    }
  ]
};

async function migratePrograms() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI non défini dans .env');
      process.exit(1);
    }

    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Vérifier les programmes existants
    const existingCount = await Program.countDocuments();
    console.log(`📊 Programmes existants dans la base: ${existingCount}`);

    // Vérifier si les programmes JSON existent déjà (par nom)
    const existingNames = await Program.find({}, 'name').lean();
    const existingNameSet = new Set(existingNames.map(p => p.name));

    let imported = 0;
    let skipped = 0;

    for (const program of programsData.programs) {
      if (existingNameSet.has(program.name)) {
        console.log(`⏭️  Programme "${program.name}" existe déjà - ignoré`);
        skipped++;
        continue;
      }

      // Transformer le programme pour MongoDB
      const mongoProgram = {
        name: program.name,
        description: program.description,
        type: program.type,
        difficulty: program.difficulty,
        estimatedDuration: program.estimatedDuration,
        estimatedCalories: program.estimatedCalories,
        tags: program.tags,
        muscleGroups: program.muscleGroups,
        equipment: program.equipment,
        coverImage: program.coverImage,
        instructions: program.instructions,
        tips: program.tips,
        cycles: program.cycles,
        cycleRepeat: program.cycleRepeat || 1,
        // Champs MongoDB spécifiques
        createdBy: 'admin',
        status: 'public',
        isPublic: true,
        isActive: true,
        originalJsonId: program.id // Garder une trace de l'ID original
      };

      const newProgram = new Program(mongoProgram);
      await newProgram.save();
      console.log(`✅ Programme importé: "${program.name}"`);
      imported++;
    }

    console.log('\n📋 Résumé de la migration:');
    console.log(`   - Programmes importés: ${imported}`);
    console.log(`   - Programmes ignorés (déjà existants): ${skipped}`);
    console.log(`   - Total dans la base: ${await Program.countDocuments()}`);

    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
    console.log('✅ Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migratePrograms();
