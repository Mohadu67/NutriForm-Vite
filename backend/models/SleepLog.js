const mongoose = require('mongoose');
const { Schema } = mongoose;

const SleepLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    // Store as midnight in UTC
    set: (date) => {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    },
    index: true
  },
  sleepDuration: {
    type: Number,
    min: 0
  },
  deepSleepMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  remSleepMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  lightSleepMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  awakeMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  sleepStart: {
    type: Date
  },
  sleepEnd: {
    type: Date
  },
  heartRateResting: {
    type: Number,
    min: 0
  },
  hrv: {
    type: Number,
    min: 0
  },
  source: {
    type: String,
    enum: ['healthkit', 'googlefit', 'manual'],
    default: 'manual'
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique index on (userId, date) - only one entry per user per day
SleepLogSchema.index(
  { userId: 1, date: 1 },
  { unique: true, name: 'user_sleep_date_unique' }
);

// Index for querying user's sleep history
SleepLogSchema.index(
  { userId: 1, date: -1 },
  { name: 'user_sleep_date_history' }
);

module.exports = mongoose.model('SleepLog', SleepLogSchema);
