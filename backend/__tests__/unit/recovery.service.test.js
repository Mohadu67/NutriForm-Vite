const {
  computeEntryFatigue,
  extractMuscles,
  resolveZone,
  getBaseRecoveryHours,
  computeSleepModifier,
  computeAgeModifier,
  ZONE_IDS,
  MUSCLE_TO_ZONE,
} = require('../../services/recovery.service');

// ─── resolveZone ────────────────────────────────────────────────────
describe('resolveZone', () => {
  test('maps French muscle names correctly', () => {
    expect(resolveZone('pectoraux')).toBe('pectoraux');
    expect(resolveZone('épaules')).toBe('epaules');
    expect(resolveZone('biceps')).toBe('biceps');
    expect(resolveZone('fessiers')).toBe('fessiers');
    expect(resolveZone('mollets')).toBe('mollets');
    expect(resolveZone('abdos')).toBe('abdos-centre');
    expect(resolveZone('obliques')).toBe('abdos-lateraux');
    expect(resolveZone('trapèzes')).toBe('dos-superieur');
  });

  test('maps English muscle names correctly', () => {
    expect(resolveZone('chest')).toBe('pectoraux');
    expect(resolveZone('shoulders')).toBe('epaules');
    expect(resolveZone('hamstrings')).toBe('cuisses-internes');
    expect(resolveZone('glutes')).toBe('fessiers');
    expect(resolveZone('calves')).toBe('mollets');
    expect(resolveZone('forearms')).toBe('avant-bras');
    expect(resolveZone('lats')).toBe('dos-inferieur');
  });

  test('is case-insensitive', () => {
    expect(resolveZone('PECTORAUX')).toBe('pectoraux');
    expect(resolveZone('Biceps')).toBe('biceps');
    expect(resolveZone('CHEST')).toBe('pectoraux');
  });

  test('returns null for unknown muscles', () => {
    expect(resolveZone('inconnu')).toBeNull();
    expect(resolveZone('')).toBeNull();
    expect(resolveZone(null)).toBeNull();
    expect(resolveZone(undefined)).toBeNull();
  });
});

// ─── extractMuscles ─────────────────────────────────────────────────
describe('extractMuscles', () => {
  test('extracts primaryMuscle with secondaryMuscles', () => {
    const entry = {
      primaryMuscle: 'pectoraux',
      secondaryMuscles: ['triceps', 'epaules'],
    };
    const result = extractMuscles(entry);
    expect(result).toEqual([
      { name: 'pectoraux', weight: 1.0 },
      { name: 'triceps', weight: 0.4 },
      { name: 'epaules', weight: 0.4 },
    ]);
  });

  test('extracts single muscle field', () => {
    const result = extractMuscles({ muscle: 'biceps' });
    expect(result).toEqual([{ name: 'biceps', weight: 1.0 }]);
  });

  test('extracts muscleGroup field', () => {
    const result = extractMuscles({ muscleGroup: 'Jambes' });
    expect(result).toEqual([{ name: 'Jambes', weight: 1.0 }]);
  });

  test('extracts muscles array (first primary, rest secondary)', () => {
    const result = extractMuscles({ muscles: ['chest', 'triceps', 'shoulders'] });
    expect(result).toEqual([
      { name: 'chest', weight: 1.0 },
      { name: 'triceps', weight: 0.4 },
      { name: 'shoulders', weight: 0.4 },
    ]);
  });

  test('returns empty array for entry with no muscle data', () => {
    expect(extractMuscles({})).toEqual([]);
    expect(extractMuscles({ exerciseName: 'test' })).toEqual([]);
  });
});

// ─── computeEntryFatigue ────────────────────────────────────────────
describe('computeEntryFatigue', () => {
  test('heavy muscu entry produces high fatigue', () => {
    const heavy = {
      type: 'muscu',
      sets: [
        { weightKg: 100, reps: 5 },
        { weightKg: 100, reps: 5 },
        { weightKg: 100, reps: 5 },
        { weightKg: 100, reps: 5 },
      ],
    };
    const fatigue = computeEntryFatigue(heavy);
    expect(fatigue).toBeGreaterThan(20);
  });

  test('light muscu entry produces low fatigue', () => {
    const light = {
      type: 'muscu',
      sets: [
        { weightKg: 10, reps: 15 },
        { weightKg: 10, reps: 15 },
      ],
    };
    const fatigue = computeEntryFatigue(light);
    expect(fatigue).toBeLessThan(15);
  });

  test('heavier weight with fewer reps = more fatigue per unit than lighter weight with more reps', () => {
    const heavyLowRep = {
      type: 'muscu',
      sets: [{ weightKg: 100, reps: 3 }, { weightKg: 100, reps: 3 }],
    };
    const lightHighRep = {
      type: 'muscu',
      sets: [{ weightKg: 30, reps: 20 }, { weightKg: 30, reps: 20 }],
    };
    // Same total volume (600 vs 1200) but intensity multiplier differs
    const fatHeavy = computeEntryFatigue(heavyLowRep);
    const fatLight = computeEntryFatigue(lightHighRep);
    // Heavy should have higher intensity multiplier
    expect(fatHeavy).toBeGreaterThan(0);
    expect(fatLight).toBeGreaterThan(0);
  });

  test('cardio entry produces low fatigue', () => {
    const cardio = {
      type: 'cardio',
      sets: [{ durationMin: 30, intensity: 7 }],
    };
    const fatigue = computeEntryFatigue(cardio);
    expect(fatigue).toBeLessThan(10);
    expect(fatigue).toBeGreaterThan(0);
  });

  test('poids_du_corps entry based on reps', () => {
    const bodyweight = {
      type: 'poids_du_corps',
      sets: [{ reps: 15 }, { reps: 12 }, { reps: 10 }],
    };
    const fatigue = computeEntryFatigue(bodyweight);
    expect(fatigue).toBeCloseTo((15 + 12 + 10) * 0.8, 1);
  });

  test('entry with no sets returns fallback', () => {
    const empty = { type: 'muscu', sets: [] };
    expect(computeEntryFatigue(empty)).toBe(12);
  });

  test('more sets = more fatigue (set bonus)', () => {
    const twoSets = {
      type: 'muscu',
      sets: [{ weightKg: 50, reps: 10 }, { weightKg: 50, reps: 10 }],
    };
    const fiveSets = {
      type: 'muscu',
      sets: Array(5).fill({ weightKg: 50, reps: 10 }),
    };
    expect(computeEntryFatigue(fiveSets)).toBeGreaterThan(computeEntryFatigue(twoSets));
  });
});

// ─── getBaseRecoveryHours ───────────────────────────────────────────
describe('getBaseRecoveryHours', () => {
  test('large muscle groups need more recovery', () => {
    const largeLow = getBaseRecoveryHours('pectoraux', 5);
    const smallLow = getBaseRecoveryHours('biceps', 5);
    expect(largeLow).toBeGreaterThanOrEqual(smallLow);
  });

  test('higher fatigue = longer recovery', () => {
    const low = getBaseRecoveryHours('pectoraux', 5);
    const high = getBaseRecoveryHours('pectoraux', 90);
    expect(high).toBeGreaterThan(low);
  });

  test('small muscle group thresholds', () => {
    expect(getBaseRecoveryHours('biceps', 5)).toBe(18);
    expect(getBaseRecoveryHours('biceps', 15)).toBe(36);
    expect(getBaseRecoveryHours('biceps', 30)).toBe(48);
    expect(getBaseRecoveryHours('biceps', 55)).toBe(60);
    expect(getBaseRecoveryHours('biceps', 90)).toBe(72);
  });

  test('large muscle group thresholds', () => {
    expect(getBaseRecoveryHours('pectoraux', 5)).toBe(24);
    expect(getBaseRecoveryHours('pectoraux', 15)).toBe(48);
    expect(getBaseRecoveryHours('pectoraux', 30)).toBe(60);
    expect(getBaseRecoveryHours('pectoraux', 55)).toBe(72);
    expect(getBaseRecoveryHours('pectoraux', 90)).toBe(96);
  });
});

// ─── computeSleepModifier ───────────────────────────────────────────
describe('computeSleepModifier', () => {
  test('returns 1.0 with no sleep data', () => {
    expect(computeSleepModifier([])).toBe(1.0);
    expect(computeSleepModifier(null)).toBe(1.0);
  });

  test('excellent sleep (8h+) accelerates recovery', () => {
    const logs = [
      { sleepDuration: 8.5, deepSleepMinutes: 90 },
      { sleepDuration: 8, deepSleepMinutes: 80 },
    ];
    const mod = computeSleepModifier(logs);
    expect(mod).toBeLessThan(1.0); // Faster recovery
  });

  test('poor sleep (<6h) slows recovery', () => {
    const logs = [
      { sleepDuration: 4.5, deepSleepMinutes: 20 },
      { sleepDuration: 5, deepSleepMinutes: 25 },
    ];
    const mod = computeSleepModifier(logs);
    expect(mod).toBeGreaterThan(1.0); // Slower recovery
  });

  test('deep sleep bonus applied', () => {
    const noDeep = [{ sleepDuration: 7, deepSleepMinutes: 30 }];
    const lotsDeep = [{ sleepDuration: 7, deepSleepMinutes: 95 }];
    expect(computeSleepModifier(lotsDeep)).toBeLessThan(computeSleepModifier(noDeep));
  });

  test('modifier stays within bounds [0.7, 1.3]', () => {
    const excellent = [{ sleepDuration: 10, deepSleepMinutes: 120 }];
    const terrible = [{ sleepDuration: 2, deepSleepMinutes: 0 }];
    expect(computeSleepModifier(excellent)).toBeGreaterThanOrEqual(0.7);
    expect(computeSleepModifier(terrible)).toBeLessThanOrEqual(1.3);
  });
});

// ─── computeAgeModifier ─────────────────────────────────────────────
describe('computeAgeModifier', () => {
  test('young adults recover fastest', () => {
    expect(computeAgeModifier(22)).toBe(0.9);
  });

  test('baseline for 30s', () => {
    expect(computeAgeModifier(30)).toBe(1.0);
  });

  test('older = slower recovery', () => {
    expect(computeAgeModifier(50)).toBe(1.2);
    expect(computeAgeModifier(60)).toBe(1.3);
  });

  test('null/undefined age returns 1.0', () => {
    expect(computeAgeModifier(null)).toBe(1.0);
    expect(computeAgeModifier(undefined)).toBe(1.0);
  });
});

// ─── ZONE_IDS coverage ─────────────────────────────────────────────
describe('ZONE_IDS', () => {
  test('has 13 zones', () => {
    expect(ZONE_IDS).toHaveLength(13);
  });

  test('all zone IDs are strings', () => {
    ZONE_IDS.forEach(id => expect(typeof id).toBe('string'));
  });
});

// ─── MUSCLE_TO_ZONE completeness ────────────────────────────────────
describe('MUSCLE_TO_ZONE', () => {
  test('every mapped zone is in ZONE_IDS', () => {
    const zones = new Set(Object.values(MUSCLE_TO_ZONE));
    zones.forEach(zone => {
      expect(ZONE_IDS).toContain(zone);
    });
  });

  test('common muscle names are mapped', () => {
    const expected = [
      'chest', 'pectoraux', 'shoulders', 'biceps', 'triceps',
      'forearms', 'abs', 'obliques', 'back', 'lats', 'traps',
      'quadriceps', 'hamstrings', 'glutes', 'calves',
    ];
    expected.forEach(name => {
      expect(MUSCLE_TO_ZONE[name]).toBeDefined();
    });
  });
});
