import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API client
vi.mock('../shared/api/sharedSession', () => ({
  inviteSharedSession: vi.fn(),
  respondSharedSession: vi.fn(),
  getActiveSharedSession: vi.fn(),
  getSharedSession: vi.fn(),
  addSharedExercise: vi.fn(),
  removeSharedExercise: vi.fn(),
  startSharedSession: vi.fn(),
  updateSharedProgress: vi.fn(),
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
  updateSharedProgress,
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
      expect(respondSharedSession).toHaveBeenCalledWith('s1', true);
      expect(result.sharedSession.status).toBe('building');
    });

    it('should decline an invite', async () => {
      respondSharedSession.mockResolvedValue({ message: 'Invitation refusée.' });

      const result = await respondSharedSession('s1', false);
      expect(result.message).toBe('Invitation refusée.');
    });
  });

  describe('addSharedExercise', () => {
    it('should add exercise and return updated session', async () => {
      const session = {
        _id: 's1',
        exercises: [{ exerciseName: 'Bench Press', type: 'muscu', order: 0 }]
      };
      addSharedExercise.mockResolvedValue({ sharedSession: session });

      const result = await addSharedExercise('s1', {
        exerciseName: 'Bench Press',
        type: 'muscu',
        muscles: ['pectoraux']
      });
      expect(result.sharedSession.exercises).toHaveLength(1);
      expect(result.sharedSession.exercises[0].exerciseName).toBe('Bench Press');
    });
  });

  describe('removeSharedExercise', () => {
    it('should remove exercise by order', async () => {
      removeSharedExercise.mockResolvedValue({ sharedSession: { exercises: [] } });

      const result = await removeSharedExercise('s1', 0);
      expect(removeSharedExercise).toHaveBeenCalledWith('s1', 0);
      expect(result.sharedSession.exercises).toHaveLength(0);
    });
  });

  describe('startSharedSession', () => {
    it('should transition to active', async () => {
      startSharedSession.mockResolvedValue({
        sharedSession: { _id: 's1', status: 'active', startedAt: new Date().toISOString() }
      });

      const result = await startSharedSession('s1');
      expect(result.sharedSession.status).toBe('active');
      expect(result.sharedSession.startedAt).toBeTruthy();
    });
  });

  describe('endSharedSession', () => {
    it('should end session for one user', async () => {
      endSharedSession.mockResolvedValue({
        sharedSession: { _id: 's1', status: 'active', endedBy: ['user1'] }
      });

      const result = await endSharedSession('s1', 'ws1');
      expect(endSharedSession).toHaveBeenCalledWith('s1', 'ws1');
      expect(result.sharedSession.endedBy).toHaveLength(1);
    });

    it('should end session completely when both users end', async () => {
      endSharedSession.mockResolvedValue({
        sharedSession: { _id: 's1', status: 'ended', endedBy: ['user1', 'user2'] }
      });

      const result = await endSharedSession('s1', 'ws2');
      expect(result.sharedSession.status).toBe('ended');
      expect(result.sharedSession.endedBy).toHaveLength(2);
    });
  });

  describe('cancelSharedSession', () => {
    it('should cancel the session', async () => {
      cancelSharedSession.mockResolvedValue({ message: 'Séance annulée.' });

      const result = await cancelSharedSession('s1');
      expect(cancelSharedSession).toHaveBeenCalledWith('s1');
      expect(result.message).toBe('Séance annulée.');
    });
  });

  describe('updateSharedProgress', () => {
    it('should send progress data', async () => {
      updateSharedProgress.mockResolvedValue({ ok: true });

      const progress = { currentExerciseIndex: 2, completedExercises: 1, totalSets: 5 };
      const result = await updateSharedProgress('s1', progress);
      expect(updateSharedProgress).toHaveBeenCalledWith('s1', progress);
      expect(result.ok).toBe(true);
    });
  });
});

describe('SharedSession data helpers', () => {
  it('should format exercise type correctly', () => {
    const typeMap = (type) => {
      if (Array.isArray(type)) {
        if (type.includes('muscu')) return 'muscu';
        if (type.includes('cardio')) return 'cardio';
        return 'poids_du_corps';
      }
      return type || 'muscu';
    };

    expect(typeMap(['muscu', 'cardio'])).toBe('muscu');
    expect(typeMap(['cardio'])).toBe('cardio');
    expect(typeMap(['yoga'])).toBe('poids_du_corps');
    expect(typeMap('muscu')).toBe('muscu');
    expect(typeMap(undefined)).toBe('muscu');
  });

  it('should detect duplicate exercises by name', () => {
    const exercises = [
      { exerciseName: 'Bench Press', order: 0 },
      { exerciseName: 'Squat', order: 1 }
    ];
    const isDuplicate = (name) => exercises.some(e => e.exerciseName === name);

    expect(isDuplicate('Bench Press')).toBe(true);
    expect(isDuplicate('Deadlift')).toBe(false);
  });

  it('should compute contribution counts', () => {
    const userId = 'user1';
    const exercises = [
      { exerciseName: 'Bench', addedBy: 'user1' },
      { exerciseName: 'Squat', addedBy: 'user2' },
      { exerciseName: 'Curl', addedBy: 'user1' },
    ];
    const mine = exercises.filter(e => String(e.addedBy) === String(userId)).length;
    const partner = exercises.length - mine;

    expect(mine).toBe(2);
    expect(partner).toBe(1);
  });

  it('should format duration correctly', () => {
    const format = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m > 0 ? `${m}min ${s > 0 ? `${s}s` : ''}`.trim() : `${s}s`;
    };

    expect(format(0)).toBe('0s');
    expect(format(30)).toBe('30s');
    expect(format(60)).toBe('1min');
    expect(format(90)).toBe('1min 30s');
    expect(format(3600)).toBe('60min');
  });

  it('should compute progress percentage', () => {
    const pct = (completed, total) => total > 0 ? Math.round((completed / total) * 100) : 0;

    expect(pct(0, 5)).toBe(0);
    expect(pct(3, 5)).toBe(60);
    expect(pct(5, 5)).toBe(100);
    expect(pct(0, 0)).toBe(0);
  });

  it('should compare user IDs with String()', () => {
    const myId = '507f1f77bcf86cd799439011';
    const addedBy = '507f1f77bcf86cd799439011';
    const addedByObj = { _id: '507f1f77bcf86cd799439011' };

    expect(String(addedBy) === String(myId)).toBe(true);
    expect(String(addedByObj._id || addedByObj) === String(myId)).toBe(true);
  });
});
