const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Informations personnelles
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  age: {
    type: Number,
    min: 13,
    max: 120
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_say'],
    default: 'prefer_not_say'
  },

  // Localisation hyper-locale
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    city: String,
    neighborhood: String, // Quartier pour hyper-local
    postalCode: String
  },

  // Niveau de fitness
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },

  // Types d'entraînement préférés
  workoutTypes: [{
    type: String,
    enum: ['musculation', 'cardio', 'crossfit', 'yoga', 'pilates', 'running', 'cycling', 'swimming', 'boxing', 'dance', 'functional', 'hiit', 'stretching', 'other']
  }],

  // Disponibilités (pour matching intelligent)
  availability: {
    monday: [{ start: String, end: String }],    // Ex: [{ start: '18:00', end: '20:00' }]
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
  },

  // Préférences de matching
  matchPreferences: {
    maxDistance: {
      type: Number,
      default: 5, // km
      min: 0.5,
      max: 50
    },
    preferredFitnessLevels: [{
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }],
    preferredWorkoutTypes: [{
      type: String,
      enum: ['musculation', 'cardio', 'crossfit', 'yoga', 'pilates', 'running', 'cycling', 'swimming', 'boxing', 'dance', 'functional', 'hiit', 'stretching', 'other']
    }],
    preferredAgeRange: {
      min: { type: Number, min: 13, max: 120 },
      max: { type: Number, min: 13, max: 120 }
    },
    preferredGender: {
      type: String,
      enum: ['any', 'male', 'female', 'other'],
      default: 'any'
    },
    onlyVerified: {
      type: Boolean,
      default: false
    }
  },

  // Vérification (pour sécurité)
  verified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['none', 'email', 'phone', 'id_card', 'social_media'],
    default: 'email'
  },

  // Statistiques publiques (pour matching)
  stats: {
    totalWorkouts: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    badges: [String]
  },

  // Visibilité
  isVisible: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },

  // Blocages
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index pour recherche géospatiale hyper-locale
userProfileSchema.index({ 'location.coordinates': '2dsphere' });
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'location.city': 1, 'location.neighborhood': 1 });
userProfileSchema.index({ isVisible: 1, verified: 1 });

// Méthode pour calculer la distance entre deux profils
userProfileSchema.methods.distanceTo = function(otherProfile) {
  if (!this.location?.coordinates || !otherProfile.location?.coordinates) {
    return null;
  }

  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = otherProfile.location.coordinates;

  // Formule de Haversine
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

// Méthode pour vérifier si deux utilisateurs ont des disponibilités communes
userProfileSchema.methods.hasCommonAvailability = function(otherProfile) {
  if (!this.availability || !otherProfile.availability) {
    return false;
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const day of days) {
    const mySlots = this.availability[day] || [];
    const theirSlots = otherProfile.availability[day] || [];

    for (const mySlot of mySlots) {
      for (const theirSlot of theirSlots) {
        // Vérifier si les créneaux se chevauchent
        const myStart = timeToMinutes(mySlot.start);
        const myEnd = timeToMinutes(mySlot.end);
        const theirStart = timeToMinutes(theirSlot.start);
        const theirEnd = timeToMinutes(theirSlot.end);

        if (myStart < theirEnd && theirStart < myEnd) {
          return true; // Chevauchement trouvé
        }
      }
    }
  }

  return false;
};

// Fonction helper pour convertir HH:MM en minutes
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = mongoose.model('UserProfile', userProfileSchema);
