const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email invalide'
      }
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    source: {
      type: String,
      default: 'website',
      enum: ['website', 'api', 'import']
    }
  },
  {
    timestamps: true
  }
);


newsletterSubscriberSchema.index({ email: 1 });
newsletterSubscriberSchema.index({ subscribedAt: -1 });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);