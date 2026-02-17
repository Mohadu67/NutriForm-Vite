export const TYPE_MAP = {
  muscu: ["muscu", "renforcement", "strength", "weightlifting", "musculation", "fitness", "crossfit"],
  cardio: ["cardio", "hiit", "endurance", "aerobic", "aérobie", "conditioning"],
  yoga: ["yoga", "yogi", "asana", "vinyasa", "hatha", "ashtanga", "yin", "power yoga"],
  natation: ["natation", "swimming", "nage", "piscine", "crawl", "brasse", "papillon", "dos crawlé"],
  etirement: ["etirement", "étirement", "stretching", "stretch"],
  meditation: ["meditation", "méditation", "mindfulness"],
};

export const MUSCLE_ZONES = Object.freeze({
  pectoraux: Object.freeze([
    "pectoraux",
    "pectoraux-superieurs",
    "pectoraux-inferieurs",
    "pec",
    "pecs",
    "upper-chest",
    "upper chest",
    "lower-chest",
    "lower chest",
    "chest",
    "thorax",
    "sternum"
  ]),
  epaules: Object.freeze([
    "epaules",
    "épaule",
    "epaule",
    "deltoides",
    "deltoide",
    "delts",
    "rear-delts",
    "shoulders",
    "shoulder",
    "deltoides-ant",
    "deltoides-lat",
    "deltoides-post",
    "front-delts",
    "side-delts",
    "rear-delts",
    "arriere-epaules",
    "arriere epaule",
    "rear delts"
  ]),
  biceps: Object.freeze([
    "biceps",
    "bicep",
    "arm curl",
    "flexion biceps",
    "curl biceps"
  ]),
  triceps: Object.freeze([
    "triceps",
    "tricep",
    "extension triceps",
    "dips",
    "kickback"
  ]),
  "avant-bras": Object.freeze([
    "avant-bras",
    "avant bras",
    "forearms",
    "forearm",
    "poignet",
    "poignets",
    "wrist",
    "wrists",
    "grip"
  ]),
  "abdos-centre": Object.freeze([
    "abdos-centre",
    "abdos",
    "abs",
    "six-pack",
    "six pack",
    "rectus abdominis",
    "grand droit",
    "core",
    "tronc",
    "sangle-abdo",
    "sangle abdominale",
    "centre du tronc",
    "abdominaux",
    "abdominal",
    "abdomen"
  ]),
  "abdos-lateraux": Object.freeze([
    "abdos-lateraux",
    "abdos lateraux",
    "obliques",
    "oblique",
    "side abs",
    "side-ab",
    "transverse",
    "transverses",
    "gainage lateral",
    "gainage latéral",
    "love handles"
  ]),
  "dos-superieur": Object.freeze([
    "dos-superieur",
    "dos supérieur",
    "upper back",
    "upper-back",
    "haut du dos",
    "dos haut",
    "dos",
    "dos-trap",
    "dos trap",
    "trapèzes",
    "trapezes",
    "traps",
    "dos-lats",
    "dos lats",
    "lats",
    "grand-dorsal",
    "grand dorsal",
    "grand-rond",
    "grand rond",
    "rhomboides",
    "rhomboids",
    "arriere-epaules",
    "rear delts"
  ]),
  "dos-inferieur": Object.freeze([
    "dos-inferieur",
    "dos inferieur",
    "lower back",
    "lower-back",
    "low back",
    "bas du dos",
    "dos bas",
    "dos",
    "lombaires",
    "lombaire",
    "erector spinae",
    "spinal erectors",
    "dos-lats",
    "dos lats",
    "gainage lombaire"
  ]),
  fessiers: Object.freeze([
    "fessiers",
    "fessier",
    "glutes",
    "glute",
    "grand fessier",
    "moyen fessier",
    "petit fessier",
    "butt",
    "fess",
    "hanches"
  ]),
  "cuisses-externes": Object.freeze([
    "cuisses-externes",
    "cuisses externes",
    "quadriceps",
    "quads",
    "vastus lateralis",
    "front thigh",
    "cuisse avant",
    "exterieur cuisse"
  ]),
  "cuisses-internes": Object.freeze([
    "cuisses-internes",
    "cuisses internes",
    "ischios",
    "isquios",
    "ischio-jambiers",
    "ischio jambiers",
    "hamstrings",
    "adducteurs",
    "adductors",
    "abducteurs",
    "inner thigh",
    "inner thighs",
    "posterior chain",
    "psoas",
    "psoas iliaque",
    "flechisseurs-hanche",
    "flechisseurs hanche",
    "hip flexors"
  ]),
  mollets: Object.freeze([
    "mollets",
    "mollet",
    "calves",
    "calf",
    "soleus",
    "gastrocnemius",
    "cheville",
    "ankle plantar flexors"
  ]),
});

export const MUSCLE_GROUPS = Object.freeze({
  pectoraux: Object.freeze(["pectoraux"]),
  epaules: Object.freeze(["epaules"]),
  bras: Object.freeze(["biceps", "triceps", "avant-bras"]),
  dos: Object.freeze(["dos-superieur", "dos-inferieur"]),
  core: Object.freeze(["abdos-centre", "abdos-lateraux", "dos-inferieur"]),
  jambes: Object.freeze(["cuisses-externes", "cuisses-internes", "mollets", "fessiers"]),
});

export const MUSCLE_MAP = Object.freeze({
  ...Object.fromEntries(
    Object.entries(MUSCLE_ZONES).map(([zone, synonyms]) => [zone, Array.from(synonyms)])
  ),
  ...Object.fromEntries(
    Object.entries(MUSCLE_GROUPS).map(([groupId, zoneIds]) => [groupId, Array.from(zoneIds)])
  ),
});

export const EQUIP_MAP = {
  "poids-du-corps": [
    "poids-du-corps", "poids du corps", "bodyweight", "body weight", "none", "no equipment",
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

export default { TYPE_MAP, MUSCLE_MAP, MUSCLE_ZONES, MUSCLE_GROUPS, EQUIP_MAP };
