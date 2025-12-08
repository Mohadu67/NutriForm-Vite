
const historyController = require('../controllers/history.controller');
const History = require('../models/History');
const WorkoutSession = require('../models/WorkoutSession');

// Mock dependencies
jest.mock('../models/History');
jest.mock('../models/WorkoutSession');
jest.mock('../services/stats.service');
jest.mock('../services/calorie.service');

describe('History Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      userId: 'user123',
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    process.env.NODE_ENV = 'test';
  });

  describe('addHistory', () => {
    it('should return 401 if userId is missing', async () => {
      req.userId = null;

      await historyController.addHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Non autorisé (token manquant ou invalide).',
      });
    });

    it('should add history record successfully', async () => {
      req.body = {
        action: 'IMC_CALC',
        meta: { imc: 22.5, poids: 70, taille: 175 },
      };

      const mockDoc = {
        _id: 'hist123',
        userId: 'user123',
        action: 'IMC_CALC',
        meta: { imc: 22.5, poids: 70, taille: 175 },
        save: jest.fn().mockResolvedValue(true),
      };

      History.mockImplementation(() => mockDoc);

      await historyController.addHistory(req, res);

      expect(mockDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockDoc);
    });

    it('should handle errors gracefully', async () => {
      req.body = {
        action: 'IMC_CALC',
        meta: {},
      };

      History.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      await historyController.addHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur lors de l'ajout de l'historique",
      });
    });
  });

  describe('getHistory', () => {
    it('should return 401 if userId is missing', async () => {
      req.userId = null;

      await historyController.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Non autorisé (token manquant ou invalide).',
      });
    });

    it('should return user history successfully', async () => {
      const mockHistory = [
        {
          _id: 'hist1',
          userId: 'user123',
          action: 'IMC_CALC',
          meta: { imc: 22.5 },
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: 'hist2',
          userId: 'user123',
          action: 'CALORIES_CALC',
          meta: { calories: 2000 },
          createdAt: new Date('2024-01-02'),
        },
      ];

      History.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      await historyController.getHistory(req, res);

      expect(History.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should handle errors gracefully', async () => {
      History.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await historyController.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Erreur lors de la récupération de l'historique",
      });
    });
  });

  describe('deleteHistory', () => {
    it('should return 401 if userId is missing', async () => {
      req.userId = null;
      req.params = { id: 'hist123' };

      await historyController.deleteHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Non autorisé',
      });
    });

    it('should return 400 if id is missing', async () => {
      req.params = {};

      await historyController.deleteHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Paramètre id manquant',
      });
    });

    it('should return 404 if record not found', async () => {
      req.params = { id: 'hist123' };
      History.findById = jest.fn().mockResolvedValue(null);

      await historyController.deleteHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Historique introuvable',
      });
    });

    it('should return 403 if user does not own the record', async () => {
      req.params = { id: 'hist123' };
      const mockDoc = {
        _id: 'hist123',
        userId: 'differentUser',
        deleteOne: jest.fn(),
      };

      History.findById = jest.fn().mockResolvedValue(mockDoc);

      await historyController.deleteHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Accès interdit',
      });
    });

    it('should delete history record successfully', async () => {
      req.params = { id: 'hist123' };
      const mockDoc = {
        _id: 'hist123',
        userId: 'user123',
        action: 'IMC_CALC',
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      History.findById = jest.fn().mockResolvedValue(mockDoc);
      res.send = jest.fn().mockReturnThis();

      await historyController.deleteHistory(req, res);

      expect(History.findById).toHaveBeenCalledWith('hist123');
      expect(mockDoc.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getUserSummary', () => {
    it('should return 401 if userId is missing', async () => {
      req.userId = null;

      await historyController.getUserSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Non autorisé (token manquant ou invalide).',
      });
    });

    it('should return user summary successfully', async () => {
      History.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      WorkoutSession.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const { deriveFromHistory, deriveFromSessions } = require('../services/stats.service');
      deriveFromHistory.mockReturnValue({
        imc: 22.5,
        latestWeight: 70,
        dailyCalories: 2000,
        avgWorkoutDurationMin: 45,
        workoutsCount7d: 5,
      });

      deriveFromSessions.mockReturnValue({
        totalSessions: 10,
        lastSessionName: 'Cardio',
      });

      await historyController.getUserSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        imc: expect.any(Number),
        totalSessions: expect.any(Number),
      }));
    });
  });
});
