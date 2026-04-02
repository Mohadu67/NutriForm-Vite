/**
 * Tests unitaires pour matching.service.js
 *
 * Couvre :
 * - likeProfile : like simple, match mutuel, rattachement conv orpheline
 * - unlikeProfile : retrait de like, suppression de match
 * - rejectMatch : rejet simple, rejet sur match mutuel (interdit)
 * - relikeProfile : re-like avec rattachement conv orpheline
 * - getMutualMatches : récupération des matches mutuels
 * - blockUser : blocage
 * - linkOrphanConversation : logique de rattachement
 */

const mongoose = require('mongoose');
const Match = require('../../models/Match');
const Conversation = require('../../models/Conversation');
const UserProfile = require('../../models/UserProfile');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

// Mock pushNotification pour éviter les appels réseau
jest.mock('../../services/pushNotification.service', () => ({
  notifyNewMatch: jest.fn().mockResolvedValue(null)
}));

const matchingService = require('../../services/matching.service');

// ─── Helpers ────────────────────────────────────────────

const createObjectId = () => new mongoose.Types.ObjectId();

const createUser = async (overrides = {}) => {
  return User.create({
    pseudo: overrides.pseudo || `user_${Date.now()}`,
    email: overrides.email || `${Date.now()}@test.com`,
    password: 'hashedPassword123',
    photo: null,
    ...overrides
  });
};

const createProfile = async (userId, overrides = {}) => {
  return UserProfile.create({
    userId,
    age: 25,
    gender: 'male',
    fitnessLevel: 'intermediate',
    workoutTypes: ['musculation', 'cardio'],
    bio: 'Test bio',
    isVisible: true,
    verified: false,
    blockedUsers: [],
    location: {
      type: 'Point',
      coordinates: [2.3522, 48.8566],
      city: 'Paris',
      neighborhood: null
    },
    availability: {
      monday: [{ start: '08:00', end: '10:00' }],
      wednesday: [{ start: '18:00', end: '20:00' }]
    },
    matchPreferences: {
      maxDistance: 20,
      preferredGender: 'any',
      preferredWorkoutTypes: [],
      preferredFitnessLevels: [],
      preferredAgeRange: { min: 18, max: 40 },
      onlyVerified: false
    },
    ...overrides
  });
};

const createMatch = async (user1Id, user2Id, overrides = {}) => {
  return Match.create({
    user1Id,
    user2Id,
    matchScore: 70,
    distance: 5,
    status: 'pending',
    likedBy: [],
    ...overrides
  });
};

const createConversation = async (participants, overrides = {}) => {
  return Conversation.create({
    participants,
    isActive: true,
    unreadCount: new Map([
      [participants[0].toString(), 0],
      [participants[1].toString(), 0]
    ]),
    ...overrides
  });
};

// ─── TESTS ──────────────────────────────────────────────

describe('Matching Service', () => {

  // ─── likeProfile ────────────────────────────────────────

  describe('likeProfile', () => {
    it('should create a new match when no match exists', async () => {
      const user1 = await createUser({ pseudo: 'alice' });
      const user2 = await createUser({ pseudo: 'bob', email: 'bob@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      const result = await matchingService.likeProfile(user1._id, user2._id, null);

      expect(result.match).toBeDefined();
      expect(result.match.isMutual).toBe(false);
      expect(result.match.status).toBe('user1_liked');
      expect(result.message).toBe('Like enregistré.');

      const match = await Match.findById(result.match._id);
      expect(match).not.toBeNull();
      expect(match.likedBy).toHaveLength(1);
    });

    it('should return error when profile not found', async () => {
      const user1 = await createUser({ pseudo: 'alice2' });
      const fakeId = createObjectId();

      const result = await matchingService.likeProfile(user1._id, fakeId, null);

      expect(result.error).toBe('not_found');
    });

    it('should create a mutual match when both users like each other', async () => {
      const user1 = await createUser({ pseudo: 'alice3' });
      const user2 = await createUser({ pseudo: 'bob3', email: 'bob3@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      // User1 like User2
      await matchingService.likeProfile(user1._id, user2._id, null);

      // User2 like User1 -> match mutuel
      const result = await matchingService.likeProfile(user2._id, user1._id, null);

      expect(result.match.isMutual).toBe(true);
      expect(result.match.status).toBe('mutual');
      expect(result.message).toBe('Match mutuel ! 🎉');
    });

    it('should link orphan conversation on mutual match', async () => {
      const user1 = await createUser({ pseudo: 'alice4' });
      const user2 = await createUser({ pseudo: 'bob4', email: 'bob4@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      // Simuler une conversation orpheline (post-migration BDD)
      const orphanConv = await createConversation([user1._id, user2._id], {
        matchId: createObjectId(), // matchId qui pointe vers un match qui n'existe plus
        lastMessage: { content: 'Hello !', senderId: user1._id, timestamp: new Date() }
      });

      // User1 like User2
      await matchingService.likeProfile(user1._id, user2._id, null);

      // User2 like User1 -> match mutuel
      const result = await matchingService.likeProfile(user2._id, user1._id, null);

      expect(result.match.isMutual).toBe(true);

      // Vérifier que la conversation orpheline a été rattachée
      const updatedConv = await Conversation.findById(orphanConv._id);
      expect(updatedConv.matchId.toString()).toBe(result.match._id.toString());

      // Vérifier que le match a le conversationId
      const match = await Match.findById(result.match._id);
      expect(match.conversationId.toString()).toBe(orphanConv._id.toString());

      // Vérifier qu'aucune nouvelle conversation n'a été créée (pas de doublon)
      const allConvs = await Conversation.find({
        participants: { $all: [user1._id, user2._id] }
      });
      expect(allConvs).toHaveLength(1);
    });

    it('should NOT create duplicate conversation when re-liking with existing conv', async () => {
      const user1 = await createUser({ pseudo: 'alice5' });
      const user2 = await createUser({ pseudo: 'bob5', email: 'bob5@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      // Conv orpheline
      await createConversation([user1._id, user2._id], {
        matchId: createObjectId()
      });

      // Double like -> mutual
      await matchingService.likeProfile(user1._id, user2._id, null);
      await matchingService.likeProfile(user2._id, user1._id, null);

      // Vérifier: une seule conversation
      const convs = await Conversation.find({
        participants: { $all: [user1._id, user2._id] }
      });
      expect(convs).toHaveLength(1);
    });
  });

  // ─── unlikeProfile ──────────────────────────────────────

  describe('unlikeProfile', () => {
    it('should remove a like and keep match if other user still likes', async () => {
      const user1 = await createUser({ pseudo: 'alice6' });
      const user2 = await createUser({ pseudo: 'bob6', email: 'bob6@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id, user2._id],
        status: 'mutual'
      });

      const result = await matchingService.unlikeProfile(user1._id, user2._id);

      expect(result.message).toBe('Like retiré.');

      const match = await Match.findOne({
        $or: [
          { user1Id: user1._id, user2Id: user2._id },
          { user1Id: user2._id, user2Id: user1._id }
        ]
      });
      expect(match).not.toBeNull();
      expect(match.likedBy).toHaveLength(1);
      expect(match.status).toBe('user2_liked');
    });

    it('should delete match when no likes remain', async () => {
      const user1 = await createUser({ pseudo: 'alice7' });
      const user2 = await createUser({ pseudo: 'bob7', email: 'bob7@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id],
        status: 'user1_liked'
      });

      await matchingService.unlikeProfile(user1._id, user2._id);

      const match = await Match.findOne({
        $or: [
          { user1Id: user1._id, user2Id: user2._id },
          { user1Id: user2._id, user2Id: user1._id }
        ]
      });
      expect(match).toBeNull();
    });

    it('should return error if match not found', async () => {
      const result = await matchingService.unlikeProfile(createObjectId(), createObjectId());
      expect(result.error).toBe('not_found');
    });
  });

  // ─── rejectMatch ────────────────────────────────────────

  describe('rejectMatch', () => {
    it('should reject a pending match', async () => {
      const user1 = await createUser({ pseudo: 'alice8' });
      const user2 = await createUser({ pseudo: 'bob8', email: 'bob8@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      await createMatch(user1._id, user2._id, {
        likedBy: [user2._id],
        status: 'user2_liked'
      });

      const result = await matchingService.rejectMatch(user1._id, user2._id);

      expect(result.message).toBe('Profil rejeté.');

      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(match.status).toBe('rejected');
      expect(match.rejectedBy.toString()).toBe(user1._id.toString());
    });

    it('should prevent rejecting a mutual match', async () => {
      const user1 = await createUser({ pseudo: 'alice9' });
      const user2 = await createUser({ pseudo: 'bob9', email: 'bob9@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id, user2._id],
        status: 'mutual'
      });

      const result = await matchingService.rejectMatch(user1._id, user2._id);

      expect(result.error).toBe('forbidden');
    });

    it('should create a rejected match if none exists', async () => {
      const user1 = await createUser({ pseudo: 'alice10' });
      const user2 = await createUser({ pseudo: 'bob10', email: 'bob10@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      const result = await matchingService.rejectMatch(user1._id, user2._id);

      expect(result.message).toBe('Profil rejeté.');

      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(match).not.toBeNull();
      expect(match.status).toBe('rejected');
    });
  });

  // ─── relikeProfile ──────────────────────────────────────

  describe('relikeProfile', () => {
    it('should re-like a rejected profile', async () => {
      const user1 = await createUser({ pseudo: 'alice11' });
      const user2 = await createUser({ pseudo: 'bob11', email: 'bob11@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [],
        status: 'rejected',
        rejectedBy: user1._id
      });

      const result = await matchingService.relikeProfile(user1._id, user2._id);

      expect(result.success).toBe(true);
      expect(result.isMutual).toBe(false);
      expect(result.message).toBe('Like enregistré.');
    });

    it('should create mutual match if other had already liked before rejection', async () => {
      const user1 = await createUser({ pseudo: 'alice12' });
      const user2 = await createUser({ pseudo: 'bob12', email: 'bob12@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user2._id], // User2 avait liké avant le rejet
        status: 'rejected',
        rejectedBy: user1._id
      });

      const result = await matchingService.relikeProfile(user1._id, user2._id);

      expect(result.success).toBe(true);
      expect(result.isMutual).toBe(true);
      expect(result.message).toBe('Match mutuel ! 🎉');
    });

    it('should link orphan conversation on re-like mutual', async () => {
      const user1 = await createUser({ pseudo: 'alice13' });
      const user2 = await createUser({ pseudo: 'bob13', email: 'bob13@test.com' });
      await createProfile(user2._id);

      // Conv orpheline
      const orphanConv = await createConversation([user1._id, user2._id], {
        matchId: createObjectId()
      });

      await createMatch(user1._id, user2._id, {
        likedBy: [user2._id],
        status: 'rejected',
        rejectedBy: user1._id
      });

      const result = await matchingService.relikeProfile(user1._id, user2._id);

      expect(result.isMutual).toBe(true);

      // Vérifier rattachement
      const updatedConv = await Conversation.findById(orphanConv._id);
      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(updatedConv.matchId.toString()).toBe(match._id.toString());
      expect(match.conversationId.toString()).toBe(orphanConv._id.toString());
    });

    it('should return error for non-existent rejected match', async () => {
      const result = await matchingService.relikeProfile(createObjectId(), createObjectId());
      expect(result.error).toBe('not_found');
    });
  });

  // ─── getMutualMatches ───────────────────────────────────

  describe('getMutualMatches', () => {
    it('should return mutual matches with formatted user data', async () => {
      const user1 = await createUser({ pseudo: 'alice14' });
      const user2 = await createUser({ pseudo: 'bob14', email: 'bob14@test.com' });
      await createProfile(user2._id, { bio: 'Fitness lover' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id, user2._id],
        status: 'mutual'
      });

      const result = await matchingService.getMutualMatches(user1._id);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].user.username).toBe('bob14');
      expect(result.matches[0].user.bio).toBe('Fitness lover');
      expect(result.matches[0].matchScore).toBe(70);
    });

    it('should not return non-mutual matches', async () => {
      const user1 = await createUser({ pseudo: 'alice15' });
      const user2 = await createUser({ pseudo: 'bob15', email: 'bob15@test.com' });

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id],
        status: 'user1_liked'
      });

      const result = await matchingService.getMutualMatches(user1._id);

      expect(result.matches).toHaveLength(0);
    });
  });

  // ─── blockUser ──────────────────────────────────────────

  describe('blockUser', () => {
    it('should block a user and update match status', async () => {
      const user1 = await createUser({ pseudo: 'alice16' });
      const user2 = await createUser({ pseudo: 'bob16', email: 'bob16@test.com' });
      await createProfile(user1._id);

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id, user2._id],
        status: 'mutual'
      });

      const result = await matchingService.blockUser(user1._id, user2._id);

      expect(result.message).toBe('Utilisateur bloqué.');

      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(match.status).toBe('blocked');

      const profile = await UserProfile.findOne({ userId: user1._id });
      expect(profile.blockedUsers.map(id => id.toString())).toContain(user2._id.toString());
    });
  });

  // ─── linkOrphanConversation ─────────────────────────────

  describe('linkOrphanConversation', () => {
    it('should link an orphan conversation to a match', async () => {
      const user1Id = createObjectId();
      const user2Id = createObjectId();

      const orphanConv = await createConversation([user1Id, user2Id], {
        matchId: createObjectId() // ancien matchId invalide
      });

      const match = await createMatch(user1Id, user2Id, {
        likedBy: [user1Id, user2Id],
        status: 'mutual',
        conversationId: null
      });

      const result = await matchingService.linkOrphanConversation(match);

      expect(result).not.toBeNull();
      expect(result._id.toString()).toBe(orphanConv._id.toString());

      const updatedMatch = await Match.findById(match._id);
      expect(updatedMatch.conversationId.toString()).toBe(orphanConv._id.toString());
    });

    it('should return null if match already has a conversation', async () => {
      const user1Id = createObjectId();
      const user2Id = createObjectId();
      const convId = createObjectId();

      const match = await createMatch(user1Id, user2Id, {
        likedBy: [user1Id, user2Id],
        status: 'mutual',
        conversationId: convId
      });

      const result = await matchingService.linkOrphanConversation(match);
      expect(result).toBeNull();
    });

    it('should return null if no orphan conversation exists', async () => {
      const user1Id = createObjectId();
      const user2Id = createObjectId();

      const match = await createMatch(user1Id, user2Id, {
        likedBy: [user1Id, user2Id],
        status: 'mutual',
        conversationId: null
      });

      const result = await matchingService.linkOrphanConversation(match);
      expect(result).toBeNull();
    });
  });

  // ─── getRejectedProfiles ────────────────────────────────

  describe('getRejectedProfiles', () => {
    it('should return profiles rejected by the user', async () => {
      const user1 = await createUser({ pseudo: 'alice17' });
      const user2 = await createUser({ pseudo: 'bob17', email: 'bob17@test.com' });
      await createProfile(user2._id);

      await createMatch(user1._id, user2._id, {
        status: 'rejected',
        rejectedBy: user1._id
      });

      const result = await matchingService.getRejectedProfiles(user1._id);

      expect(result.profiles).toHaveLength(1);
      expect(result.profiles[0].username).toBe('bob17');
    });

    it('should not return profiles rejected by others', async () => {
      const user1 = await createUser({ pseudo: 'alice18' });
      const user2 = await createUser({ pseudo: 'bob18', email: 'bob18@test.com' });

      await createMatch(user1._id, user2._id, {
        status: 'rejected',
        rejectedBy: user2._id // Rejeté par user2, pas user1
      });

      const result = await matchingService.getRejectedProfiles(user1._id);

      expect(result.profiles).toHaveLength(0);
    });
  });

  // ─── CASCADE DELETE (unlikeProfile) ─────────────────────

  describe('unlikeProfile — cascade delete', () => {
    it('should delete conversation and messages when match is deleted', async () => {
      const MatchMessage = require('../../models/MatchMessage');
      const user1 = await createUser({ pseudo: 'cascade1' });
      const user2 = await createUser({ pseudo: 'cascade2', email: 'cascade2@test.com' });

      const conv = await createConversation([user1._id, user2._id]);

      await createMatch(user1._id, user2._id, {
        likedBy: [user1._id],
        status: 'user1_liked',
        conversationId: conv._id
      });

      // Créer des messages dans la conv
      await MatchMessage.create([
        { conversationId: conv._id, senderId: user1._id, receiverId: user2._id, content: 'test1' },
        { conversationId: conv._id, senderId: user2._id, receiverId: user1._id, content: 'test2' }
      ]);

      await matchingService.unlikeProfile(user1._id, user2._id);

      // Match supprimé
      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(match).toBeNull();

      // Conversation supprimée
      const deletedConv = await Conversation.findById(conv._id);
      expect(deletedConv).toBeNull();

      // Messages supprimés
      const msgs = await MatchMessage.find({ conversationId: conv._id });
      expect(msgs).toHaveLength(0);
    });
  });

  // ─── rejectMatch — clean conversationId ─────────────────

  describe('rejectMatch — clean conversationId', () => {
    it('should nullify conversationId on reject', async () => {
      const user1 = await createUser({ pseudo: 'reject_clean1' });
      const user2 = await createUser({ pseudo: 'reject_clean2', email: 'rc2@test.com' });
      await createProfile(user1._id);
      await createProfile(user2._id);

      const conv = await createConversation([user1._id, user2._id]);
      await createMatch(user1._id, user2._id, {
        likedBy: [user2._id],
        status: 'user2_liked',
        conversationId: conv._id
      });

      await matchingService.rejectMatch(user1._id, user2._id);

      const match = await Match.findOne({ user1Id: user1._id, user2Id: user2._id });
      expect(match.status).toBe('rejected');
      expect(match.conversationId).toBeNull();
    });
  });

  // ─── linkOrphanConversation — inactive conv ─────────────

  describe('linkOrphanConversation — inactive conversations', () => {
    it('should link and reactivate an inactive orphan conversation', async () => {
      const user1Id = createObjectId();
      const user2Id = createObjectId();

      const inactiveConv = await createConversation([user1Id, user2Id], {
        matchId: createObjectId(),
        isActive: false
      });

      const match = await createMatch(user1Id, user2Id, {
        likedBy: [user1Id, user2Id],
        status: 'mutual',
        conversationId: null
      });

      const result = await matchingService.linkOrphanConversation(match);

      expect(result).not.toBeNull();
      expect(result._id.toString()).toBe(inactiveConv._id.toString());
      expect(result.isActive).toBe(true);

      const updatedMatch = await Match.findById(match._id);
      expect(updatedMatch.conversationId.toString()).toBe(inactiveConv._id.toString());
    });
  });

  // ─── isMutual — simplified ──────────────────────────────

  describe('Match.isMutual() — simplified', () => {
    it('should return true based on status alone', async () => {
      const match = await createMatch(createObjectId(), createObjectId(), {
        likedBy: [createObjectId()], // seulement 1 like mais status mutual
        status: 'mutual'
      });

      expect(match.isMutual()).toBe(true);
    });

    it('should return false for non-mutual status', async () => {
      const match = await createMatch(createObjectId(), createObjectId(), {
        likedBy: [createObjectId(), createObjectId()],
        status: 'user1_liked'
      });

      expect(match.isMutual()).toBe(false);
    });
  });
});
