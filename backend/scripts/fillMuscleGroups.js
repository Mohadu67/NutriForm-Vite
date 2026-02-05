/**
 * Script to retroactively fill missing muscle groups in WorkoutSession entries
 *
 * Some sessions (especially from web app) may not have muscleGroup filled.
 * This script uses the same logic as the pre-save hook to detect muscles.
 *
 * Run with: node fillMuscleGroups.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}

const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

function guessMuscleGroup(name = "", type = "") {
  const n = String(name).toLowerCase();
  const t = String(type).toLowerCase();
  if (/mollet|calf/.test(n)) return "Mollets";
  if (/pompe|push[- ]?up|bench|développé|developpe|pec/.test(n)) return "Pectoraux";
  if (/traction|pull[- ]?up|row|tirage|dos/.test(n)) return "Dos";
  if (/squat|presse|leg|fente|deadlift|soulevé/.test(n)) return "Jambes";
  if (/curl|biceps/.test(n)) return "Biceps";
  if (/triceps|dip/.test(n)) return "Triceps";
  if (/épaule|epaule|shoulder|overhead|militaire|lateral/.test(n)) return "Épaules";
  if (/abdo|crunch|gainage|core|planche/.test(n)) return "Abdos";
  if (t === "cardio") return "Cardio";
  return null;
}

async function fillMuscleGroups() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      authSource: 'admin',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find sessions with entries missing muscleGroup
    console.log('📊 Scanning for sessions with missing muscle groups...');
    const sessions = await WorkoutSession.find({
      status: 'finished',
      $or: [
        { 'entries.muscleGroup': { $exists: false } },
        { 'entries.muscleGroup': null },
        { 'entries.muscleGroup': '' }
      ]
    });

    console.log(`Found ${sessions.length} sessions with missing muscle groups\n`);

    if (sessions.length === 0) {
      console.log('✅ All sessions have muscle groups!');
      process.exit(0);
    }

    // Show summary
    let totalEntries = 0;
    let entriesToFill = 0;
    sessions.forEach(session => {
      session.entries.forEach(entry => {
        totalEntries++;
        if (!entry.muscleGroup) {
          entriesToFill++;
        }
      });
    });

    console.log(`📈 Total entries: ${totalEntries}`);
    console.log(`📋 Entries to fill: ${entriesToFill}\n`);

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('Continue filling muscle groups? (yes/no): ', async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          console.log('\n❌ Operation cancelled');
          process.exit(0);
        }

        try {
          console.log('\n⏳ Filling muscle groups...');
          let filled = 0;
          let updated = 0;

          for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            let sessionUpdated = false;

            for (const entry of session.entries) {
              if (!entry.muscleGroup || !entry.muscle) {
                const muscleGroup = guessMuscleGroup(entry.exerciseName, entry.type);
                if (muscleGroup) {
                  entry.muscleGroup = entry.muscleGroup || muscleGroup;
                  entry.muscle = entry.muscle || muscleGroup;
                  if (!Array.isArray(entry.muscles) || entry.muscles.length === 0) {
                    entry.muscles = [muscleGroup];
                  }
                  filled++;
                  sessionUpdated = true;
                }
              }
            }

            if (sessionUpdated) {
              await session.save();
              updated++;
            }

            // Progress indicator
            if ((i + 1) % 50 === 0) {
              console.log(`  Progress: ${i + 1}/${sessions.length}`);
            }
          }

          console.log('\n✅ Fill complete!');
          console.log(`   Entries filled: ${filled}`);
          console.log(`   Sessions updated: ${updated}`);

          resolve();
        } catch (err) {
          console.error('\n❌ Error:', err);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fillMuscleGroups();
