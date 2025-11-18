const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../../routes/auth.route');
const User = require('../../models/User');

// Mock models and services
jest.mock('../../models/User');
jest.mock('../../services/mailer.service');
jest.mock('../../middlewares/recaptcha.middleware', () => (req, res, next) => next());

// Create test Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', authRoutes);
  return app;
}

describe('API Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('POST /api/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ identifier: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('requis');
    });

    it('should return 401 for invalid credentials', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
        collation: jest.fn().mockReturnThis(),
      });

      const response = await request(app)
        .post('/api/login')
        .send({ identifier: 'test@example.com', password: 'wrongpass' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('invalides');
    });

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        pseudo: 'testuser',
        prenom: 'Test',
        emailVerifie: true,
        motdepasse: '$2a$10$hashedpassword',
        role: 'user',
        photo: null,
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
        collation: jest.fn().mockReturnThis(),
      });

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({ identifier: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/register', () => {
    it('should return 400 for missing email or password', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ email: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('requis');
    });

    it('should return 409 if user already exists', async () => {
      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'existing@example.com' }),
      });

      const response = await request(app)
        .post('/api/register')
        .send({ email: 'existing@example.com', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('existant');
    });

    it('should register successfully with valid data', async () => {
      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      User.mockImplementation(() => ({
        email: 'newuser@example.com',
        save: mockSave,
      }));

      const { sendVerifyEmail } = require('../../services/mailer.service');
      sendVerifyEmail.mockResolvedValue({ messageId: 'test-id' });

      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          prenom: 'New',
          pseudo: 'newuser',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Vérifie ta boîte mail');
    });
  });

  // Note: Authenticated routes (GET /api/me, POST /api/history, etc.) require complex middleware setup
  // These are better tested through unit tests for controllers

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app).post('/api/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Déconnexion');
    });
  });
});
