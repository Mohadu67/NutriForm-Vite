import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  getDifficultyClass,
  getCycleTypeLabel,
  getProgramTypeLabel,
  formatCycleDuration,
  calculateTotalDuration,
  isMongoId,
  getCycleBadgeClass
} from '../../utils/programUtils';

describe('programUtils', () => {
  describe('formatDuration', () => {
    it('returns 0s for 0 seconds', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('returns 0s for null', () => {
      expect(formatDuration(null)).toBe('0s');
    });

    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes only', () => {
      expect(formatDuration(120)).toBe('2 min');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(150)).toBe('2:30 min');
    });

    it('pads seconds with zero', () => {
      expect(formatDuration(65)).toBe('1:05 min');
    });
  });

  describe('getDifficultyClass', () => {
    it('returns easy for débutant', () => {
      expect(getDifficultyClass('débutant')).toBe('easy');
    });

    it('returns medium for intermédiaire', () => {
      expect(getDifficultyClass('intermédiaire')).toBe('medium');
    });

    it('returns hard for avancé', () => {
      expect(getDifficultyClass('avancé')).toBe('hard');
    });

    it('returns empty string for unknown', () => {
      expect(getDifficultyClass('unknown')).toBe('');
    });
  });

  describe('getCycleTypeLabel', () => {
    it('returns Exercice for exercise', () => {
      expect(getCycleTypeLabel('exercise')).toBe('Exercice');
    });

    it('returns Repos for rest', () => {
      expect(getCycleTypeLabel('rest')).toBe('Repos');
    });

    it('returns Transition for transition', () => {
      expect(getCycleTypeLabel('transition')).toBe('Transition');
    });

    it('returns original for unknown type', () => {
      expect(getCycleTypeLabel('custom')).toBe('custom');
    });
  });

  describe('getProgramTypeLabel', () => {
    it('returns HIIT for hiit', () => {
      expect(getProgramTypeLabel('hiit')).toBe('HIIT');
    });

    it('returns Circuit for circuit', () => {
      expect(getProgramTypeLabel('circuit')).toBe('Circuit');
    });

    it('returns Tabata for tabata', () => {
      expect(getProgramTypeLabel('tabata')).toBe('Tabata');
    });

    it('returns original for unknown type', () => {
      expect(getProgramTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('formatCycleDuration', () => {
    it('formats exercise with durationMin', () => {
      expect(formatCycleDuration({ type: 'exercise', durationMin: 5 })).toBe('5 min');
    });

    it('formats exercise with durationSec (minutes)', () => {
      expect(formatCycleDuration({ type: 'exercise', durationSec: 90 })).toBe('1:30 min');
    });

    it('formats exercise with durationSec (seconds only)', () => {
      expect(formatCycleDuration({ type: 'exercise', durationSec: 45 })).toBe('45s');
    });

    it('formats exercise with reps', () => {
      expect(formatCycleDuration({ type: 'exercise', reps: 10 })).toBe('10 reps');
    });

    it('formats rest with restSec', () => {
      expect(formatCycleDuration({ type: 'rest', restSec: 30 })).toBe('30s');
    });

    it('returns dash for unknown', () => {
      expect(formatCycleDuration({ type: 'unknown' })).toBe('-');
    });
  });

  describe('calculateTotalDuration', () => {
    it('returns 0 for empty array', () => {
      expect(calculateTotalDuration([])).toBe(0);
    });

    it('returns 0 for null', () => {
      expect(calculateTotalDuration(null)).toBe(0);
    });

    it('calculates exercise duration in seconds', () => {
      const cycles = [{ type: 'exercise', durationSec: 30 }];
      expect(calculateTotalDuration(cycles)).toBe(30);
    });

    it('calculates exercise duration in minutes', () => {
      const cycles = [{ type: 'exercise', durationMin: 2 }];
      expect(calculateTotalDuration(cycles)).toBe(120);
    });

    it('calculates rest duration', () => {
      const cycles = [{ type: 'rest', restSec: 15 }];
      expect(calculateTotalDuration(cycles)).toBe(15);
    });

    it('calculates with repeat', () => {
      const cycles = [{ type: 'exercise', durationSec: 30, repeat: 3 }];
      expect(calculateTotalDuration(cycles)).toBe(90);
    });

    it('calculates mixed cycles', () => {
      const cycles = [
        { type: 'exercise', durationSec: 30 },
        { type: 'rest', restSec: 10 },
        { type: 'exercise', durationSec: 30 }
      ];
      expect(calculateTotalDuration(cycles)).toBe(70);
    });
  });

  describe('isMongoId', () => {
    it('returns true for valid 24 char hex', () => {
      expect(isMongoId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('returns false for invalid length', () => {
      expect(isMongoId('507f1f77bcf86cd79943901')).toBe(false);
    });

    it('returns false for non-hex characters', () => {
      expect(isMongoId('507f1f77bcf86cd79943901g')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isMongoId('')).toBe(false);
    });
  });

  describe('getCycleBadgeClass', () => {
    it('returns exerciseBadge for exercise', () => {
      expect(getCycleBadgeClass('exercise')).toBe('exerciseBadge');
    });

    it('returns restBadge for rest', () => {
      expect(getCycleBadgeClass('rest')).toBe('restBadge');
    });

    it('returns transitionBadge for transition', () => {
      expect(getCycleBadgeClass('transition')).toBe('transitionBadge');
    });

    it('returns empty string for unknown', () => {
      expect(getCycleBadgeClass('unknown')).toBe('');
    });
  });
});
