/**
 * Migration script: Convert WorkoutSession calories to DailyHealthData
 *
 * This script groups all workout sessions by (userId, date) and creates
 * DailyHealthData entries with the total calories burned that day.
 *
 * Run with: node migrateCaloriesToDailyHealth.js
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
const DailyHealthData = require('../models/DailyHealthData');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function migrateCaloriesToDailyHealth() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      authSource: 'admin',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Fetch all finished workout sessions
    console.log('\n📊 Fetching all workout sessions...');
    const sessions = await WorkoutSession.find({
      status: 'finished',
      calories: { $gt: 0 }
    })
      .sort({ endedAt: 1 })
      .lean();

    console.log(`📈 Found ${sessions.length} workout sessions with calories`);

    // Group by (userId, date)
    const grouped = {};
    sessions.forEach(session => {
      const sessionDate = new Date(session.endedAt || session.createdAt);
      sessionDate.setUTCHours(0, 0, 0, 0);
      const dateKey = sessionDate.toISOString().split('T')[0];
      const userId = session.userId.toString();
      const key = `${userId}|${dateKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          userId: session.userId,
          date: sessionDate,
          caloriesBurned: 0,
          source: 'calculated',
          sessionCount: 0,
        };
      }

      grouped[key].caloriesBurned += session.calories || 0;
      grouped[key].sessionCount += 1;
    });

    const groupedArray = Object.values(grouped);
    console.log(`\n📦 Grouped into ${groupedArray.length} unique user-date combinations`);

    // Display some stats
    const totalCaloriesToMigrate = groupedArray.reduce((sum, g) => sum + g.caloriesBurned, 0);
    console.log(`\n📊 Total calories to migrate: ${Math.round(totalCaloriesToMigrate)}`);
    console.log(`📊 Average per day: ${Math.round(totalCaloriesToMigrate / groupedArray.length)}`);
    console.log(`📊 Max per day: ${Math.round(Math.max(...groupedArray.map(g => g.caloriesBurned)))}`);

    // Ask for confirmation
    console.log('\n⚠️  This will create DailyHealthData entries for all grouped data');
    console.log('   Existing DailyHealthData entries with the same (userId, date) will be updated\n');

    // Get user input (simple y/n in terminal)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('Continue with migration? (yes/no): ', async (answer) => {
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          console.log('\n❌ Migration cancelled');
          process.exit(0);
        }

        try {
          // Perform upsert for each grouped data
          console.log('\n⏳ Starting migration...');
          let created = 0;
          let updated = 0;

          for (let i = 0; i < groupedArray.length; i++) {
            const data = groupedArray[i];

            try {
              const result = await DailyHealthData.findOneAndUpdate(
                { userId: data.userId, date: data.date },
                {
                  caloriesBurned: Math.round(data.caloriesBurned),
                  source: 'calculated',
                  syncedAt: new Date()
                },
                { upsert: true, new: true }
              );

              if (result.isNew) {
                created++;
              } else {
                updated++;
              }

              // Progress indicator
              if ((i + 1) % 100 === 0) {
                console.log(`  Progress: ${i + 1}/${groupedArray.length}`);
              }
            } catch (err) {
              if (err.code === 11000) {
                // Duplicate key error - already exists
                updated++;
              } else {
                console.error(`  Error processing entry ${i + 1}:`, err.message);
              }
            }
          }

          console.log('\n✅ Migration completed!');
          console.log(`   Created: ${created} new DailyHealthData entries`);
          console.log(`   Updated: ${updated} existing entries`);
          console.log(`   Total calories migrated: ${Math.round(totalCaloriesToMigrate)}`);

          resolve();
        } catch (err) {
          console.error('\n❌ Migration error:', err);
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

// Run the migration
migrateCaloriesToDailyHealth();
