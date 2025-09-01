export const TYPE_MAP = {
  muscu: ["muscu", "renforcement", "strength", "weightlifting"],
  cardio: ["cardio", "hiit", "endurance"],
  renfo: ["renforcement", "muscu"],
  yoga: ["yoga"],
  etirement: ["etirement", "stretching"],
  meditation: ["meditation"],
};

export const MUSCLE_MAP = {
  bras: [
    "biceps",
    "triceps",
    "avant-bras",
    "forearms",
  ],
  dos: [
    "dos-lats",
    "dos-trap",
    "trapèzes",
    "arriere-epaules",
    "lats",
    "traps",
    "rear-delts",
  ],
  epaules: [
    "deltoides-ant",
    "deltoides-lat",
    "deltoides-post",
    "deltoides",
    "front-delts",
    "side-delts",
    "rear-delts",
  ],
  pectoraux: [
    "pectoraux",
    "pectoraux-superieurs",
    "pectoraux-inferieurs",
    "pecs",
    "upper-chest",
    "lower-chest",
  ],
  jambes: [
    "quadriceps",
    "ischios",
    "fessiers",
    "mollets",
    "adducteurs",
    "abducteurs",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
  ],
  core: [
    "abdos",
    "obliques",
    "lombaires",
    "core",
    "abs",
    "lower-back",
  ],
};

export const EQUIP_MAP = {
  "poids-du-corps": [
    "poids du corps",
    "bodyweight",
    "body weight",
    "none",
    "no equipment",
    "weightless",
    "barre-fixe",
    "barre fixe",
    "pull-up bar",
    "pullup bar"
  ],
  "halteres": ["halteres", "haltères", "dumbbell", "dumbbells"],
  "barre": ["barre", "barbell"],
  "machine": [
    "machine",
    "machines",
    "selectorized",
    "smith",
    "smith machine",
    "velo",
    "vélo",
    "velo-stationnaire",
    "vélo stationnaire",
    "assault-bike",
    "airbike",
    "elliptique",
    "tapis",
    "tapis de course",
    "stepper",
    "rameur",
    "ski-erg"
  ],
  "kettlebell": ["kettlebell", "kettlebells"],
  "poulie": ["poulie", "cable", "cables"],
};

export default { TYPE_MAP, MUSCLE_MAP, EQUIP_MAP };
