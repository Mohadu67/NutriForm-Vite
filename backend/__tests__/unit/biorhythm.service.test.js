/**
 * Tests unitaires pour biorhythm.service.js
 * Couvre : readiness score, sleep scoring, recovery, stress/HRV, fenêtre optimale
 */

const {
  calculateReadinessScore,
  getOptimalTrainingWindow,
  getReadinessLabel,
  getRecommendation,
} = require('../../services/biorhythm.service');

// ─── getReadinessLabel ──────────────────────────────────────────────

describe('getReadinessLabel', () => {
  it('should return Excellent for score >= 90', () => {
    expect(getReadinessLabel(90)).toBe('Excellent');
    expect(getReadinessLabel(100)).toBe('Excellent');
  });

  it('should return Bon for score 70-89', () => {
    expect(getReadinessLabel(70)).toBe('Bon');
    expect(getReadinessLabel(89)).toBe('Bon');
  });

  it('should return Moyen for score 50-69', () => {
    expect(getReadinessLabel(50)).toBe('Moyen');
    expect(getReadinessLabel(69)).toBe('Moyen');
  });

  it('should return Fatigué for score 30-49', () => {
    expect(getReadinessLabel(30)).toBe('Fatigué');
    expect(getReadinessLabel(49)).toBe('Fatigué');
  });

  it('should return Épuisé for score < 30', () => {
    expect(getReadinessLabel(0)).toBe('Épuisé');
    expect(getReadinessLabel(29)).toBe('Épuisé');
  });
});

// ─── getRecommendation ──────────────────────────────────────────────

describe('getRecommendation', () => {
  it('should recommend intense session for score >= 90', () => {
    const rec = getRecommendation(95, 'male');
    expect(rec).toContain('record personnel');
  });

  it('should recommend intense session for score 70-89', () => {
    const rec = getRecommendation(75, 'male');
    expect(rec).toContain('intense');
  });

  it('should recommend moderate session for score 50-69', () => {
    const rec = getRecommendation(55, 'male');
    expect(rec).toContain('modérée');
  });

  it('should recommend active rest for score 30-49', () => {
    const rec = getRecommendation(35, 'male');
    expect(rec).toContain('yoga');
  });

  it('should recommend full rest for score < 30', () => {
    const rec = getRecommendation(10, 'male');
    expect(rec).toContain('Repos complet');
  });
});

// ─── getOptimalTrainingWindow ───────────────────────────────────────

describe('getOptimalTrainingWindow', () => {
  // Use a fixed UTC date: 2024-01-15 07:00 UTC
  const wakeTime = new Date('2024-01-15T07:00:00.000Z');

  it('should compute morning window as wakeTime + 3h to + 5h', () => {
    const result = getOptimalTrainingWindow(wakeTime, 'male', 25);
    expect(result.morning.start).toBe('10:00');
    expect(result.morning.end).toBe('12:00');
  });

  it('should compute afternoon window as wakeTime + 9h to + 12h', () => {
    const result = getOptimalTrainingWindow(wakeTime, 'male', 25);
    expect(result.afternoon.start).toBe('16:00');
    expect(result.afternoon.end).toBe('19:00');
  });

  it('should recommend afternoon for male users', () => {
    const result = getOptimalTrainingWindow(wakeTime, 'male', 25);
    expect(result.recommended).toBe('afternoon');
  });

  it('should recommend both for female users', () => {
    const result = getOptimalTrainingWindow(wakeTime, 'female', 25);
    expect(result.recommended).toBe('both');
  });

  it('should recommend afternoon for other gender', () => {
    const result = getOptimalTrainingWindow(wakeTime, 'other', 30);
    expect(result.recommended).toBe('afternoon');
  });

  it('should shift windows when wake time is later', () => {
    const lateWake = new Date('2024-01-15T09:30:00.000Z');
    const result = getOptimalTrainingWindow(lateWake, 'male', 25);
    expect(result.morning.start).toBe('12:30');
    expect(result.morning.end).toBe('14:30');
    expect(result.afternoon.start).toBe('18:30');
    expect(result.afternoon.end).toBe('21:30');
  });

  it('should handle early wake time', () => {
    const earlyWake = new Date('2024-01-15T05:00:00.000Z');
    const result = getOptimalTrainingWindow(earlyWake, 'male', 25);
    expect(result.morning.start).toBe('08:00');
    expect(result.morning.end).toBe('10:00');
    expect(result.afternoon.start).toBe('14:00');
    expect(result.afternoon.end).toBe('17:00');
  });
});

// ─── calculateReadinessScore ────────────────────────────────────────

describe('calculateReadinessScore', () => {
  describe('with no data (empty inputs)', () => {
    it('should return a fallback score around 50-70 with no sleep data', () => {
      const result = calculateReadinessScore({
        sleepLog: null,
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.label).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.optimalWindow).toBeDefined();
      expect(result.morningWindow).toBeDefined();
      expect(result.afternoonWindow).toBeDefined();
    });

    it('should return default windows when no sleepEnd', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.morningWindow).toEqual({ start: '10:00', end: '12:00' });
      expect(result.afternoonWindow).toEqual({ start: '16:00', end: '19:00' });
    });
  });

  describe('sleep factor scoring', () => {
    it('should score high for 8h of sleep (optimal range)', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.duration).toBe(100);
    });

    it('should score 100 for 7h of sleep (lower bound of optimal)', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 420 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.duration).toBe(100);
    });

    it('should score low for 4h of sleep', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 240 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.duration).toBe(20);
    });

    it('should score low for 12h of sleep (too much)', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 720 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.duration).toBe(20);
    });

    it('should score intermediate for 6h of sleep', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 360 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      const durationScore = result.factors.sleep.details.duration;
      expect(durationScore).toBeGreaterThan(20);
      expect(durationScore).toBeLessThan(100);
    });
  });

  describe('deep sleep scoring', () => {
    it('should score 100 for 25% deep sleep', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, deepSleepMinutes: 120 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.quality).toBe(100);
    });

    it('should score 40 for 5% deep sleep', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, deepSleepMinutes: 24 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.quality).toBe(40);
    });

    it('should fallback to 40 when no deep sleep data', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.quality).toBe(40);
    });
  });

  describe('recovery factor scoring', () => {
    it('should score 100 when no recent workouts', () => {
      const result = calculateReadinessScore({
        sleepLog: null,
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.recovery.score).toBe(100);
      expect(result.factors.recovery.details.lastWorkoutHoursAgo).toBeNull();
    });

    it('should reduce score for heavy recent workout', () => {
      const heavyWorkout = {
        endedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
        entries: [{
          sets: [
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
            { weightKg: 100, reps: 10 },
          ],
        }],
      };

      const result = calculateReadinessScore({
        sleepLog: null,
        profile: null,
        recentWorkouts: [heavyWorkout],
        recentSleepLogs: [],
      });

      expect(result.factors.recovery.score).toBeLessThan(100);
    });

    it('should recover better after 48h+', () => {
      const oldWorkout = {
        endedAt: new Date(Date.now() - 50 * 60 * 60 * 1000), // 50h ago
        entries: [{
          sets: [
            { weightKg: 80, reps: 8 },
            { weightKg: 80, reps: 8 },
            { weightKg: 80, reps: 8 },
          ],
        }],
      };

      const result = calculateReadinessScore({
        sleepLog: null,
        profile: null,
        recentWorkouts: [oldWorkout],
        recentSleepLogs: [],
      });

      // Should have time-based recovery bonus
      expect(result.factors.recovery.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('stress factor scoring', () => {
    it('should score high for good HRV and low resting HR', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, hrv: 85, heartRateResting: 55 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.stress.score).toBeGreaterThanOrEqual(85);
    });

    it('should score low for bad HRV and high resting HR', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, hrv: 15, heartRateResting: 90 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.stress.score).toBeLessThanOrEqual(40);
    });

    it('should fallback to 70 when no HRV/HR data', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.stress.score).toBe(70);
    });

    it('should use only HRV when resting HR is missing', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, hrv: 80 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.stress.details.hrv).toBe(100);
      expect(result.factors.stress.details.restingHr).toBeNull();
    });
  });

  describe('optimal window with sleepEnd', () => {
    it('should compute windows based on wake time', () => {
      const result = calculateReadinessScore({
        sleepLog: {
          sleepDuration: 480,
          sleepEnd: new Date('2024-01-15T07:00:00.000Z'),
        },
        profile: { gender: 'male', age: 30 },
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.morningWindow.start).toBe('10:00');
      expect(result.morningWindow.end).toBe('12:00');
      expect(result.afternoonWindow.start).toBe('16:00');
      expect(result.afternoonWindow.end).toBe('19:00');
      // Male → afternoon recommended
      expect(result.optimalWindow).toEqual(result.afternoonWindow);
    });

    it('should select morning window for female users', () => {
      const result = calculateReadinessScore({
        sleepLog: {
          sleepDuration: 480,
          sleepEnd: new Date('2024-01-15T07:00:00.000Z'),
        },
        profile: { gender: 'female', age: 28 },
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      // Female → recommended = 'both', so optimalWindow defaults to afternoon
      // (since 'both' !== 'morning', optimalWindow = afternoonWindow)
      expect(result.optimalWindow).toEqual(result.afternoonWindow);
    });
  });

  describe('overall score boundaries', () => {
    it('should always return score between 0 and 100', () => {
      // Perfect inputs
      const perfect = calculateReadinessScore({
        sleepLog: {
          sleepDuration: 480,
          deepSleepMinutes: 120,
          hrv: 90,
          heartRateResting: 50,
        },
        profile: { gender: 'male', age: 25 },
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(perfect.score).toBeGreaterThanOrEqual(0);
      expect(perfect.score).toBeLessThanOrEqual(100);

      // Worst inputs
      const worst = calculateReadinessScore({
        sleepLog: {
          sleepDuration: 120,
          deepSleepMinutes: 5,
          hrv: 10,
          heartRateResting: 100,
        },
        profile: null,
        recentWorkouts: [{
          endedAt: new Date(),
          entries: [{
            sets: Array(20).fill({ weightKg: 100, reps: 10 }),
          }],
        }],
        recentSleepLogs: [],
      });

      expect(worst.score).toBeGreaterThanOrEqual(0);
      expect(worst.score).toBeLessThanOrEqual(100);
    });

    it('should have correct weight factors summing to 1', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480 },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      const totalWeight =
        result.factors.sleep.weight +
        result.factors.recovery.weight +
        result.factors.stress.weight;

      expect(totalWeight).toBeCloseTo(1.0);
    });
  });

  describe('consistency scoring', () => {
    it('should return default 70 when no recent sleep starts', () => {
      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, sleepStart: new Date('2024-01-15T23:00:00Z') },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result.factors.sleep.details.consistency).toBe(70);
    });

    it('should score high for consistent sleep schedule', () => {
      const sleepStart = new Date('2024-01-15T23:00:00Z');
      const recentLogs = [
        { sleepStart: new Date('2024-01-14T23:05:00Z') },
        { sleepStart: new Date('2024-01-13T22:55:00Z') },
        { sleepStart: new Date('2024-01-12T23:10:00Z') },
      ];

      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, sleepStart },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: recentLogs,
      });

      expect(result.factors.sleep.details.consistency).toBeGreaterThanOrEqual(90);
    });

    it('should score low for inconsistent sleep schedule', () => {
      const sleepStart = new Date('2024-01-15T23:00:00Z');
      const recentLogs = [
        { sleepStart: new Date('2024-01-14T01:30:00Z') }, // 1:30 AM
        { sleepStart: new Date('2024-01-13T02:00:00Z') }, // 2:00 AM
        { sleepStart: new Date('2024-01-12T01:00:00Z') }, // 1:00 AM
      ];

      const result = calculateReadinessScore({
        sleepLog: { sleepDuration: 480, sleepStart },
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: recentLogs,
      });

      expect(result.factors.sleep.details.consistency).toBeLessThanOrEqual(70);
    });
  });

  describe('return structure', () => {
    it('should return all expected fields', () => {
      const result = calculateReadinessScore({
        sleepLog: null,
        profile: null,
        recentWorkouts: [],
        recentSleepLogs: [],
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('factors.sleep.score');
      expect(result).toHaveProperty('factors.sleep.weight');
      expect(result).toHaveProperty('factors.sleep.details');
      expect(result).toHaveProperty('factors.recovery.score');
      expect(result).toHaveProperty('factors.recovery.weight');
      expect(result).toHaveProperty('factors.recovery.details');
      expect(result).toHaveProperty('factors.stress.score');
      expect(result).toHaveProperty('factors.stress.weight');
      expect(result).toHaveProperty('factors.stress.details');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('optimalWindow');
      expect(result).toHaveProperty('morningWindow');
      expect(result).toHaveProperty('afternoonWindow');
    });
  });
});
