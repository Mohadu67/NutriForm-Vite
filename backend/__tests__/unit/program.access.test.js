const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../server');
const WorkoutProgram = require('../../models/WorkoutProgram');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Program Controller - Access Control', () => {
  let user1Token, user1Id;
  let user2Token, user2Id;
  let adminToken, adminId;

  beforeAll(async () => {
    // Créer user1
    const user1 = await User.create({
      pseudo: 'user1',
      email: 'user1@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'user'
    });
    user1Id = user1._id.toString();
    user1Token = jwt.sign(
      { id: user1Id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Créer user2
    const user2 = await User.create({
      pseudo: 'user2',
      email: 'user2@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'user'
    });
    user2Id = user2._id.toString();
    user2Token = jwt.sign(
      { id: user2Id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Créer admin
    const admin = await User.create({
      pseudo: 'admin',
      email: 'admin@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'admin'
    });
    adminId = admin._id.toString();
    adminToken = jwt.sign(
      { id: adminId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await WorkoutProgram.deleteMany({});
  });

  afterEach(async () => {
    await WorkoutProgram.deleteMany({});
  });

  describe('GET /api/programs/:id - Access Control', () => {
    it('devrait autoriser accès programme public sans auth', async () => {
      const publicProgram = await WorkoutProgram.create({
        name: 'Public Program',
        type: 'hiit',
        isPublic: true,
        status: 'public',
        isActive: true,
        createdBy: 'admin',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${publicProgram._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.name).toBe('Public Program');
    });

    it('devrait rejeter accès programme privé sans auth', async () => {
      const privateProgram = await WorkoutProgram.create({
        name: 'Private Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${privateProgram._id}`)
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });

    it('devrait autoriser propriétaire pour programme privé', async () => {
      const privateProgram = await WorkoutProgram.create({
        name: 'My Private Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${privateProgram._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.name).toBe('My Private Program');
    });

    it('devrait rejeter non-propriétaire pour programme privé', async () => {
      const privateProgram = await WorkoutProgram.create({
        name: 'User1 Private Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${privateProgram._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });

    it('devrait autoriser admin pour tout programme privé', async () => {
      const privateProgram = await WorkoutProgram.create({
        name: 'User Private Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${privateProgram._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('devrait rejeter accès programme inactif sans ownership', async () => {
      const inactiveProgram = await WorkoutProgram.create({
        name: 'Inactive Program',
        type: 'hiit',
        isPublic: true,
        status: 'public',
        isActive: false,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${inactiveProgram._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });

    it('devrait autoriser propriétaire pour programme inactif', async () => {
      const inactiveProgram = await WorkoutProgram.create({
        name: 'My Inactive Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: false,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get(`/api/programs/${inactiveProgram._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('devrait retourner 404 pour programme inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/programs/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('program_not_found');
    });

    it('devrait retourner 400 pour ID invalide', async () => {
      const response = await request(app)
        .get('/api/programs/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('invalid_program_id');
    });
  });

  describe('PATCH /api/programs/:id - Update Access Control', () => {
    it('devrait rejeter update si non propriétaire', async () => {
      const program = await WorkoutProgram.create({
        name: 'User1 Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Modified Name' })
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });

    it('devrait autoriser propriétaire à update son programme', async () => {
      const program = await WorkoutProgram.create({
        name: 'Original Name',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.name).toBe('Updated Name');
    });

    it('devrait autoriser admin à update tout programme', async () => {
      const program = await WorkoutProgram.create({
        name: 'User Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.name).toBe('Admin Updated');
    });

    it('user normal ne peut pas modifier isPublic', async () => {
      const program = await WorkoutProgram.create({
        name: 'Private Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ isPublic: true })
        .expect(200);

      // isPublic ne devrait pas changer
      expect(response.body.program.isPublic).toBe(false);
    });

    it('admin peut modifier isPublic', async () => {
      const program = await WorkoutProgram.create({
        name: 'Admin Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        createdBy: 'admin',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublic: true })
        .expect(200);

      expect(response.body.program.isPublic).toBe(true);
    });

    it('user normal ne peut pas modifier isActive', async () => {
      const program = await WorkoutProgram.create({
        name: 'Active Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ isActive: false })
        .expect(200);

      // isActive ne devrait pas changer
      expect(response.body.program.isActive).toBe(true);
    });

    it('admin peut modifier isActive', async () => {
      const program = await WorkoutProgram.create({
        name: 'Admin Program',
        type: 'hiit',
        isPublic: true,
        status: 'public',
        isActive: true,
        createdBy: 'admin',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .patch(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.program.isActive).toBe(false);
    });
  });

  describe('DELETE /api/programs/:id - Delete Access Control', () => {
    it('devrait rejeter delete si non propriétaire', async () => {
      const program = await WorkoutProgram.create({
        name: 'User1 Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .delete(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.error).toBe('access_denied');
    });

    it('devrait autoriser propriétaire à supprimer son programme', async () => {
      const program = await WorkoutProgram.create({
        name: 'To Delete',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .delete(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('program_deleted');

      // Vérifier soft delete
      const deletedProgram = await WorkoutProgram.findById(program._id);
      expect(deletedProgram.isActive).toBe(false);
    });

    it('devrait autoriser admin à supprimer tout programme', async () => {
      const program = await WorkoutProgram.create({
        name: 'User Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .delete(`/api/programs/${program._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/programs/user - getUserPrograms Access Control', () => {
    it('devrait retourner seulement les programmes de l\'utilisateur', async () => {
      // Créer programmes pour user1
      await WorkoutProgram.create([
        {
          name: 'User1 Program 1',
          type: 'hiit',
          userId: new mongoose.Types.ObjectId(user1Id),
          isActive: true,
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        },
        {
          name: 'User1 Program 2',
          type: 'circuit',
          userId: new mongoose.Types.ObjectId(user1Id),
          isActive: true,
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        }
      ]);

      // Créer programme pour user2
      await WorkoutProgram.create({
        name: 'User2 Program',
        type: 'hiit',
        userId: new mongoose.Types.ObjectId(user2Id),
        isActive: true,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .get('/api/programs/user')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.programs.length).toBe(2);
      expect(response.body.programs.every(p => p.userId === user1Id)).toBe(true);
    });

    it('devrait nécessiter authentification', async () => {
      const response = await request(app)
        .get('/api/programs/user')
        .expect(401);

      expect(response.body.message).toContain('Token');
    });
  });

  describe('POST /api/programs/:id/propose - proposeToPublic Access Control', () => {
    it('devrait autoriser propriétaire à proposer son programme', async () => {
      const program = await WorkoutProgram.create({
        name: 'To Propose',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/propose`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.status).toBe('pending');
    });

    it('devrait rejeter si non propriétaire', async () => {
      const program = await WorkoutProgram.create({
        name: 'User1 Program',
        type: 'hiit',
        isPublic: false,
        status: 'private',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/propose`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.error).toBe('not_program_owner');
    });

    it('devrait rejeter si déjà public ou pending', async () => {
      const program = await WorkoutProgram.create({
        name: 'Public Program',
        type: 'hiit',
        isPublic: true,
        status: 'public',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/propose`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.error).toBe('program_already_proposed_or_public');
    });
  });

  describe('GET /api/programs/admin/all - getAllPrograms Access Control', () => {
    it('devrait autoriser admin', async () => {
      const response = await request(app)
        .get('/api/programs/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('devrait rejeter user normal', async () => {
      const response = await request(app)
        .get('/api/programs/admin/all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('POST /api/programs/:id/approve - approveProgram Access Control', () => {
    it('devrait autoriser admin à approuver', async () => {
      const program = await WorkoutProgram.create({
        name: 'Pending Program',
        type: 'hiit',
        isPublic: false,
        status: 'pending',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.program.status).toBe('public');
      expect(response.body.program.isPublic).toBe(true);
    });

    it('devrait rejeter user normal', async () => {
      const program = await WorkoutProgram.create({
        name: 'Pending Program',
        type: 'hiit',
        isPublic: false,
        status: 'pending',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/approve`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('POST /api/programs/:id/reject - rejectProgram Access Control', () => {
    it('devrait autoriser admin à rejeter', async () => {
      const program = await WorkoutProgram.create({
        name: 'Pending Program',
        type: 'hiit',
        isPublic: false,
        status: 'pending',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Does not meet quality standards' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('program_rejected');
    });

    it('devrait rejeter user normal', async () => {
      const program = await WorkoutProgram.create({
        name: 'Pending Program',
        type: 'hiit',
        isPublic: false,
        status: 'pending',
        isActive: true,
        userId: new mongoose.Types.ObjectId(user1Id),
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });

      const response = await request(app)
        .post(`/api/programs/${program._id}/reject`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });
});
