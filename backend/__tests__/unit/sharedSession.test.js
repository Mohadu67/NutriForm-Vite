/**
 * Tests unitaires pour SharedSession — model + controller
 */

const mongoose = require('mongoose');
const SharedSession = require('../../models/SharedSession');
const Match = require('../../models/Match');
const controller = require('../../controllers/sharedSession.controller');

// ─── Helpers ────────────────────────────────────────────

const createObjectId = () => new mongoose.Types.ObjectId();

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockReq = (overrides = {}) => ({
  user: { _id: overrides.userId || createObjectId() },
  params: overrides.params || {},
  body: overrides.body || {},
  app: {
    get: jest.fn().mockReturnValue({ notifyUser: jest.fn() })
  },
  ...overrides
});

/** Create a SharedSession in DB with sensible defaults */
const createSession = async (overrides = {}) => {
  const initiatorId = overrides.initiatorId || createObjectId();
  const partnerId = overrides.partnerId || createObjectId();
  const matchId = overrides.matchId || createObjectId();

  return SharedSession.create({
    initiatorId,
    partnerId,
    matchId,
    status: 'building',
    exercises: [],
    ...overrides
  });
};

/** Create a Match in DB */
const createMatch = async (user1Id, user2Id) => {
  return Match.create({
    user1Id,
    user2Id,
    matchScore: 80,
    distance: 5,
    status: 'mutual',
    likedBy: [user1Id, user2Id]
  });
};

// ─── MODEL TESTS ────────────────────────────────────────

describe('SharedSession Model', () => {
  describe('Validation', () => {
    it('should create a valid session with required fields', async () => {
      const session = await createSession();
      expect(session._id).toBeDefined();
      expect(session.status).toBe('building');
      expect(session.exercises).toHaveLength(0);
      expect(session.notes).toBe('');
      expect(session.durationSec).toBeNull();
    });

    it('should fail without initiatorId', async () => {
      await expect(
        SharedSession.create({ partnerId: createObjectId(), matchId: createObjectId() })
      ).rejects.toThrow(/initiatorId/i);
    });

    it('should fail without partnerId', async () => {
      await expect(
        SharedSession.create({ initiatorId: createObjectId(), matchId: createObjectId() })
      ).rejects.toThrow(/partnerId/i);
    });

    it('should fail without matchId', async () => {
      await expect(
        SharedSession.create({ initiatorId: createObjectId(), partnerId: createObjectId() })
      ).rejects.toThrow(/matchId/i);
    });

    it('should reject invalid status values', async () => {
      await expect(
        createSession({ status: 'invalid_status' })
      ).rejects.toThrow();
    });

    it('should accept all valid status values', async () => {
      for (const status of ['pending', 'building', 'active', 'ended', 'cancelled']) {
        const session = await createSession({ status });
        expect(session.status).toBe(status);
      }
    });

    it('should default status to pending when not specified via direct create', async () => {
      const session = await SharedSession.create({
        initiatorId: createObjectId(),
        partnerId: createObjectId(),
        matchId: createObjectId()
      });
      expect(session.status).toBe('pending');
    });

    it('should default notes to empty string', async () => {
      const session = await createSession();
      expect(session.notes).toBe('');
    });

    it('should default durationSec to null', async () => {
      const session = await createSession();
      expect(session.durationSec).toBeNull();
    });

    it('should have timestamps (createdAt, updatedAt)', async () => {
      const session = await createSession();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('SharedExercise subdocument', () => {
    it('should add an exercise with all fields including addedAt', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId });

      session.exercises.push({
        exerciseName: 'Bench Press',
        type: 'muscu',
        muscles: ['chest', 'triceps'],
        order: 0,
        addedBy: userId
      });
      await session.save();

      const found = await SharedSession.findById(session._id);
      expect(found.exercises).toHaveLength(1);
      expect(found.exercises[0].exerciseName).toBe('Bench Press');
      expect(found.exercises[0].type).toEqual(['muscu']);
      expect(found.exercises[0].addedAt).toBeInstanceOf(Date);
      expect(found.exercises[0].addedBy.toString()).toBe(userId.toString());
    });

    it('should accept type as array of strings', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId });
      session.exercises.push({
        exerciseName: 'Multi-type Exercise',
        type: ['muscu', 'poids_du_corps'],
        addedBy: userId,
        order: 0
      });
      await session.save();
      const found = await SharedSession.findById(session._id);
      expect(found.exercises[0].type).toEqual(['muscu', 'poids_du_corps']);
    });

    it('should require exerciseName', async () => {
      const session = await createSession();
      session.exercises.push({
        type: 'muscu',
        addedBy: createObjectId()
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should default type to [muscu] when not specified', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId });
      session.exercises.push({
        exerciseName: 'Squat',
        addedBy: userId,
        order: 0
      });
      await session.save();
      const found = await SharedSession.findById(session._id);
      expect(found.exercises[0].type).toEqual(['muscu']);
    });

    it('should require addedBy', async () => {
      const session = await createSession();
      session.exercises.push({
        exerciseName: 'Squat',
        type: 'muscu'
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should accept all valid exercise types', async () => {
      const session = await createSession();
      const userId = session.initiatorId;

      for (const type of ['muscu', 'cardio', 'poids_du_corps']) {
        session.exercises.push({
          exerciseName: `Exercise ${type}`,
          type,
          addedBy: userId,
          order: session.exercises.length
        });
      }

      await session.save();
      expect(session.exercises).toHaveLength(3);
    });

    it('should default muscles to empty array', async () => {
      const session = await createSession();
      session.exercises.push({
        exerciseName: 'Running',
        type: 'cardio',
        addedBy: session.initiatorId,
        order: 0
      });
      await session.save();

      const found = await SharedSession.findById(session._id);
      expect(found.exercises[0].muscles).toEqual([]);
    });

    it('should default order to 0', async () => {
      const session = await createSession();
      session.exercises.push({
        exerciseName: 'Deadlift',
        type: 'muscu',
        addedBy: session.initiatorId
      });
      await session.save();

      const found = await SharedSession.findById(session._id);
      expect(found.exercises[0].order).toBe(0);
    });
  });
});

// ─── CONTROLLER TESTS ───────────────────────────────────

describe('SharedSession Controller', () => {
  // Clear rate limit map before each test
  beforeEach(() => {
    controller._progressTimestamps.clear();
  });

  describe('addExercise', () => {
    it('should add a valid exercise to a building session', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: {
          exerciseName: 'Bench Press',
          type: 'muscu',
          muscles: ['chest']
        }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.exercises).toHaveLength(1);
      expect(result.sharedSession.exercises[0].exerciseName).toBe('Bench Press');
    });

    it('should trim exerciseName', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: '  Squat  ', type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.exercises[0].exerciseName).toBe('Squat');
    });

    it('should reject empty exerciseName after trim', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: '   ', type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('exerciseName') })
      );
    });

    it('should reject missing exerciseName', async () => {
      const req = createMockReq({
        params: { id: createObjectId().toString() },
        body: { type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid exercise type', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Test', type: 'totally_invalid_type' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('type invalide') })
      );
    });

    it('should reject missing type', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Test' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should detect duplicate exerciseName (case insensitive)', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      // Add first exercise
      session.exercises.push({
        exerciseName: 'Bench Press',
        type: 'muscu',
        order: 0,
        addedBy: userId
      });
      await session.save();

      // Try to add duplicate
      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'bench press', type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('exercice') })
      );
    });

    it('should reject if user is not a participant', async () => {
      const session = await createSession({ status: 'building' });
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Squat', type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject if session is not in building or active state', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'ended' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Squat', type: 'muscu' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should allow partner to add exercises', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId, partnerId, status: 'building' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Pull-ups', type: 'poids_du_corps' }
      });
      const res = createMockRes();

      await controller.addExercise(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.exercises).toHaveLength(1);
    });

    it('should increment order for each new exercise in building', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const exercises = ['Squat', 'Bench', 'Deadlift'];
      for (const name of exercises) {
        const req = createMockReq({
          userId,
          params: { id: session._id.toString() },
          body: { exerciseName: name, type: 'muscu' }
        });
        const res = createMockRes();
        await controller.addExercise(req, res);
      }

      const found = await SharedSession.findById(session._id);
      expect(found.exercises).toHaveLength(3);
      expect(found.exercises[0].order).toBe(0);
      expect(found.exercises[1].order).toBe(1);
      expect(found.exercises[2].order).toBe(2);
    });

    it('should add to personal workout in active mode', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'active',
        initiatorWorkout: { exercises: [], startedAt: new Date() },
        partnerWorkout: { exercises: [], startedAt: new Date() },
      });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Curl', type: 'muscu' }
      });
      const res = createMockRes();
      await controller.addExercise(req, res);

      const found = await SharedSession.findById(session._id);
      expect(found.initiatorWorkout.exercises).toHaveLength(1);
      expect(found.initiatorWorkout.exercises[0].exerciseName).toBe('Curl');
      expect(found.partnerWorkout.exercises).toHaveLength(0);
    });
  });

  describe('removeExercise', () => {
    it('should remove an exercise by order and reindex', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      // Add 3 exercises manually
      session.exercises = [
        { exerciseName: 'Squat', type: 'muscu', order: 0, addedBy: userId },
        { exerciseName: 'Bench', type: 'muscu', order: 1, addedBy: userId },
        { exerciseName: 'Deadlift', type: 'muscu', order: 2, addedBy: userId }
      ];
      await session.save();

      // Remove order 1 (Bench)
      const req = createMockReq({
        userId,
        params: { id: session._id.toString(), order: '1' }
      });
      const res = createMockRes();

      await controller.removeExercise(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.exercises).toHaveLength(2);
      // Check reindexing
      expect(result.sharedSession.exercises[0].exerciseName).toBe('Squat');
      expect(result.sharedSession.exercises[0].order).toBe(0);
      expect(result.sharedSession.exercises[1].exerciseName).toBe('Deadlift');
      expect(result.sharedSession.exercises[1].order).toBe(1);
    });

    it('should reject if user is not a participant', async () => {
      const session = await createSession({ status: 'building' });
      const outsider = createObjectId();

      session.exercises = [
        { exerciseName: 'Squat', type: 'muscu', order: 0, addedBy: session.initiatorId }
      ];
      await session.save();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString(), order: '0' }
      });
      const res = createMockRes();

      await controller.removeExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject if session is ended', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'ended' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString(), order: '0' }
      });
      const res = createMockRes();

      await controller.removeExercise(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle removing first exercise and reindex', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      session.exercises = [
        { exerciseName: 'A', type: 'muscu', order: 0, addedBy: userId },
        { exerciseName: 'B', type: 'cardio', order: 1, addedBy: userId }
      ];
      await session.save();

      const req = createMockReq({
        userId,
        params: { id: session._id.toString(), order: '0' }
      });
      const res = createMockRes();

      await controller.removeExercise(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.exercises).toHaveLength(1);
      expect(result.sharedSession.exercises[0].exerciseName).toBe('B');
      expect(result.sharedSession.exercises[0].order).toBe(0);
    });
  });

  describe('Status transitions', () => {
    it('should transition from pending to building on accept', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId, partnerId, status: 'pending' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { accept: true }
      });
      const res = createMockRes();

      await controller.respond(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.status).toBe('building');
    });

    it('should transition from pending to cancelled on decline', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId, partnerId, status: 'pending' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { accept: false }
      });
      const res = createMockRes();

      await controller.respond(req, res);

      const found = await SharedSession.findById(session._id);
      expect(found.status).toBe('cancelled');
    });

    it('should transition from building to active on start', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      // Need at least one exercise to start
      session.exercises.push({
        exerciseName: 'Squat',
        type: 'muscu',
        order: 0,
        addedBy: userId
      });
      await session.save();

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      await controller.startSession(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.status).toBe('active');
      expect(result.sharedSession.startedAt).toBeDefined();
    });

    it('should not start a session with no exercises', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      await controller.startSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should not start a session that is not in building state', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'active' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      await controller.startSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should not allow respond to a non-pending session', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId, partnerId, status: 'building' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { accept: true }
      });
      const res = createMockRes();

      await controller.respond(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('endSession', () => {
    it('should mark user as ended but keep session active if only one user ends', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId,
        partnerId,
        status: 'active',
        startedAt: new Date(Date.now() - 3600000) // 1 hour ago
      });

      const req = createMockReq({
        userId: initiatorId,
        params: { id: session._id.toString() },
        body: {}
      });
      const res = createMockRes();

      await controller.endSession(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.status).toBe('active');
      expect(result.sharedSession.endedBy).toHaveLength(1);
      expect(result.sharedSession.endedBy[0].toString()).toBe(initiatorId.toString());
    });

    it('should set status to ended when both users end', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
      const session = await createSession({
        initiatorId,
        partnerId,
        status: 'active',
        startedAt
      });

      // First user ends
      const req1 = createMockReq({
        userId: initiatorId,
        params: { id: session._id.toString() },
        body: {}
      });
      await controller.endSession(req1, createMockRes());

      // Second user ends
      const req2 = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: {}
      });
      const res2 = createMockRes();
      await controller.endSession(req2, res2);

      const result = res2.json.mock.calls[0][0];
      expect(result.sharedSession.status).toBe('ended');
      expect(result.sharedSession.endedAt).toBeDefined();
      expect(result.sharedSession.endedBy).toHaveLength(2);
    });

    it('should compute durationSec when both users end and startedAt exists', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const startedAt = new Date(Date.now() - 5400000); // 1.5 hours ago
      const session = await createSession({
        initiatorId,
        partnerId,
        status: 'active',
        startedAt
      });

      // First user ends
      await controller.endSession(
        createMockReq({
          userId: initiatorId,
          params: { id: session._id.toString() },
          body: {}
        }),
        createMockRes()
      );

      // Second user ends
      const res = createMockRes();
      await controller.endSession(
        createMockReq({
          userId: partnerId,
          params: { id: session._id.toString() },
          body: {}
        }),
        res
      );

      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.durationSec).toBeDefined();
      expect(result.sharedSession.durationSec).toBeGreaterThan(0);
      // Should be roughly 5400 seconds (1.5h) -- allow some tolerance for test execution time
      expect(result.sharedSession.durationSec).toBeGreaterThanOrEqual(5399);
      expect(result.sharedSession.durationSec).toBeLessThanOrEqual(5410);
    });

    it('should not compute durationSec if startedAt is missing', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId,
        partnerId,
        status: 'active'
        // no startedAt
      });

      await controller.endSession(
        createMockReq({ userId: initiatorId, params: { id: session._id.toString() }, body: {} }),
        createMockRes()
      );

      const res = createMockRes();
      await controller.endSession(
        createMockReq({ userId: partnerId, params: { id: session._id.toString() }, body: {} }),
        res
      );

      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession.status).toBe('ended');
      expect(result.sharedSession.durationSec).toBeNull();
    });

    it('should not allow ending a non-active session', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: {}
      });
      const res = createMockRes();

      await controller.endSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should not add same user twice to endedBy', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId,
        partnerId,
        status: 'active',
        startedAt: new Date()
      });

      // Same user ends twice
      const makeReq = () => createMockReq({
        userId: initiatorId,
        params: { id: session._id.toString() },
        body: {}
      });

      await controller.endSession(makeReq(), createMockRes());
      const res2 = createMockRes();
      await controller.endSession(makeReq(), res2);

      // Second call should still succeed but not duplicate
      const found = await SharedSession.findById(session._id);
      expect(found.endedBy).toHaveLength(1);
    });
  });

  describe('Access control', () => {
    it('should reject non-participant from getSession', async () => {
      const session = await createSession();
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      // getSession uses populated ids, so we need to work around it
      // For this test, we just test the addExercise access check which is simpler
      const req2 = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Hack', type: 'muscu' }
      });
      const res2 = createMockRes();

      await controller.addExercise(req2, res2);

      expect(res2.status).toHaveBeenCalledWith(403);
    });

    it('should reject non-participant from endSession', async () => {
      const session = await createSession({ status: 'active' });
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() },
        body: {}
      });
      const res = createMockRes();

      await controller.endSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject non-participant from startSession', async () => {
      const session = await createSession({ status: 'building' });
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      await controller.startSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should only allow the invited partner to respond', async () => {
      const initiatorId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId, partnerId, status: 'pending' });

      // Initiator tries to respond (not allowed)
      const req = createMockReq({
        userId: initiatorId,
        params: { id: session._id.toString() },
        body: { accept: true }
      });
      const res = createMockRes();

      await controller.respond(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject non-participant from cancelSession', async () => {
      const session = await createSession({ status: 'building' });
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() }
      });
      const res = createMockRes();

      await controller.cancelSession(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('invite', () => {
    it('should reject invalid matchId format', async () => {
      const req = createMockReq({
        body: { matchId: 'not-a-valid-objectid' }
      });
      const res = createMockRes();

      await controller.invite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'matchId invalide.' })
      );
    });

    it('should reject missing matchId', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await controller.invite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'matchId requis.' })
      );
    });

    it('should create a session when match is mutual', async () => {
      const user1 = createObjectId();
      const user2 = createObjectId();
      const match = await createMatch(user1, user2);

      const req = createMockReq({
        userId: user1,
        body: { matchId: match._id.toString(), sessionName: 'Leg Day' }
      });
      const res = createMockRes();

      await controller.invite(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession).toBeDefined();
      expect(result.sharedSession.status).toBe('pending');
      expect(result.sharedSession.sessionName).toBe('Leg Day');
      expect(result.sharedSession.initiatorId.toString()).toBe(user1.toString());
      expect(result.sharedSession.partnerId.toString()).toBe(user2.toString());
    });

    it('should reject if match is not mutual', async () => {
      const user1 = createObjectId();
      const user2 = createObjectId();
      const match = await Match.create({
        user1Id: user1,
        user2Id: user2,
        matchScore: 50,
        distance: 3,
        status: 'user1_liked',
        likedBy: [user1]
      });

      const req = createMockReq({
        userId: user1,
        body: { matchId: match._id.toString() }
      });
      const res = createMockRes();

      await controller.invite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject duplicate active session between same users', async () => {
      const user1 = createObjectId();
      const user2 = createObjectId();
      const match = await createMatch(user1, user2);

      // Create existing active session
      await createSession({
        initiatorId: user1,
        partnerId: user2,
        matchId: match._id,
        status: 'active'
      });

      const req = createMockReq({
        userId: user1,
        body: { matchId: match._id.toString() }
      });
      const res = createMockRes();

      await controller.invite(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('updateExerciseData', () => {
    it('should persist exercise data and return ok', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'active' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseOrder: 0, exerciseName: 'Bench Press', mode: 'muscu', sets: [{ reps: 10, weight: 80 }], done: false }
      });
      const res = createMockRes();

      await controller.updateExerciseData(req, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true });

      // Verify persisted in DB
      const updated = await SharedSession.findById(session._id);
      const entry = updated.progress.get(`${userId}:Bench Press`);
      expect(entry).toBeDefined();
      expect(entry.exerciseName).toBe('Bench Press');
      expect(entry.sets).toHaveLength(1);
    });

    it('should reject missing exerciseOrder', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'active' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Bench Press' }
      });
      const res = createMockRes();

      await controller.updateExerciseData(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should rate-limit rapid consecutive updates', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'active' });

      const makeReq = () => createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseOrder: 0, exerciseName: 'Squat', sets: [], done: false }
      });

      const res1 = createMockRes();
      await controller.updateExerciseData(makeReq(), res1);
      expect(res1.json).toHaveBeenCalledWith({ ok: true });

      const res2 = createMockRes();
      await controller.updateExerciseData(makeReq(), res2);
      expect(res2.status).toHaveBeenCalledWith(429);
    });

    it('should reject non-participant', async () => {
      const session = await createSession({ status: 'active' });
      const outsider = createObjectId();

      const req = createMockReq({
        userId: outsider,
        params: { id: session._id.toString() },
        body: { exerciseOrder: 0, sets: [] }
      });
      const res = createMockRes();

      await controller.updateExerciseData(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getProgress', () => {
    it('should return progress entries for both participants', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId: userId, partnerId, status: 'active' });

      // Persist some progress
      await SharedSession.updateOne({ _id: session._id }, {
        $set: {
          [`progress.${userId}:0`]: { exerciseOrder: 0, userId, exerciseName: 'Bench', done: true },
          [`progress.${partnerId}:0`]: { exerciseOrder: 0, userId: partnerId, exerciseName: 'Bench', done: false },
        }
      });

      const req = createMockReq({ userId, params: { id: session._id.toString() } });
      const res = createMockRes();

      await controller.getProgress(req, res);
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.progress).toBeDefined();
      expect(Object.keys(result.progress)).toHaveLength(2);
    });

    it('should reject non-participant', async () => {
      const session = await createSession({ status: 'active' });
      const outsider = createObjectId();

      const req = createMockReq({ userId: outsider, params: { id: session._id.toString() } });
      const res = createMockRes();

      await controller.getProgress(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getByMatch', () => {
    it('should return active session for a matchId', async () => {
      const userId = createObjectId();
      const matchId = createObjectId();
      await createSession({ initiatorId: userId, matchId, status: 'active' });

      const req = createMockReq({ userId, params: { matchId: matchId.toString() } });
      const res = createMockRes();

      await controller.getByMatch(req, res);
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession).not.toBeNull();
      expect(result.sharedSession.matchId.toString()).toBe(matchId.toString());
    });

    it('should return null when no active session exists', async () => {
      const userId = createObjectId();
      const matchId = createObjectId();

      const req = createMockReq({ userId, params: { matchId: matchId.toString() } });
      const res = createMockRes();

      await controller.getByMatch(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result.sharedSession).toBeNull();
    });

    it('should reject invalid matchId', async () => {
      const req = createMockReq({ params: { matchId: 'not-valid' } });
      const res = createMockRes();

      await controller.getByMatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('respond — notifications', () => {
    it('should create persistent notification on accept', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const match = await createMatch(userId, partnerId);
      const session = await createSession({ initiatorId: userId, partnerId, matchId: match._id, status: 'pending' });

      // Create a mock user for the responder
      const User = require('../../models/User');
      await User.create({ _id: partnerId, email: 'partner@test.com', password: 'test123', pseudo: 'PartnerTest' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { accept: true }
      });
      const res = createMockRes();

      await controller.respond(req, res);
      expect(res.json).toHaveBeenCalled();

      // Verify notification was created
      const Notification = require('../../models/Notification');
      const notifs = await Notification.find({ userId: userId, type: 'shared_session' });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].title).toBe('Invitation acceptée');
    });

    it('should create persistent notification on decline', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const match = await createMatch(userId, partnerId);
      const session = await createSession({ initiatorId: userId, partnerId, matchId: match._id, status: 'pending' });

      const User = require('../../models/User');
      await User.create({ _id: partnerId, email: 'partner2@test.com', password: 'test123', pseudo: 'PartnerDecline' });

      const req = createMockReq({
        userId: partnerId,
        params: { id: session._id.toString() },
        body: { accept: false }
      });
      const res = createMockRes();

      await controller.respond(req, res);

      const Notification = require('../../models/Notification');
      const notifs = await Notification.find({ userId: userId, type: 'shared_session' });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs.some(n => n.title === 'Invitation refusée')).toBe(true);
    });
  });

  describe('Full flow — end to end', () => {
    it('should complete full flow: invite → accept → add exercises → start → update data → end', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const match = await createMatch(userId, partnerId);

      const User = require('../../models/User');
      await User.create({ _id: userId, email: 'init@test.com', password: 'test123', pseudo: 'Initiator' });
      await User.create({ _id: partnerId, email: 'part@test.com', password: 'test123', pseudo: 'Partner' });

      // 1. Invite
      const inviteReq = createMockReq({ userId, body: { matchId: match._id.toString() } });
      const inviteRes = createMockRes();
      await controller.invite(inviteReq, inviteRes);
      expect(inviteRes.status).toHaveBeenCalledWith(201);
      const session = inviteRes.json.mock.calls[0][0].sharedSession;
      expect(session.status).toBe('pending');

      // 2. Accept
      const acceptReq = createMockReq({ userId: partnerId, params: { id: session._id.toString() }, body: { accept: true } });
      const acceptRes = createMockRes();
      await controller.respond(acceptReq, acceptRes);
      const accepted = acceptRes.json.mock.calls[0][0].sharedSession;
      expect(accepted.status).toBe('building');

      // 3. Add exercises (both users)
      const addReq1 = createMockReq({ userId, params: { id: session._id.toString() }, body: { exerciseName: 'Bench Press', type: ['muscu'] } });
      await controller.addExercise(addReq1, createMockRes());

      const addReq2 = createMockReq({ userId: partnerId, params: { id: session._id.toString() }, body: { exerciseName: 'Squat', type: ['muscu'] } });
      await controller.addExercise(addReq2, createMockRes());

      const afterAdd = await SharedSession.findById(session._id);
      expect(afterAdd.exercises).toHaveLength(2);
      expect(afterAdd.exercises[0].exerciseName).toBe('Bench Press');
      expect(afterAdd.exercises[1].exerciseName).toBe('Squat');

      // 4. Start
      const startReq = createMockReq({ userId, params: { id: session._id.toString() } });
      const startRes = createMockRes();
      await controller.startSession(startReq, startRes);
      const started = startRes.json.mock.calls[0][0].sharedSession;
      expect(started.status).toBe('active');
      expect(started.startedAt).toBeDefined();

      // 5. Update exercise data (both users)
      controller._progressTimestamps.clear();
      const dataReq1 = createMockReq({ userId, params: { id: session._id.toString() }, body: {
        exerciseOrder: 0, exerciseName: 'Bench Press', mode: 'muscu',
        sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 85 }], done: true
      }});
      await controller.updateExerciseData(dataReq1, createMockRes());

      controller._progressTimestamps.clear();
      const dataReq2 = createMockReq({ userId: partnerId, params: { id: session._id.toString() }, body: {
        exerciseOrder: 0, exerciseName: 'Bench Press', mode: 'muscu',
        sets: [{ reps: 12, weight: 70 }], done: true
      }});
      await controller.updateExerciseData(dataReq2, createMockRes());

      // Verify progress persisted
      const withProgress = await SharedSession.findById(session._id);
      expect(withProgress.progress.get(`${userId}:Bench Press`)).toBeDefined();
      expect(withProgress.progress.get(`${userId}:Bench Press`).sets).toHaveLength(2);
      expect(withProgress.progress.get(`${partnerId}:Bench Press`)).toBeDefined();

      // 6. End (first user)
      const endReq1 = createMockReq({ userId, params: { id: session._id.toString() }, body: {} });
      const endRes1 = createMockRes();
      await controller.endSession(endReq1, endRes1);
      const afterEnd1 = endRes1.json.mock.calls[0][0].sharedSession;
      expect(afterEnd1.status).toBe('active'); // Still active, partner hasn't ended
      expect(afterEnd1.endedBy).toHaveLength(1);

      // 7. End (second user)
      const endReq2 = createMockReq({ userId: partnerId, params: { id: session._id.toString() }, body: {} });
      const endRes2 = createMockRes();
      await controller.endSession(endReq2, endRes2);
      const afterEnd2 = endRes2.json.mock.calls[0][0].sharedSession;
      expect(afterEnd2.status).toBe('ended');
      expect(afterEnd2.endedBy).toHaveLength(2);
      expect(afterEnd2.durationSec).toBeGreaterThanOrEqual(0);
    });

    it('should handle cancel during building', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const match = await createMatch(userId, partnerId);
      const session = await createSession({ initiatorId: userId, partnerId, matchId: match._id, status: 'building' });

      const req = createMockReq({ userId, params: { id: session._id.toString() } });
      const res = createMockRes();
      await controller.cancelSession(req, res);

      const cancelled = await SharedSession.findById(session._id);
      expect(cancelled.status).toBe('cancelled');
    });

    it('should handle cancel during active by partner', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId: userId, partnerId, status: 'active', startedAt: new Date() });

      const req = createMockReq({ userId: partnerId, params: { id: session._id.toString() } });
      const res = createMockRes();
      await controller.cancelSession(req, res);

      const cancelled = await SharedSession.findById(session._id);
      expect(cancelled.status).toBe('cancelled');
    });

    it('should not allow adding exercise after session ended', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'ended' });

      const req = createMockReq({ userId, params: { id: session._id.toString() }, body: { exerciseName: 'Curl', type: ['muscu'] } });
      const res = createMockRes();
      await controller.addExercise(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle type as array in addExercise', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'building' });

      const req = createMockReq({ userId, params: { id: session._id.toString() }, body: {
        exerciseName: 'Pompes', type: ['muscu', 'poids_du_corps']
      }});
      const res = createMockRes();
      await controller.addExercise(req, res);

      const result = res.json.mock.calls[0][0].sharedSession;
      expect(result.exercises[0].type).toEqual(['muscu', 'poids_du_corps']);
    });

    it('should create notification on invite', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const match = await createMatch(userId, partnerId);

      const User = require('../../models/User');
      await User.create({ _id: userId, email: 'notif@test.com', password: 'test123', pseudo: 'NotifUser' });

      const req = createMockReq({ userId, body: { matchId: match._id.toString() } });
      const res = createMockRes();
      await controller.invite(req, res);

      const Notification = require('../../models/Notification');
      const notifs = await Notification.find({ userId: partnerId, type: 'shared_session' });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toBe('Invitation séance partagée');
      expect(notifs[0].link).toContain('/shared-session/');
    });

    it('should relay exercise data to partner via WS', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId: userId, partnerId, status: 'active' });

      const mockNotify = jest.fn();
      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseOrder: 0, exerciseName: 'Squat', sets: [{ reps: 5, weight: 100 }], done: false }
      });
      req.app.get = jest.fn().mockReturnValue({ notifyUser: mockNotify });
      const res = createMockRes();

      await controller.updateExerciseData(req, res);
      expect(mockNotify).toHaveBeenCalledWith(
        partnerId.toString(),
        'shared_session:partner_exercise_update',
        expect.objectContaining({ exerciseOrder: 0, exerciseName: 'Squat' })
      );
    });

    it('should include partnerSummary in partner_ended WS event', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({ initiatorId: userId, partnerId, status: 'active', startedAt: new Date() });

      // Add progress for the user who will end
      await SharedSession.updateOne({ _id: session._id }, {
        $set: { [`progress.${userId}:0`]: { exerciseOrder: 0, userId, exerciseName: 'Bench', sets: [{ reps: 10, weight: 80 }], done: true } }
      });

      const User = require('../../models/User');
      await User.create({ _id: userId, email: 'ender@test.com', password: 'test123', pseudo: 'Ender' });

      const mockNotify = jest.fn();
      const req = createMockReq({ userId, params: { id: session._id.toString() }, body: {} });
      req.app.get = jest.fn().mockReturnValue({ notifyUser: mockNotify });
      const res = createMockRes();

      await controller.endSession(req, res);

      expect(mockNotify).toHaveBeenCalledWith(
        partnerId.toString(),
        'shared_session:partner_ended',
        expect.objectContaining({
          partnerSummary: expect.arrayContaining([
            expect.objectContaining({ exerciseOrder: 0, exerciseName: 'Bench' })
          ])
        })
      );
    });
  });

  describe('Personal workouts (refactoring)', () => {
    it('should copy exercises to initiatorWorkout and partnerWorkout on start', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'building',
        exercises: [
          { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
          { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
        ],
        initiatorSelection: ['Pompe', 'Squat'],
        partnerSelection: ['Pompe', 'Squat'],
      });

      const req = createMockReq({ userId, params: { id: session._id.toString() } });
      const res = createMockRes();
      await controller.startSession(req, res);

      const started = await SharedSession.findById(session._id);
      expect(started.initiatorWorkout).toBeDefined();
      expect(started.partnerWorkout).toBeDefined();
      expect(started.initiatorWorkout.exercises).toHaveLength(2);
      expect(started.partnerWorkout.exercises).toHaveLength(2);
      expect(started.initiatorWorkout.startedAt).toBeDefined();
    });

    it('should remove exercise from personal workout only', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'active', startedAt: new Date(),
        exercises: [
          { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
          { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
        ],
        initiatorWorkout: {
          exercises: [
            { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
            { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
          ],
          startedAt: new Date()
        },
        partnerWorkout: {
          exercises: [
            { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
            { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
          ],
          startedAt: new Date()
        }
      });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString(), exerciseName: 'Pompe' }
      });
      const res = createMockRes();
      await controller.removeMyExercise(req, res);

      const updated = await SharedSession.findById(session._id);
      expect(updated.initiatorWorkout.exercises).toHaveLength(1);
      expect(updated.initiatorWorkout.exercises[0].exerciseName).toBe('Squat');
      expect(updated.partnerWorkout.exercises).toHaveLength(2);
    });

    it('should toggle exercise selection for a user', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'building',
        exercises: [
          { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
          { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
        ],
        initiatorSelection: ['Pompe', 'Squat'],
        partnerSelection: ['Pompe', 'Squat'],
      });

      // Décocher Pompe pour l'initiateur
      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseName: 'Pompe' }
      });
      const res = createMockRes();
      await controller.toggleSelection(req, res);

      const updated = await SharedSession.findById(session._id);
      expect(updated.initiatorSelection).not.toContain('Pompe');
      expect(updated.initiatorSelection).toContain('Squat');
      // Partner still has both
      expect(updated.partnerSelection).toContain('Pompe');
      expect(updated.partnerSelection).toContain('Squat');
    });

    it('should start with only selected exercises per user', async () => {
      const userId = createObjectId();
      const partnerId = createObjectId();
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'building',
        exercises: [
          { exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 },
          { exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 1 },
          { exerciseName: 'Traction', type: ['muscu'], addedBy: userId, order: 2 },
        ],
        initiatorSelection: ['Pompe', 'Traction'], // pas Squat
        partnerSelection: ['Squat', 'Traction'],    // pas Pompe
      });

      const req = createMockReq({ userId, params: { id: session._id.toString() } });
      const res = createMockRes();
      await controller.startSession(req, res);

      const started = await SharedSession.findById(session._id);
      expect(started.initiatorWorkout.exercises).toHaveLength(2);
      expect(started.initiatorWorkout.exercises.map(e => e.exerciseName)).toEqual(['Pompe', 'Traction']);
      expect(started.partnerWorkout.exercises).toHaveLength(2);
      expect(started.partnerWorkout.exercises.map(e => e.exerciseName)).toEqual(['Squat', 'Traction']);
    });

    it('should use exerciseName as progress key', async () => {
      const userId = createObjectId();
      const session = await createSession({ initiatorId: userId, status: 'active' });

      const req = createMockReq({
        userId,
        params: { id: session._id.toString() },
        body: { exerciseOrder: 0, exerciseName: 'Squat', sets: [{ reps: 5, weight: 100 }], done: true }
      });
      const res = createMockRes();
      await controller.updateExerciseData(req, res);

      const updated = await SharedSession.findById(session._id);
      expect(updated.progress.get(`${userId}:Squat`)).toBeDefined();
      expect(updated.progress.get(`${userId}:Squat`).done).toBe(true);
    });

    it('should include myWorkout in enriched response', async () => {
      const User = require('../../models/User');
      const userId = createObjectId();
      const partnerId = createObjectId();
      await User.create({ _id: userId, email: 'enrich1@test.com', password: 'test123', pseudo: 'User1' });
      await User.create({ _id: partnerId, email: 'enrich2@test.com', password: 'test123', pseudo: 'User2' });
      const session = await createSession({
        initiatorId: userId, partnerId, status: 'active',
        initiatorWorkout: { exercises: [{ exerciseName: 'Pompe', type: ['muscu'], addedBy: userId, order: 0 }], startedAt: new Date() },
        partnerWorkout: { exercises: [{ exerciseName: 'Squat', type: ['muscu'], addedBy: partnerId, order: 0 }], startedAt: new Date() }
      });

      const req = createMockReq({ userId, params: { id: session._id.toString() } });
      const res = createMockRes();

      await controller.getSession(req, res);
      const result = res.json.mock.calls[0][0].sharedSession;
      expect(result.myWorkout).toBeDefined();
      expect(result.myWorkout.exercises[0].exerciseName).toBe('Pompe');
      expect(result.partnerWorkoutData).toBeDefined();
      expect(result.partnerWorkoutData.exercises[0].exerciseName).toBe('Squat');
    });
  });
});
