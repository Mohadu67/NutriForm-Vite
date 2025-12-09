const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../server');
const WorkoutProgram = require('../../models/WorkoutProgram');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Program Controller - Validation', () => {
  let authToken;
  let userId;
  let adminToken;
  let adminId;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const testUser = await User.create({
      pseudo: 'testuser',
      email: 'test@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv', // Hash bcrypt fictif
      isEmailVerified: true,
      role: 'user'
    });

    userId = testUser._id.toString();
    authToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Créer un admin de test
    const testAdmin = await User.create({
      pseudo: 'adminuser',
      email: 'admin@example.com',
      motdepasse: '$2a$10$abcdefghijklmnopqrstuv',
      isEmailVerified: true,
      role: 'admin'
    });

    adminId = testAdmin._id.toString();
    adminToken = jwt.sign(
      { id: adminId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Nettoyer la base de données
    await User.deleteMany({});
    await WorkoutProgram.deleteMany({});
  });

  afterEach(async () => {
    // Nettoyer les programmes après chaque test
    await WorkoutProgram.deleteMany({});
  });

  describe('POST /api/programs - createProgram', () => {
    it('devrait accepter un programme valide', async () => {
      const validProgram = {
        name: 'Test HIIT',
        description: 'Programme de test',
        type: 'hiit',
        difficulty: 'intermédiaire',
        estimatedDuration: 30,
        estimatedCalories: 250,
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Burpees',
            durationSec: 30,
            intensity: 8
          },
          {
            order: 2,
            type: 'rest',
            restSec: 15
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProgram)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.program.name).toBe('Test HIIT');
      expect(response.body.program.type).toBe('hiit');
    });

    it('devrait rejeter si name < 3 caractères', async () => {
      const invalidProgram = {
        name: 'AB',
        type: 'hiit',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_name_length');
    });

    it('devrait rejeter si name > 100 caractères', async () => {
      const invalidProgram = {
        name: 'A'.repeat(101),
        type: 'hiit',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_name_length');
    });

    it('devrait rejeter si type invalide', async () => {
      const invalidProgram = {
        name: 'Test Programme',
        type: 'invalid_type',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_type');
    });

    it('devrait accepter tous les types valides', async () => {
      const validTypes = ['hiit', 'circuit', 'superset', 'amrap', 'emom', 'tabata', 'custom'];

      for (const type of validTypes) {
        const program = {
          name: `Test ${type}`,
          type,
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        };

        const response = await request(app)
          .post('/api/programs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(program);

        expect(response.status).toBe(201);
        expect(response.body.program.type).toBe(type);

        // Nettoyer
        await WorkoutProgram.deleteMany({ type });
      }
    });

    it('devrait rejeter si difficulty invalide', async () => {
      const invalidProgram = {
        name: 'Test Programme',
        type: 'hiit',
        difficulty: 'expert',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_difficulty');
    });

    it('devrait accepter toutes les difficultés valides', async () => {
      const validDifficulties = ['débutant', 'intermédiaire', 'avancé'];

      for (const difficulty of validDifficulties) {
        const program = {
          name: `Test ${difficulty}`,
          type: 'hiit',
          difficulty,
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        };

        const response = await request(app)
          .post('/api/programs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(program);

        expect(response.status).toBe(201);
        expect(response.body.program.difficulty).toBe(difficulty);

        // Nettoyer
        await WorkoutProgram.deleteMany({ difficulty });
      }
    });

    it('devrait accepter exercice avec reps au lieu de durationSec', async () => {
      const programWithReps = {
        name: 'Test Reps',
        type: 'circuit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Pompes',
            reps: 20,
            sets: 3,
            intensity: 7
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(programWithReps)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.program.cycles[0].reps).toBe(20);
    });

    it('devrait rejeter si cycles vide', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: []
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('cycles_must_be_array');
    });

    it('devrait rejeter si cycles manquant', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit'
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('missing_required_fields');
    });

    it('devrait rejeter cycle avec type invalide', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'invalid_cycle',
            exerciseName: 'Test',
            durationSec: 30
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_cycle_type');
    });

    it('devrait rejeter exercice sans exerciseName', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            durationSec: 30
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('exercise_name_required');
    });

    it('devrait rejeter exercice avec durationSec < 5', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 3
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_exercise_duration');
    });

    it('devrait rejeter exercice avec durationSec > 600', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 700
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_exercise_duration');
    });

    it('devrait rejeter rest avec restSec < 0', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 30
          },
          {
            order: 2,
            type: 'rest',
            restSec: -5
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_rest_duration');
    });

    it('devrait rejeter rest avec restSec > 300', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 30
          },
          {
            order: 2,
            type: 'rest',
            restSec: 400
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_rest_duration');
    });

    it('devrait rejeter intensity < 1', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 30,
            intensity: 0
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_intensity');
    });

    it('devrait rejeter intensity > 10', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        cycles: [
          {
            order: 1,
            type: 'exercise',
            exerciseName: 'Test',
            durationSec: 30,
            intensity: 11
          }
        ]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_intensity');
    });

    it('devrait rejeter estimatedDuration négatif', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        estimatedDuration: -10,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_duration');
    });

    it('devrait rejeter estimatedDuration > 300', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        estimatedDuration: 400,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_duration');
    });

    it('devrait rejeter estimatedCalories négatif', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        estimatedCalories: -50,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_calories');
    });

    it('devrait rejeter estimatedCalories > 2000', async () => {
      const invalidProgram = {
        name: 'Test',
        type: 'hiit',
        estimatedCalories: 3000,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgram)
        .expect(400);

      expect(response.body.error).toBe('invalid_calories');
    });

    it('user normal ne peut pas créer de programme public', async () => {
      const program = {
        name: 'Test Public',
        type: 'hiit',
        isPublic: true,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(program)
        .expect(201);

      // Le programme devrait être créé mais en privé
      expect(response.body.program.isPublic).toBe(false);
      expect(response.body.program.status).toBe('private');
    });

    it('admin peut créer un programme public', async () => {
      const program = {
        name: 'Test Admin Public',
        type: 'hiit',
        isPublic: true,
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      };

      const response = await request(app)
        .post('/api/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(program)
        .expect(201);

      expect(response.body.program.isPublic).toBe(true);
      expect(response.body.program.status).toBe('public');
    });
  });

  describe('GET /api/programs/public - NoSQL Injection', () => {
    beforeEach(async () => {
      // Créer des programmes de test
      await WorkoutProgram.create([
        {
          name: 'HIIT Program',
          type: 'hiit',
          difficulty: 'intermédiaire',
          isPublic: true,
          isActive: true,
          status: 'public',
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        },
        {
          name: 'Circuit Program',
          type: 'circuit',
          difficulty: 'débutant',
          isPublic: true,
          isActive: true,
          status: 'public',
          cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
        }
      ]);
    });

    it('devrait gérer type string normal', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ type: 'hiit' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.programs.length).toBeGreaterThan(0);
    });

    it('devrait gérer difficulty string normal', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ difficulty: 'intermédiaire' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('devrait gérer limit raisonnable', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.programs.length).toBeLessThanOrEqual(10);
    });

    it('devrait plafonner limit excessif', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ limit: 999999 })
        .expect(200);

      // Le backend devrait plafonner à 50 (valeur par défaut max)
      expect(response.body.programs.length).toBeLessThanOrEqual(50);
    });

    it('devrait gérer skip numérique', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ skip: 0, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.skip).toBe(0);
    });

    it('devrait gérer tags séparés par virgule', async () => {
      const response = await request(app)
        .get('/api/programs/public')
        .query({ tags: 'cardio,force' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/programs/:id/rate - Rating Validation', () => {
    let programId;

    beforeEach(async () => {
      const program = await WorkoutProgram.create({
        name: 'Test Program',
        type: 'hiit',
        isPublic: true,
        isActive: true,
        status: 'public',
        cycles: [{ order: 1, type: 'exercise', exerciseName: 'Test', durationSec: 30 }]
      });
      programId = program._id.toString();
    });

    it('devrait accepter rating valide entre 1 et 5', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const response = await request(app)
          .post(`/api/programs/${programId}/rate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ rating })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('devrait rejeter rating < 1', async () => {
      const response = await request(app)
        .post(`/api/programs/${programId}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 0 })
        .expect(400);

      expect(response.body.error).toBe('invalid_rating');
    });

    it('devrait rejeter rating > 5', async () => {
      const response = await request(app)
        .post(`/api/programs/${programId}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 6 })
        .expect(400);

      expect(response.body.error).toBe('invalid_rating');
    });

    it('devrait rejeter rating non-integer', async () => {
      const response = await request(app)
        .post(`/api/programs/${programId}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 3.5 })
        .expect(400);

      expect(response.body.error).toBe('invalid_rating');
    });

    it('devrait rejeter rating string', async () => {
      const response = await request(app)
        .post(`/api/programs/${programId}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 'five' })
        .expect(400);

      expect(response.body.error).toBe('invalid_rating');
    });
  });
});
