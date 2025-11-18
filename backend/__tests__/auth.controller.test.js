const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const User = require('../models/User');
const { sendVerifyEmail } = require('../services/mailer.service');

// Mock dependencies
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../services/mailer.service');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {},
      userId: 'user123',
      cookies: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    // Set default environment
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('login', () => {
    it('should return 400 if identifier or password is missing', async () => {
      req.body = { identifier: '', password: '' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email/pseudo et mot de passe requis.',
      });
    });

    it('should return 401 if user not found', async () => {
      req.body = { identifier: 'test@example.com', password: 'password123' };
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
        collation: jest.fn().mockReturnThis(),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides.',
      });
    });

    it('should return 403 if email not verified', async () => {
      req.body = { identifier: 'test@example.com', password: 'password123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        emailVerifie: false,
        motdepasse: '$2a$10$hashedpassword',
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email non vérifié. Vérifie ta boîte mail.',
      });
    });

    it('should return 401 for legacy plaintext password', async () => {
      req.body = { identifier: 'test@example.com', password: 'password123' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        emailVerifie: true,
        motdepasse: 'plaintextpassword',
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Compte legacy détecté. Veuillez réinitialiser votre mot de passe.',
      });
    });

    it('should return 401 if password does not match', async () => {
      req.body = { identifier: 'test@example.com', password: 'wrongpassword' };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        emailVerifie: true,
        motdepasse: '$2a$10$hashedpassword',
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Identifiants invalides.',
      });
    });

    it('should login successfully and set httpOnly cookie', async () => {
      req.body = { identifier: 'test@example.com', password: 'password123' };
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
      });
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue('test-token-123');

      await authController.login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2a$10$hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', email: 'test@example.com', role: 'user' },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(res.cookie).toHaveBeenCalledWith('token', 'test-token-123', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Connexion réussie.',
        displayName: 'testuser',
        user: expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          role: 'user',
        }),
      });
    });
  });

  describe('register', () => {
    it('should return 400 if email or password is missing', async () => {
      req.body = { email: '', password: '' };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email et mot de passe requis ❌',
      });
    });

    it('should return 409 if user already exists', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Utilisateur déjà existant ❌',
      });
    });

    it('should return 400 for invalid pseudo', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        pseudo: 'invalid pseudo!',
      };
      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Pseudo invalide (3-30, a-z0-9._-).',
      });
    });

    it('should return 409 if pseudo is already taken', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        pseudo: 'testuser',
      };

      User.findOne = jest.fn()
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) }) // email check
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ pseudo: 'testuser' }) }); // pseudo check

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Pseudo déjà pris.',
      });
    });

    it('should register successfully and send verification email', async () => {
      req.body = {
        email: 'newuser@example.com',
        password: 'password123',
        prenom: 'New',
        pseudo: 'newuser',
      };

      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue(true);
      User.mockImplementation(() => ({
        email: 'newuser@example.com',
        prenom: 'New',
        pseudo: 'newuser',
        save: mockSave,
      }));

      sendVerifyEmail.mockResolvedValue({ messageId: 'test-message-id' });

      await authController.register(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(sendVerifyEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Compte créé. Vérifie ta boîte mail ✉️',
      });
    });

    it('should delete user and return 502 if email sending fails', async () => {
      req.body = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      User.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const mockUserId = 'newuser123';
      const mockSave = jest.fn().mockResolvedValue(true);
      User.mockImplementation(() => ({
        _id: mockUserId,
        email: 'newuser@example.com',
        save: mockSave,
      }));

      User.deleteOne = jest.fn().mockResolvedValue(true);
      sendVerifyEmail.mockRejectedValue(new Error('Mail service error'));

      await authController.register(req, res);

      expect(User.deleteOne).toHaveBeenCalledWith({ _id: mockUserId });
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        message: "Impossible d'envoyer l'email de vérification. Vérifie ton adresse email.",
      });
    });
  });

  describe('me', () => {
    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Utilisateur introuvable.',
      });
    });

    it('should return user data successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        prenom: 'Test',
        pseudo: 'testuser',
        photo: null,
        role: 'user',
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        prenom: 'Test',
        pseudo: 'testuser',
        photo: null,
        role: 'user',
        displayName: 'Test',
      });
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message', async () => {
      await authController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Déconnexion réussie.',
      });
    });
  });
});
