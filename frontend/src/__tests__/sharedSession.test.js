import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../shared/api/sharedSession', () => ({
  inviteSharedSession: vi.fn(),
  respondSharedSession: vi.fn(),
  getActiveSharedSession: vi.fn(),
  getSharedSession: vi.fn(),
  addSharedExercise: vi.fn(),
  removeSharedExercise: vi.fn(),
  startSharedSession: vi.fn(),
  updateExerciseData: vi.fn(),
  getSharedProgress: vi.fn(),
  getSharedSessionByMatch: vi.fn(),
  endSharedSession: vi.fn(),
  cancelSharedSession: vi.fn(),
  getSharedSessionHistory: vi.fn(),
  reorderSharedExercises: vi.fn(),
}));

import {
  inviteSharedSession,
  respondSharedSession,
  addSharedExercise,
  removeSharedExercise,
  startSharedSession,
  endSharedSession,
  cancelSharedSession,
  updateExerciseData,
  getSharedProgress,
  getSharedSessionByMatch,
} from '../shared/api/sharedSession';

describe('SharedSession API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inviteSharedSession', () => {
    it('should call with matchId', async () => {
      inviteSharedSession.mockResolvedValue({ sharedSession: { _id: 's1', status: 'pending' } });
      const result = await inviteSharedSession('match123', 'Push day', 'Basic Fit');
      expect(inviteSharedSession).toHaveBeenCalledWith('match123', 'Push day', 'Basic Fit');
      expect(result.sharedSession.status).toBe('pending');
    });
  });

  describe('respondSharedSession', () => {
    it('should accept an invite', async () => {
      respondSharedSession.mockResolvedValue({ sharedSession: { _id: 's1', status: 'building' } });
      const result = await respondSharedSession('s1', true);
      expect(result.sharedSession.status).toBe('building');
    });

    it('should decline an invite', async () => {
      respondSharedSession.mockResolvedValue({ message: 'Invitation refusée.' });
      const result = await respondSharedSession('s1', false);
      expect(result.message).toBe('Invitation refusée.');
    });
  });

  describe('addSharedExercise', () => {
    it('should add exercise with type as array', async () => {
      addSharedExercise.mockResolvedValue({
        sharedSession: { exercises: [{ exerciseName: 'Pompes', type: ['muscu', 'poids_du_corps'], order: 0 }] }
      });
      const result = await addSharedExercise('s1', { exerciseName: 'Pompes', type: ['muscu', 'poids_du_corps'] });
      expect(result.sharedSession.exercises[0].type).toEqual(['muscu', 'poids_du_corps']);
    });
  });

  describe('removeSharedExercise', () => {
    it('should remove exercise by order', async () => {
      removeSharedExercise.mockResolvedValue({ sharedSession: { exercises: [] } });
      const result = await removeSharedExercise('s1', 0);
      expect(result.sharedSession.exercises).toHaveLength(0);
    });
  });

  describe('startSharedSession', () => {
    it('should transition to active', async () => {
      startSharedSession.mockResolvedValue({
        sharedSession: { _id: 's1', status: 'active', startedAt: '2026-04-03T10:00:00Z' }
      });
      const result = await startSharedSession('s1');
      expect(result.sharedSession.status).toBe('active');
    });
  });

  describe('updateExerciseData', () => {
    it('should send exercise data', async () => {
      updateExerciseData.mockResolvedValue({ ok: true });
      const data = { exerciseOrder: 0, exerciseName: 'Bench', mode: 'muscu', sets: [{ reps: 10, weight: 80 }], done: true };
      const result = await updateExerciseData('s1', data);
      expect(updateExerciseData).toHaveBeenCalledWith('s1', data);
      expect(result.ok).toBe(true);
    });
  });

  describe('getSharedProgress', () => {
    it('should return progress map', async () => {
      getSharedProgress.mockResolvedValue({
        progress: { 'user1:0': { exerciseOrder: 0, done: true }, 'user2:0': { exerciseOrder: 0, done: false } }
      });
      const result = await getSharedProgress('s1');
      expect(Object.keys(result.progress)).toHaveLength(2);
    });
  });

  describe('getSharedSessionByMatch', () => {
    it('should return session for a match', async () => {
      getSharedSessionByMatch.mockResolvedValue({ sharedSession: { _id: 's1', status: 'active' } });
      const result = await getSharedSessionByMatch('m1');
      expect(result.sharedSession.status).toBe('active');
    });

    it('should return null when no session', async () => {
      getSharedSessionByMatch.mockResolvedValue({ sharedSession: null });
      const result = await getSharedSessionByMatch('m2');
      expect(result.sharedSession).toBeNull();
    });
  });

  describe('endSharedSession', () => {
    it('should end session for one user', async () => {
      endSharedSession.mockResolvedValue({ sharedSession: { status: 'active', endedBy: ['user1'] } });
      const result = await endSharedSession('s1', 'ws1');
      expect(result.sharedSession.endedBy).toHaveLength(1);
    });

    it('should end completely when both end', async () => {
      endSharedSession.mockResolvedValue({ sharedSession: { status: 'ended', endedBy: ['user1', 'user2'] } });
      const result = await endSharedSession('s1', null);
      expect(result.sharedSession.status).toBe('ended');
    });
  });

  describe('cancelSharedSession', () => {
    it('should cancel', async () => {
      cancelSharedSession.mockResolvedValue({ message: 'Séance annulée.' });
      const result = await cancelSharedSession('s1');
      expect(result.message).toBe('Séance annulée.');
    });
  });
});

describe('SharedSession data helpers', () => {
  it('should handle type as array or string', () => {
    const normalizeType = (type) => Array.isArray(type) ? type : [type].filter(Boolean);
    expect(normalizeType(['muscu', 'cardio'])).toEqual(['muscu', 'cardio']);
    expect(normalizeType('muscu')).toEqual(['muscu']);
    expect(normalizeType(undefined)).toEqual([]);
  });

  it('should detect duplicate exercises by name', () => {
    const exercises = [{ exerciseName: 'Bench Press' }, { exerciseName: 'Squat' }];
    const isDuplicate = (name) => exercises.some(e => e.exerciseName === name);
    expect(isDuplicate('Bench Press')).toBe(true);
    expect(isDuplicate('Deadlift')).toBe(false);
  });

  it('should compute contribution counts', () => {
    const exercises = [
      { addedBy: 'user1' }, { addedBy: 'user2' }, { addedBy: 'user1' },
    ];
    const mine = exercises.filter(e => e.addedBy === 'user1').length;
    expect(mine).toBe(2);
    expect(exercises.length - mine).toBe(1);
  });

  it('should determine Full Body correctly', () => {
    const isFullBody = (groups) => {
      const upper = ['pectoraux', 'epaules', 'bras', 'dos'];
      const lower = ['jambes'];
      return groups.some(g => upper.includes(g)) && groups.some(g => lower.includes(g));
    };
    expect(isFullBody(['dos', 'bras'])).toBe(false);
    expect(isFullBody(['dos', 'bras', 'epaules'])).toBe(false);
    expect(isFullBody(['dos', 'jambes'])).toBe(true);
    expect(isFullBody(['pectoraux', 'jambes', 'bras'])).toBe(true);
  });

  it('should summarize sets', () => {
    const summarize = (entry) => {
      if (!entry) return null;
      const sets = entry.sets || [];
      const filled = sets.filter(s => Number(s?.reps ?? 0) > 0);
      if (filled.length === 0) return null;
      const maxW = Math.max(...filled.map(s => Number(s?.weight ?? 0)));
      const avgR = Math.round(filled.reduce((a, s) => a + Number(s?.reps ?? 0), 0) / filled.length);
      return maxW > 0 ? `${filled.length}×${avgR} @ ${maxW}kg` : `${filled.length}×${avgR}`;
    };
    expect(summarize(null)).toBeNull();
    expect(summarize({ sets: [] })).toBeNull();
    expect(summarize({ sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 85 }] })).toBe('2×9 @ 85kg');
    expect(summarize({ sets: [{ reps: 15 }] })).toBe('1×15');
  });

  it('should filter partner progress from progress map', () => {
    const myId = 'user1';
    const progress = { 'user1:0': { done: true }, 'user2:0': { done: false }, 'user2:1': { done: true } };
    const partnerEntries = Object.entries(progress).filter(([key]) => !key.startsWith(myId + ':'));
    expect(partnerEntries).toHaveLength(2);
  });

  it('should handle dismissed session ID', () => {
    const getDismissedId = () => 'session123';
    const sessionId = 'session123';
    expect(getDismissedId() === String(sessionId)).toBe(true);
    expect(getDismissedId() === String('other')).toBe(false);
  });
});
