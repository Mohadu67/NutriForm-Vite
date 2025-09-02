export const TYPE_MAP = {
  muscu: ["muscu", "renforcement", "strength", "weightlifting", "musculation", "fitness", "crossfit"],
  cardio: ["cardio", "hiit", "endurance", "aerobic", "aérobie", "conditioning"],
  renfo: ["renforcement", "muscu", "conditioning", "strength"],
  yoga: ["yoga", "hatha", "vinyasa", "ashtanga"],
  etirement: ["etirement", "étirement", "stretching", "stretch"],
  meditation: ["meditation", "méditation", "mindfulness"],
};

export const MUSCLE_MAP = {
  bras: [
    "biceps", "triceps", "avant-bras", "forearms", "arm", "bras"
  ],
  dos: [
    "dos-lats", "dos-trap", "trapèzes", "lats", "traps",
    "rear-delts", "arriere-epaules", "dos", "back",
    "rhomboides", "grand-dorsal", "grand-rond", "rhomboids", "teres-major"
  ],
  epaules: [
    "deltoides-ant", "deltoides-lat", "deltoides-post", "deltoides",
    "front-delts", "side-delts", "rear-delts", "epaules", "shoulders", "delts"
  ],
  pectoraux: [
    "pectoraux", "pectoraux-superieurs", "pectoraux-inferieurs", "pec", "pecs",
    "upper-chest", "lower-chest", "chest"
  ],
  jambes: [
    "quadriceps", "ischios", "isquios", "fessiers", "mollets", "adducteurs",
    "abducteurs", "quads", "hamstrings", "glutes", "calves", "jambes", "legs", "hanches"
  ],
  core: [
    "abdos", "obliques", "lombaires", "core", "abs", "lower-back",
    "tronc", "sangle-abdo", "abdominales", "gainage", "plank"
  ],
};

export const EQUIP_MAP = {
  "poids-du-corps": [
    "poids du corps", "bodyweight", "body weight", "none", "no equipment",
    "weightless", "barre-fixe", "barre fixe", "pull-up bar", "pullup bar", "sans matériel", "aucun"
  ],
  "halteres": ["halteres", "haltères", "dumbbell", "dumbbells", "dumbell", "dumb bell"],
  "barre": ["barre", "barbell", "barres", "olympic bar", "ez bar", "barre ez"],
  "machine": [
    "machine", "machines", "selectorized", "smith", "smith machine", "presse",
    "velo", "vélo", "velo-stationnaire", "vélo stationnaire", "assault-bike",
    "airbike", "elliptique", "tapis", "tapis de course", "stepper",
    "rameur", "ski-erg", "ergometer", "leg press", "pec deck", "lat pulldown"
  ],
  "kettlebell": ["kettlebell", "kettlebells", "kettle-bell"],
  "poulie": ["poulie", "poulies", "cable", "cables", "cable machine", "cable crossover"],
};

export default { TYPE_MAP, MUSCLE_MAP, EQUIP_MAP };
