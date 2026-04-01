/**
 * Migration : enrichir les entries de WorkoutSession avec primaryMuscle
 * et secondaryMuscles depuis la collection Exercise.
 *
 * Corrige le bug où les muscles secondaires n'étaient pas trackés
 * pour le calcul de récupération musculaire.
 *
 * Usage:
 *   node scripts/enrichSessionMuscles.js --dry-run   (voir sans modifier)
 *   node scripts/enrichSessionMuscles.js              (appliquer)
 */

const fs = require('fs');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
const envPath = path.join(__dirname, '..', envFile);
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');

const MONGO_URI = process.env.MONGO_URI;
const DRY_RUN = process.argv.includes('--dry-run');

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined');
  process.exit(1);
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]/g, '')
    .trim();
}

async function run() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Enrichissement des muscles dans WorkoutSession...\n`);

  await mongoose.connect(MONGO_URI, {
    authSource: 'admin',
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB\n');

  // 1. Charger tous les exercices et construire des index de lookup
  const exercises = await Exercise.find({ isActive: true }).lean();
  console.log(`${exercises.length} exercices charges depuis la DB\n`);

  const byExoId = new Map();
  const bySlug = new Map();
  const byNameNorm = new Map();

  for (const exo of exercises) {
    if (exo.exoId) byExoId.set(exo.exoId, exo);
    if (exo.slug) bySlug.set(exo.slug, exo);
    const norm = normalize(exo.name);
    if (norm) byNameNorm.set(norm, exo);
  }

  // 2. Trouver toutes les sessions finished
  const sessions = await WorkoutSession.find({ status: 'finished' });
  console.log(`${sessions.length} sessions finished trouvees\n`);

  let sessionsUpdated = 0;
  let entriesEnriched = 0;
  let entriesAlreadyOk = 0;
  let entriesNoMatch = 0;

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    let dirty = false;

    for (const entry of (session.entries || [])) {
      if (!entry) continue;

      // Skip si deja enrichi
      if (entry.primaryMuscle && Array.isArray(entry.secondaryMuscles) && entry.secondaryMuscles.length > 0) {
        entriesAlreadyOk++;
        continue;
      }

      // Chercher l'exercice correspondant
      const eid = entry.exerciseId || '';
      let exo = byExoId.get(eid) || bySlug.get(eid) || null;

      if (!exo && entry.exerciseName) {
        exo = byNameNorm.get(normalize(entry.exerciseName));
      }

      if (!exo) {
        entriesNoMatch++;
        continue;
      }

      // Enrichir
      entry.primaryMuscle = exo.primaryMuscle;
      entry.secondaryMuscles = exo.secondaryMuscles || [];
      entry.muscles = exo.muscles && exo.muscles.length
        ? exo.muscles
        : [exo.primaryMuscle, ...(exo.secondaryMuscles || [])];

      if (!entry.muscleGroup) {
        entry.muscleGroup = exo.primaryMuscle;
      }

      entriesEnriched++;
      dirty = true;
    }

    if (dirty) {
      if (!DRY_RUN) {
        session.markModified('entries');
        await session.save();
      }
      sessionsUpdated++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${sessions.length}`);
    }
  }

  console.log(`\n--- Resultat ${DRY_RUN ? '(dry run)' : ''} ---`);
  console.log(`Sessions mises a jour : ${sessionsUpdated}`);
  console.log(`Entries enrichies      : ${entriesEnriched}`);
  console.log(`Entries deja OK        : ${entriesAlreadyOk}`);
  console.log(`Entries sans match     : ${entriesNoMatch}`);

  await mongoose.disconnect();
  console.log('\nDone.');
  process.exit(0);
}

run().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
