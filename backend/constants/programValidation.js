module.exports = {
  PROGRAM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100
  },
  PROGRAM_DESCRIPTION: {
    MAX_LENGTH: 5000
  },
  CYCLE_DURATION: {
    EXERCISE_MIN_SEC: 5,
    EXERCISE_MAX_SEC: 600,
    REST_MIN_SEC: 0,
    REST_MAX_SEC: 300
  },
  PROGRAM_LIMITS: {
    MAX_ESTIMATED_DURATION: 300,
    MAX_ESTIMATED_CALORIES: 2000,
    MAX_CYCLES: 100,
    MAX_TAGS: 10,
    MAX_MUSCLE_GROUPS: 15
  },
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
    MAX_SKIP: 10000
  },
  VALID_TYPES: ["hiit", "circuit", "superset", "amrap", "emom", "tabata", "custom"],
  VALID_DIFFICULTIES: ["débutant", "intermédiaire", "avancé"],
  VALID_CYCLE_TYPES: ["exercise", "rest", "transition"],
  ALLOWED_IMAGE_DOMAINS: [
    'harmonith.fr',
    'res.cloudinary.com',
    'i.imgur.com',
    'images.unsplash.com'
  ]
};
