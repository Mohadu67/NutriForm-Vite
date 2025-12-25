// Definitions des zones musculaires avec leurs paths SVG
// Chaque zone a un id, un label, et les paths SVG correspondants

export const MUSCLE_ZONES = [
  { id: 'pectoraux', label: 'Pectoraux' },
  { id: 'epaules', label: 'Épaules' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'avant-bras', label: 'Avant-bras' },
  { id: 'abdos-centre', label: 'Abdos (milieu)' },
  { id: 'abdos-lateraux', label: 'Abdos (latéraux)' },
  { id: 'dos-superieur', label: 'Dos (haut)' },
  { id: 'dos-inferieur', label: 'Dos (bas)' },
  { id: 'fessiers', label: 'Fessiers' },
  { id: 'cuisses-externes', label: 'Cuisses externes' },
  { id: 'cuisses-internes', label: 'Cuisses internes' },
  { id: 'mollets', label: 'Mollets' },
];

export const ZONE_LABELS = MUSCLE_ZONES.reduce((acc, zone) => {
  acc[zone.id] = zone.label;
  return acc;
}, {});

export const ZONE_IDS = MUSCLE_ZONES.map(z => z.id);

// Mapping des IDs SVG vers les zones musculaires
export const SVG_TO_ZONE_MAP = {
  // Pectoraux
  'chest': 'pectoraux',
  'pec': 'pectoraux',
  'pecs': 'pectoraux',
  'pectoraux': 'pectoraux',
  'thorax': 'pectoraux',

  // Epaules
  'shoulder': 'epaules',
  'shoulders': 'epaules',
  'epaule': 'epaules',
  'epaules': 'epaules',
  'deltoid': 'epaules',
  'delto': 'epaules',

  // Biceps
  'bicep': 'biceps',
  'biceps': 'biceps',

  // Triceps
  'tricep': 'triceps',
  'triceps': 'triceps',

  // Avant-bras
  'forearm': 'avant-bras',
  'forearms': 'avant-bras',
  'avant-bras': 'avant-bras',
  'wrist': 'avant-bras',

  // Abdos centre
  'abs': 'abdos-centre',
  'abdo': 'abdos-centre',
  'abdos': 'abdos-centre',
  'abdos-centre': 'abdos-centre',
  'rectus': 'abdos-centre',

  // Abdos lateraux
  'oblique': 'abdos-lateraux',
  'obliques': 'abdos-lateraux',
  'abdos-lateraux': 'abdos-lateraux',

  // Dos superieur
  'upper-back': 'dos-superieur',
  'upperback': 'dos-superieur',
  'dos-superieur': 'dos-superieur',
  'traps': 'dos-superieur',
  'trapeze': 'dos-superieur',

  // Dos inferieur
  'lower-back': 'dos-inferieur',
  'lowerback': 'dos-inferieur',
  'dos-inferieur': 'dos-inferieur',
  'lombaire': 'dos-inferieur',
  'lats': 'dos-inferieur',

  // Fessiers
  'glute': 'fessiers',
  'glutes': 'fessiers',
  'fessiers': 'fessiers',
  'fess': 'fessiers',

  // Cuisses externes (quadriceps)
  'quad': 'cuisses-externes',
  'quadriceps': 'cuisses-externes',
  'cuisses-externes': 'cuisses-externes',
  'cuisse': 'cuisses-externes',

  // Cuisses internes (ischio-jambiers)
  'hamstring': 'cuisses-internes',
  'hamstrings': 'cuisses-internes',
  'ischio': 'cuisses-internes',
  'cuisses-internes': 'cuisses-internes',

  // Mollets
  'calf': 'mollets',
  'calves': 'mollets',
  'mollet': 'mollets',
  'mollets': 'mollets',
};

// Couleurs pour les zones
export const ZONE_COLORS = {
  default: '#E8E8E8',
  hover: '#FFD4B8',
  active: '#F7B186',
  activeStroke: '#E5954F',
};
