require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Exercise = require('../models/Exercise');

// Get MongoDB URI without loading full config (which requires JWT_SECRET)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/nutriform';

const JSON_FILES = {
  muscu: '../../frontend/public/data/exo/muscu.json',
  cardio: '../../frontend/public/data/exo/cardio.json',
  yoga: '../../frontend/public/data/exo/yoga.json',
  meditation: '../../frontend/public/data/exo/meditation.json',
  natation: '../../frontend/public/data/exo/natation.json',
  etirement: '../../frontend/public/data/exo/etirement.json',
  hiit: '../../frontend/public/data/exo/hiit.json',
};

async function migrateExercises() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    console.log('📍 URI:', mongoUri.replace(/\/\/.*@/, '//*****@'));
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const [category, filePath] of Object.entries(JSON_FILES)) {
      const fullPath = path.join(__dirname, filePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Fichier non trouvé: ${category} (${fullPath})`);
        continue;
      }

      console.log(`\n📂 Traitement: ${category}.json`);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(fileContent);
      const exercises = data.exercises || [];

      console.log(`   ${exercises.length} exercices trouvés`);

      for (const exo of exercises) {
        try {
          // Générer exoId si manquant
          let exoId = exo.exoId;
          if (!exoId) {
            // Trouver le dernier numéro utilisé
            const lastExercise = await Exercise.findOne()
              .sort({ exoId: -1 })
              .select('exoId')
              .lean();

            let maxNum = 0;
            if (lastExercise && lastExercise.exoId) {
              const match = lastExercise.exoId.match(/exo-(\d+)/);
              if (match) maxNum = parseInt(match[1], 10);
            }

            exoId = `exo-${String(maxNum + 1).padStart(3, '0')}`;
          }

          // Vérifier si l'exercice existe déjà (par exoId ou name)
          const existing = await Exercise.findOne({
            $or: [
              { exoId },
              { name: exo.name }
            ]
          });

          if (existing) {
            console.log(`   ⏭️  Existe déjà: ${exo.name} (${existing.exoId})`);
            totalSkipped++;
            continue;
          }

          // Générer slug si manquant
          let slug = exo.slug;
          if (!slug) {
            slug = exo.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          }

          // Vérifier unicité du slug
          let finalSlug = slug;
          let counter = 1;
          while (await Exercise.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }

          // Combiner muscles
          const muscles = [
            exo.primaryMuscle || exo.muscle,
            ...(exo.secondaryMuscles || [])
          ].filter(Boolean);

          // Nettoyer les enums invalides (objectives & type)
          const validObjectives = ['force', 'hypertrophie', 'endurance', 'souplesse', 'relaxation', 'cardio', 'equilibre'];
          const validTypes = ['muscu', 'poids-du-corps', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'];

          const cleanObjectives = (exo.objectives || []).filter(obj => validObjectives.includes(obj));
          const cleanTypes = (exo.type || [category]).filter(t => validTypes.includes(t));

          // Créer l'exercice
          const exercise = new Exercise({
            exoId,
            name: exo.name,
            slug: finalSlug,
            category: exo.category || category,
            type: cleanTypes.length > 0 ? cleanTypes : [category],
            objectives: cleanObjectives,
            primaryMuscle: exo.primaryMuscle || exo.muscle || 'Non spécifié',
            secondaryMuscles: exo.secondaryMuscles || [],
            muscles,
            equipment: exo.equipment || [],
            difficulty: exo.difficulty || 'intermediaire',
            explanation: exo.explanation || exo.instructions || 'Pas d\'explication disponible',
            mainImage: exo.mainImage || exo.image || exo.gif || '',
            videoUrl: exo.videoUrl || exo.video || '',
            tips: exo.tips || exo.conseils || [],
            restTime: exo.restTime || 60,
            recommendedSets: exo.recommendedSets || exo.series || 3,
            recommendedReps: exo.recommendedReps || exo.reps || '8-12',
            isActive: true,
            usageCount: exo.usageCount || 0,
          });

          await exercise.save();
          console.log(`   ✅ Importé: ${exo.name} (${exoId})`);
          totalImported++;

        } catch (error) {
          console.error(`   ❌ Erreur pour ${exo.name}:`, error.message);
          totalErrors++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(60));
    console.log(`✅ Importés:  ${totalImported}`);
    console.log(`⏭️  Ignorés:   ${totalSkipped} (déjà en BDD)`);
    console.log(`❌ Erreurs:   ${totalErrors}`);
    console.log('='.repeat(60));

    const totalInDB = await Exercise.countDocuments();
    console.log(`\n💾 Total exercices en BDD: ${totalInDB}`);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécution
if (require.main === module) {
  migrateExercises()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateExercises };
