/**
 * Tests unitaires pour l'algorithme de matching
 */

const {
  calculateMatchScore,
  calculateProximityScore,
  calculateWorkoutTypeScore,
  calculateFitnessLevelScore,
  calculateAvailabilityScore
} = require('../../services/matchingAlgorithm.service');

// Mock profiles pour les tests
const createMockProfile = (overrides = {}) => ({
  fitnessLevel: 'intermediate',
  workoutTypes: ['musculation', 'cardio'],
  location: {
    coordinates: [2.3522, 48.8566], // Paris
    neighborhood: null // Pas de quartier par defaut
  },
  availability: {
    monday: ['morning', 'evening'],
    wednesday: ['morning'],
    friday: ['evening']
  },
  matchPreferences: {
    preferredWorkoutTypes: [],
    preferredFitnessLevels: [],
    maxDistance: 10
  },
  distanceTo: jest.fn().mockReturnValue(5), // 5km par defaut
  hasCommonAvailability: jest.fn().mockReturnValue(true),
  ...overrides
});

describe('Matching Algorithm Service', () => {
  describe('calculateProximityScore', () => {
    it('should return 40 points for hyper-local (< 0.5km)', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(0.3);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(40);
    });

    it('should return 35 points for < 1km', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(0.8);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(35);
    });

    it('should return 20 points for 2-5km', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(4);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(20);
    });

    it('should return 10 points for 5-10km', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(8);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(10);
    });

    it('should return 5 points for 10-20km', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(15);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(5);
    });

    it('should return 0 points for > 20km', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(25);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(0);
    });

    it('should add bonus for same neighborhood (capped at 40)', () => {
      const profile1 = createMockProfile({
        location: { neighborhood: 'Marais' }
      });
      const profile2 = createMockProfile({
        location: { neighborhood: 'Marais' }
      });
      // Distance 2km = 30 points, + 10 bonus = 40 (capped)
      profile1.distanceTo = jest.fn().mockReturnValue(1.5);

      const score = calculateProximityScore(profile1, profile2);
      expect(score).toBe(40); // 30 (< 2km) + 10 bonus = 40 (capped)
    });
  });

  describe('calculateWorkoutTypeScore', () => {
    it('should return 25 points for perfect match', () => {
      const profile1 = createMockProfile({
        workoutTypes: ['musculation', 'cardio'],
        matchPreferences: { preferredWorkoutTypes: ['musculation', 'cardio'] }
      });
      const profile2 = createMockProfile({
        workoutTypes: ['musculation', 'cardio']
      });

      const score = calculateWorkoutTypeScore(profile1, profile2);
      expect(score).toBe(25);
    });

    it('should return partial score for partial match', () => {
      const profile1 = createMockProfile({
        workoutTypes: ['musculation', 'cardio'],
        matchPreferences: { preferredWorkoutTypes: [] }
      });
      const profile2 = createMockProfile({
        workoutTypes: ['musculation', 'yoga']
      });

      const score = calculateWorkoutTypeScore(profile1, profile2);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(25);
    });

    it('should return 0 for no common types', () => {
      const profile1 = createMockProfile({
        workoutTypes: ['musculation'],
        matchPreferences: { preferredWorkoutTypes: [] }
      });
      const profile2 = createMockProfile({
        workoutTypes: ['yoga']
      });

      const score = calculateWorkoutTypeScore(profile1, profile2);
      expect(score).toBe(0);
    });
  });

  describe('calculateFitnessLevelScore', () => {
    it('should return 20 points for same level', () => {
      const profile1 = createMockProfile({
        fitnessLevel: 'intermediate',
        matchPreferences: { preferredFitnessLevels: ['intermediate'] }
      });
      const profile2 = createMockProfile({
        fitnessLevel: 'intermediate'
      });

      const score = calculateFitnessLevelScore(profile1, profile2);
      expect(score).toBe(20);
    });

    it('should return 15 points for adjacent level', () => {
      const profile1 = createMockProfile({
        fitnessLevel: 'intermediate',
        matchPreferences: { preferredFitnessLevels: [] }
      });
      const profile2 = createMockProfile({
        fitnessLevel: 'advanced'
      });

      const score = calculateFitnessLevelScore(profile1, profile2);
      expect(score).toBe(15);
    });

    it('should return 8 points for 2-level difference', () => {
      const profile1 = createMockProfile({
        fitnessLevel: 'beginner',
        matchPreferences: { preferredFitnessLevels: [] }
      });
      const profile2 = createMockProfile({
        fitnessLevel: 'advanced'
      });

      const score = calculateFitnessLevelScore(profile1, profile2);
      expect(score).toBe(8);
    });
  });

  describe('calculateAvailabilityScore', () => {
    it('should return 15 points for common availability', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.hasCommonAvailability = jest.fn().mockReturnValue(true);

      const score = calculateAvailabilityScore(profile1, profile2);
      expect(score).toBe(15);
    });

    it('should return partial score for same days different hours', () => {
      const profile1 = createMockProfile({
        availability: {
          monday: ['morning'],
          tuesday: ['evening']
        }
      });
      profile1.hasCommonAvailability = jest.fn().mockReturnValue(false);

      const profile2 = createMockProfile({
        availability: {
          monday: ['evening'],
          tuesday: ['morning']
        }
      });

      const score = calculateAvailabilityScore(profile1, profile2);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateMatchScore', () => {
    it('should return total score and breakdown', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();

      const result = calculateMatchScore(profile1, profile2);

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('proximityScore');
      expect(result.breakdown).toHaveProperty('workoutTypeScore');
      expect(result.breakdown).toHaveProperty('fitnessLevelScore');
      expect(result.breakdown).toHaveProperty('availabilityScore');
    });

    it('should have total equal to sum of breakdown', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();

      const result = calculateMatchScore(profile1, profile2);
      const sumBreakdown = Object.values(result.breakdown).reduce((a, b) => a + b, 0);

      expect(result.total).toBe(Math.round(sumBreakdown));
    });

    it('should return max 100 points', () => {
      const profile1 = createMockProfile();
      const profile2 = createMockProfile();
      profile1.distanceTo = jest.fn().mockReturnValue(0.3);

      const result = calculateMatchScore(profile1, profile2);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });
});
