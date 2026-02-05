const mongoose = require('mongoose');
const { Schema } = mongoose;

const DailyHealthDataSchema = new Schema({
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
  caloriesBurned: {
    type: Number,
    default: 0,
    min: 0
  },
  steps: {
    type: Number,
    default: 0,
    min: 0
  },
  distance: {
    type: Number,
    default: 0,
    min: 0
  },
  source: {
    type: String,
    enum: ['healthkit', 'googlefit', 'calculated'],
    default: 'calculated'
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique index on (userId, date) - only one entry per user per day
DailyHealthDataSchema.index(
  { userId: 1, date: 1 },
  { unique: true, name: 'user_date_unique' }
);

// Index for querying user's daily data
DailyHealthDataSchema.index(
  { userId: 1, date: -1 },
  { name: 'user_date_history' }
);

module.exports = mongoose.model('DailyHealthData', DailyHealthDataSchema);
