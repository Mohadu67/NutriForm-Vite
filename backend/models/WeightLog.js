const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    set: (v) => {
      const d = new Date(v);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    },
  },
  weight: {
    type: Number,
    required: true,
    min: 20,
    max: 400,
  },
  bodyFatPercent: {
    type: Number,
    min: 2,
    max: 60,
    default: null,
  },
  source: {
    type: String,
    enum: ['manual', 'healthkit', 'googlefit'],
    default: 'manual',
  },
}, {
  timestamps: true,
});

weightLogSchema.index({ userId: 1, date: -1 });
// Un seul log par jour par user
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WeightLog', weightLogSchema);
