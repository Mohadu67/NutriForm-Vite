const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const MatchMessage = require('../models/MatchMessage');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

/**
 * Récupérer toutes les conversations de l'utilisateur
 * GET /api/match-chat/conversations
 */
async function getConversations(req, res) {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'pseudo prenom email')
      .populate('matchId', 'matchScore distance')
      .sort({ 'lastMessage.timestamp': -1 })
      .lean();

    // Pour chaque conversation, récupérer le profil de l'autre participant
    const conversationsWithProfiles = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        // Récupérer la photo du User
        const otherUserFull = await User.findById(otherUserId._id)
          .select('photo')
          .lean();

        const profile = await UserProfile.findOne({ userId: otherUserId._id })
          .select('age city fitnessLevel')
          .lean();

        return {
          ...conv,
          otherUser: {
            ...otherUserId,
            profile: {
              ...profile,
              profilePicture: otherUserFull?.photo // Ajouter la photo du User
            }
          },
          unreadCount: conv.unreadCount?.get?.(userId.toString()) || 0
        };
      })
    );

    res.status(200).json({ conversations: conversationsWithProfiles });
  } catch (error) {
    console.error('Erreur getConversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations.' });
  }
}

/**
 * Récupérer ou créer une conversation pour un match
 * GET /api/match-chat/conversation/:matchId
 */
async function getOrCreateConversation(req, res) {
  try {
    const { matchId } = req.params;
    const userId = req.userId;

    // Vérifier que le match existe et est mutuel
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match non trouvé.' });
    }

    if (match.status !== 'mutual') {
      return res.status(403).json({ error: 'Le match doit être mutuel pour chatter.' });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isParticipant = match.user1Id.equals(userId) || match.user2Id.equals(userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de ce match.' });
    }

    // Récupérer ou créer la conversation
    let conversation = await Conversation.findOne({ matchId });

    if (!conversation) {
      // Créer une nouvelle conversation
      conversation = await Conversation.create({
        matchId,
        participants: [match.user1Id, match.user2Id],
        unreadCount: new Map([
          [match.user1Id.toString(), 0],
          [match.user2Id.toString(), 0]
        ])
      });

      // Mettre à jour le Match avec le conversationId
      match.conversationId = conversation._id;
      await match.save();
    }

    // Populate les informations
    await conversation.populate([
      { path: 'participants', select: 'pseudo prenom email' },
      { path: 'matchId', select: 'matchScore distance' }
    ]);

    // Récupérer le profil de l'autre utilisateur
    const otherUserId = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    console.log('👤 otherUserId:', otherUserId);

    // Récupérer le User complet pour avoir la photo
    const otherUserFull = await User.findById(otherUserId._id)
      .select('photo')
      .lean();

    const otherUserProfile = await UserProfile.findOne({ userId: otherUserId._id })
      .select('age city fitnessLevel workoutTypes')
      .lean();

    console.log('📸 otherUserPhoto:', otherUserFull?.photo);
    console.log('📸 otherUserProfile:', otherUserProfile);

    const response = {
      conversation: {
        ...conversation.toObject(),
        otherUser: {
          ...otherUserId.toObject(),
          profile: {
            ...otherUserProfile,
            profilePicture: otherUserFull?.photo // Ajouter la photo du User
          }
        },
        unreadCount: conversation.getUnreadCount(userId)
      }
    };

    console.log('📤 Réponse envoyée:', JSON.stringify(response, null, 2));

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur getOrCreateConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la conversation.' });
  }
}

/**
 * Envoyer un message dans une conversation
 * POST /api/match-chat/:conversationId/messages
 */
async function sendMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', metadata = {} } = req.body;
    const userId = req.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }

    // Récupérer la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    // Vérifier que la conversation n'est pas bloquée
    if (conversation.isBlocked) {
      return res.status(403).json({ error: 'Cette conversation est bloquée.' });
    }

    // Identifier le destinataire
    const receiverId = conversation.getOtherParticipant(userId);

    // Créer le message
    const message = await MatchMessage.create({
      conversationId,
      matchId: conversation.matchId,
      senderId: userId,
      receiverId,
      type,
      content: content.trim(),
      metadata
    });

    // Mettre à jour le lastMessage de la conversation
    conversation.lastMessage = {
      content: content.trim(),
      senderId: userId,
      timestamp: message.createdAt
    };

    // Incrémenter le compteur non lu pour le destinataire
    await conversation.incrementUnread(receiverId);

    await conversation.save();

    // Populate le message avec les infos de l'expéditeur
    await message.populate('senderId', 'pseudo prenom');

    res.status(201).json({ message });
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message.' });
  }
}

/**
 * Récupérer les messages d'une conversation
 * GET /api/match-chat/:conversationId/messages
 */
async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { limit = 50, before } = req.query; // Pagination

    // Récupérer la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    // Construire la query
    const query = {
      conversationId,
      isDeleted: false,
      deletedBy: { $ne: userId } // Ne pas afficher les messages supprimés par l'user
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Récupérer les messages
    const messages = await MatchMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'pseudo prenom')
      .populate('receiverId', 'pseudo prenom')
      .lean();

    // Inverser pour avoir l'ordre chronologique
    messages.reverse();

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Erreur getMessages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
  }
}

/**
 * Marquer les messages comme lus
 * PUT /api/match-chat/:conversationId/read
 */
async function markAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Récupérer la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    // Marquer tous les messages non lus comme lus
    const result = await MatchMessage.updateMany(
      {
        conversationId,
        receiverId: userId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    // Réinitialiser le compteur non lu pour cet utilisateur
    await conversation.resetUnread(userId);

    res.status(200).json({
      message: 'Messages marqués comme lus.',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json({ error: 'Erreur lors du marquage des messages.' });
  }
}

/**
 * Supprimer un message (soft delete)
 * DELETE /api/match-chat/messages/:messageId
 */
async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await MatchMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!message.senderId.equals(userId) && !message.receiverId.equals(userId)) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer ce message.' });
    }

    // Soft delete
    await message.deleteForUser(userId);

    res.status(200).json({ message: 'Message supprimé.' });
  } catch (error) {
    console.error('Erreur deleteMessage:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du message.' });
  }
}

/**
 * Bloquer une conversation
 * POST /api/match-chat/:conversationId/block
 */
async function blockConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    conversation.isBlocked = true;
    conversation.blockedBy = userId;
    await conversation.save();

    res.status(200).json({ message: 'Conversation bloquée.' });
  } catch (error) {
    console.error('Erreur blockConversation:', error);
    res.status(500).json({ error: 'Erreur lors du blocage de la conversation.' });
  }
}

/**
 * Supprimer une conversation (soft delete)
 * DELETE /api/match-chat/conversation/:conversationId
 */
async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Non autorisé.' });
    }

    // Soft delete : marquer comme inactive
    conversation.isActive = false;
    await conversation.save();

    // Supprimer tous les messages associés
    await MatchMessage.deleteMany({ conversationId });

    res.status(200).json({ message: 'Conversation supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur deleteConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la conversation.' });
  }
}

module.exports = {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  blockConversation,
  deleteConversation
};
