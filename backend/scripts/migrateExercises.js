/**
 * Script de migration des exercices vers MongoDB + Cloudinary
 *
 * Usage: node scripts/migrateExercises.js
 *
 * Ce script:
 * 1. Lit tous les fichiers JSON d'exercices
 * 2. Upload les GIFs vers Cloudinary
 * 3. Insere les exercices dans MongoDB
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const Exercise = require('../models/Exercise');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Chemins
const DATA_PATH = path.join(__dirname, '../../frontend/public/data/exo');
const IMAGES_PATH = path.join(__dirname, '../../frontend/public/images/Exo');

// Mapping des categories JSON -> category DB
const CATEGORY_MAP = {
  'muscu': 'muscu',
  'cardio': 'cardio',
  'etirement': 'etirement',
  'hiit': 'hiit',
  'yoga': 'yoga',
  'meditation': 'meditation',
  'natation': 'natation',
};

// Mapping des niveaux de difficulte
const getDifficulty = (objectives = [], equipment = []) => {
  if (equipment.includes('poids-du-corps') || equipment.includes('aucun')) {
    return 'debutant';
  }
  if (objectives.includes('force') || equipment.includes('barre')) {
    return 'intermediaire';
  }
  return 'intermediaire';
};

// Generer un slug a partir du nom
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder que lettres, chiffres, espaces, tirets
    .replace(/\s+/g, '-') // Espaces -> tirets
    .replace(/-+/g, '-') // Multiples tirets -> un seul
    .replace(/^-|-$/g, ''); // Supprimer tirets debut/fin
};

// Upload image vers Cloudinary
async function uploadToCloudinary(imagePath, exerciseSlug) {
  try {
    // Construire le chemin complet
    const localPath = path.join(__dirname, '../../frontend/public', imagePath);

    if (!fs.existsSync(localPath)) {
      console.log(`  ⚠️ Image non trouvee: ${localPath}`);
      return null;
    }

    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'harmonith/exercises',
      public_id: exerciseSlug,
      resource_type: 'auto', // Pour supporter GIF et images
      overwrite: true,
    });

    console.log(`  ✅ Upload: ${exerciseSlug} -> ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`  ❌ Erreur upload ${exerciseSlug}:`, error.message);
    return null;
  }
}

// Traiter un fichier JSON
async function processJsonFile(filename) {
  const category = filename.replace('.json', '');
  const filePath = path.join(DATA_PATH, filename);

  console.log(`\n📂 Traitement de ${filename}...`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const exercises = data.exercises || [];

    console.log(`  📊 ${exercises.length} exercices trouves`);

    const processedExercises = [];

    for (const exo of exercises) {
      // Generer slug si absent
      const slug = exo.slug || generateSlug(exo.name);
      console.log(`  🏋️ ${exo.name} (${slug})`);

      // Upload images
      const uploadedImages = [];
      if (exo.images && exo.images.length > 0) {
        for (const imagePath of exo.images) {
          const uploaded = await uploadToCloudinary(imagePath, slug);
          if (uploaded) {
            uploadedImages.push(uploaded);
          }
        }
      }

      // Creer l'objet exercice pour MongoDB
      const exerciseDoc = {
        exoId: exo.id,
        name: exo.name,
        slug: slug,
        category: CATEGORY_MAP[category] || category,
        type: exo.type || [category],
        objectives: exo.objectives || [],
        primaryMuscle: exo.primaryMuscle || exo.muscles?.[0] || 'autre',
        secondaryMuscles: exo.secondaryMuscles || exo.muscles?.slice(1) || [],
        muscles: exo.muscles || [exo.primaryMuscle],
        equipment: exo.equipment || [],
        difficulty: getDifficulty(exo.objectives, exo.equipment),
        explanation: exo.explanation || '',
        images: uploadedImages,
        mainImage: uploadedImages[0]?.url || null,
        restTime: category === 'cardio' ? 30 : category === 'etirement' ? 20 : 60,
        recommendedSets: category === 'cardio' ? 1 : 3,
        recommendedReps: category === 'cardio' ? '20-30 min' : category === 'etirement' ? '30s' : '8-12',
        isActive: true,
        order: 0,
      };

      processedExercises.push(exerciseDoc);
    }

    return processedExercises;
  } catch (error) {
    console.error(`❌ Erreur traitement ${filename}:`, error.message);
    return [];
  }
}

// Fonction principale
async function migrate() {
  console.log('🚀 Demarrage de la migration des exercices...\n');
  console.log('📁 Chemin data:', DATA_PATH);
  console.log('📁 Chemin images:', IMAGES_PATH);

  // Connexion MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecte a MongoDB\n');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }

  // Verification Cloudinary
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME manquant');
    process.exit(1);
  }
  console.log('✅ Cloudinary configure\n');

  // Lire tous les fichiers JSON
  const files = fs.readdirSync(DATA_PATH).filter(f => f.endsWith('.json'));
  console.log(`📂 ${files.length} fichiers JSON trouves: ${files.join(', ')}\n`);

  // Option: Nettoyer la collection existante
  const existingCount = await Exercise.countDocuments();
  if (existingCount > 0) {
    console.log(`⚠️ ${existingCount} exercices existants en BDD`);
    console.log('🗑️ Suppression des exercices existants...');
    await Exercise.deleteMany({});
    console.log('✅ Collection videe\n');
  }

  // Traiter chaque fichier
  let allExercises = [];
  for (const file of files) {
    const exercises = await processJsonFile(file);
    allExercises = allExercises.concat(exercises);
  }

  console.log(`\n📊 Total: ${allExercises.length} exercices a inserer`);

  // Insertion en BDD
  if (allExercises.length > 0) {
    try {
      console.log('\n🔄 Insertion des exercices...');
      // Debug: afficher le premier exercice
      console.log('Premier exercice:', JSON.stringify(allExercises[0], null, 2));

      const result = await Exercise.insertMany(allExercises, { ordered: false });
      console.log(`✅ ${result.length} exercices inseres avec succes!`);
    } catch (error) {
      console.error('❌ Erreur insertion:', error.message);
      console.error('Détails:', error);
      if (error.writeErrors) {
        console.error('Write errors:', error.writeErrors.slice(0, 3));
      }
      if (error.insertedDocs) {
        console.log(`⚠️ ${error.insertedDocs.length} exercices inseres malgre les erreurs`);
      }
    }
  }

  // Stats finales
  const finalCount = await Exercise.countDocuments();
  const byCategory = await Exercise.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('\n📈 Statistiques finales:');
  console.log(`  Total exercices: ${finalCount}`);
  byCategory.forEach(c => {
    console.log(`  - ${c._id}: ${c.count}`);
  });

  // Fermer connexion
  await mongoose.disconnect();
  console.log('\n✅ Migration terminee!');
}

// Executer
migrate().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
