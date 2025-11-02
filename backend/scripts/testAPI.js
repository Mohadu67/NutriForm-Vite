const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}

const mongoose = require('mongoose');
const HIITProgram = require('../models/HIITProgram');
const config = require('../config');

async function test() {
  await mongoose.connect(config.mongoUri);
  console.log(`Connected to: ${mongoose.connection.name}`);

  const programs = await HIITProgram.find({ isActive: true }).lean();
  console.log(`Found ${programs.length} programs`);

  if (programs.length > 0) {
    console.log('\nFirst program:');
    console.log(JSON.stringify(programs[0], null, 2));
  }

  await mongoose.disconnect();
}

test().catch(console.error);
