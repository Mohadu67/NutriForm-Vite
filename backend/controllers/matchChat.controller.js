const Match = require('../models/Match');
const Conversation = require('../models/Conversation');
const MatchMessage = require('../models/MatchMessage');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { notifyNewMessage } = require('../services/pushNotification.service');
const logger = require('../utils/logger.js');
const validator = require('validator');
const xss = require('xss');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Récupérer toutes les conversations de l'utilisateur
 * GET /api/match-chat/conversations
 */
async function getConversations(req, res) {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50; // Limite par défaut de 50 conversations
    const io = req.app.get('io'); // Pour vérifier si les utilisateurs sont en ligne

    // Optimisation: récupérer les conversations avec populate, mais limiter les champs
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
      hiddenBy: { $ne: userId }
    })
      .select('_id participants matchId lastMessage isActive createdAt updatedAt unreadCount settings')
      .populate({
        path: 'participants',
        select: 'pseudo prenom photo'
      })
      .populate({
        path: 'matchId',
        select: 'matchScore distance'
      })
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(limit)
      .lean();

    // Récupérer tous les IDs des autres utilisateurs en une fois
    const otherUserIds = conversations.map(conv =>
      conv.participants.find(p => p._id.toString() !== userId.toString())?._id
    ).filter(Boolean);

    // Récupérer tous les profils en une seule requête avec seulement les champs nécessaires
    const profiles = await UserProfile.find({
      userId: { $in: otherUserIds }
    })
      .select('userId age city fitnessLevel')
      .lean();

    // Créer un Map pour un accès O(1) rapide
    const profilesMap = new Map(
      profiles.map(p => [p.userId.toString(), p])
    );

    // Construire la réponse en une seule passe
    const conversationsWithProfiles = conversations.map(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      if (!otherUser) return null;

      const profile = profilesMap.get(otherUser._id.toString()) || {};
      const unreadCount = conv.unreadCount?.[userId.toString()] || 0;
      const otherUnreadCount = conv.unreadCount?.[otherUser._id.toString()] || 0;

      // Vérifier si l'autre utilisateur est en ligne (connecté au WebSocket)
      const otherUserOnline = io && io.isUserOnline ? io.isUserOnline(otherUser._id.toString()) : false;

      // Si j'ai envoyé le dernier message, vérifier si l'autre l'a lu (son unreadCount = 0)
      const lastMsgSenderId = conv.lastMessage?.senderId?.toString();
      const iSentLastMessage = lastMsgSenderId === userId.toString();
      const lastMessageRead = iSentLastMessage ? (otherUnreadCount === 0) : null;

      return {
        _id: conv._id,
        matchId: conv.matchId,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
        isActive: conv.isActive,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: {
          ...otherUser,
          profile: {
            ...profile,
            profilePicture: otherUser.photo
          }
        },
        unreadCount,
        otherUserOnline, // true si l'autre est connecté au WebSocket
        lastMessageRead, // true si mon message a été lu, false si pas lu, null si c'est pas moi qui ai envoyé
        // Paramètres du chat pour cet utilisateur
        isMuted: conv.settings?.get?.(userId)?.isMuted || false,
        tempMessagesDuration: conv.settings?.get?.(userId)?.tempMessagesDuration || 0
      };
    }).filter(Boolean); // Enlever les null

    res.status(200).json({ conversations: conversationsWithProfiles });
  } catch (error) {
    logger.error('Erreur getConversations:', error);
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
    } else {
      // Si la conversation était cachée ou inactive, la réafficher/réactiver
      logger.info(`🔍 getOrCreateConversation: checking hiddenBy for user ${userId}, hiddenBy=${JSON.stringify(conversation.hiddenBy)}, isActive=${conversation.isActive}`);

      let needsSave = false;

      // Réactiver si inactive
      if (!conversation.isActive) {
        logger.info(`🔄 Conversation ${conversation._id} était inactive, on la réactive`);
        conversation.isActive = true;
        needsSave = true;
      }

      // Réafficher si cachée
      if (conversation.isHiddenForUser(userId)) {
        logger.info(`🔓 Conversation ${conversation._id} était cachée pour user ${userId}, on la réaffiche`);
        const userIdStr = userId.toString();
        conversation.hiddenBy = conversation.hiddenBy.filter(id => id.toString() !== userIdStr);
        needsSave = true;
      }

      if (needsSave) {
        await conversation.save();

        // Notifier via WebSocket que la conversation a été restaurée
        const io = req.app.get('io');
        logger.info(`📡 WebSocket io disponible: ${!!io}`);
        if (io) {
          io.to(`user:${userId}`).emit('conversation_restored', {
            conversationId: conversation._id
          });
          logger.info(`✅ Événement conversation_restored émis pour user ${userId}`);
        }
      } else {
        logger.info(`ℹ️ Conversation ${conversation._id} était déjà active et visible pour user ${userId}`);
      }
    }

    // Populate les informations
    await conversation.populate([
      { path: 'participants', select: 'pseudo prenom photo' },
      { path: 'matchId', select: 'matchScore distance' }
    ]);

    // Récupérer le profil de l'autre utilisateur
    const otherUserId = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    // Récupérer le User complet pour avoir la photo
    const otherUserFull = await User.findById(otherUserId._id)
      .select('photo')
      .lean();

    const otherUserProfile = await UserProfile.findOne({ userId: otherUserId._id })
      .select('age city fitnessLevel workoutTypes')
      .lean();

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

    res.status(200).json(response);
  } catch (error) {
    logger.error('Erreur getOrCreateConversation:', error);
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

    // Validation 1: Message non vide
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }

    // Validation 2: Longueur maximale (5000 caractères)
    if (content.length > 5000) {
      return res.status(400).json({ error: 'Le message est trop long (maximum 5000 caractères).' });
    }

    // Validation 3: Type de message valide
    const validTypes = ['text', 'location', 'session-invite', 'session-share'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Type de message invalide.' });
    }

    // Sanitization: Nettoyer le contenu HTML/XSS
    const sanitizedContent = xss(content.trim(), {
      whiteList: {}, // Aucun tag HTML autorisé
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    });

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

    // Chiffrer le contenu du message
    const encryptedData = encrypt(sanitizedContent);

    // SECURITY: Vérification stricte que senderId == userId authentifiée
    const userObjectId = typeof userId === 'string' ? userId : userId.toString();

    // Créer le message
    const message = await MatchMessage.create({
      conversationId,
      matchId: conversation.matchId,
      senderId: userObjectId,
      receiverId,
      type,
      content: encryptedData.encrypted,
      encryption: {
        iv: encryptedData.iv,
        authTag: encryptedData.authTag
      },
      metadata
    });

    // Mettre à jour le lastMessage de la conversation
    conversation.lastMessage = {
      content: sanitizedContent,
      senderId: userId,
      timestamp: message.createdAt
    };

    // Gérer le unhide pour les deux participants si nécessaire
    // Si la conversation était cachée pour le destinataire, la réafficher
    if (conversation.isHiddenForUser(receiverId)) {
      const userIdStr = receiverId.toString();
      conversation.hiddenBy = conversation.hiddenBy.filter(id => id.toString() !== userIdStr);
    }

    // Si la conversation était cachée pour l'expéditeur (moi), la réafficher aussi
    if (conversation.isHiddenForUser(userId)) {
      const userIdStr = userId.toString();
      conversation.hiddenBy = conversation.hiddenBy.filter(id => id.toString() !== userIdStr);
    }

    // Incrémenter le compteur non lu pour le destinataire
    const receiverKey = receiverId.toString();
    const currentUnread = conversation.unreadCount.get(receiverKey) || 0;
    conversation.unreadCount.set(receiverKey, currentUnread + 1);

    await conversation.save();

    // Populate le message avec les infos de l'expéditeur
    await message.populate('senderId', 'pseudo prenom');

    // Déchiffrer pour le retour (le message en BDD reste chiffré)
    const messageObj = message.toObject();
    if (messageObj.encryption?.iv && messageObj.encryption?.authTag) {
      messageObj.content = decrypt(messageObj.content, messageObj.encryption.iv, messageObj.encryption.authTag);
    }

    // 🔌 WebSocket: Émettre le nouveau message en temps réel
    const io = req.app.get('io');
    if (io && io.emitNewMessage) {
      io.emitNewMessage(conversationId, messageObj);
      logger.info(`📨 WebSocket: Message émis pour conversation ${conversationId}`);

      // Notifier les participants de la mise à jour de la conversation
      io.to(`user:${userId}`).emit('conversation_updated', {
        conversationId,
        lastMessage: {
          content: sanitizedContent,
          senderId: userId,
          timestamp: message.createdAt
        }
      });

      io.to(`user:${receiverId}`).emit('conversation_updated', {
        conversationId,
        lastMessage: {
          content: sanitizedContent,
          senderId: userId,
          timestamp: message.createdAt
        },
        unreadIncrement: true
      });

    }

    // Récupérer les infos de l'expéditeur pour les notifications
    const senderUser = await User.findById(userId).select('pseudo photo');

    // Vérifier si le destinataire est dans la conversation (pas besoin de notif)
    let receiverInConversation = false;
    if (io) {
      const roomName = `conversation:${conversationId}`;
      const socketsInRoom = await io.in(roomName).fetchSockets();
      receiverInConversation = socketsInRoom.some(s => s.userId === receiverId.toString());
      logger.info(`🔍 Receiver ${receiverId} dans la conv: ${receiverInConversation}`);
    }

    // Envoyer une notification UNIQUEMENT si le destinataire n'est pas dans la conversation
    if (!receiverInConversation && io && io.notifyUser && senderUser) {
      logger.info(`🔔 Envoi new_notification à user ${receiverId} (pas dans la conv)`);
      io.notifyUser(receiverId.toString(), 'new_notification', {
        id: `msg-${message._id}-${Date.now()}`,
        type: 'message',
        title: 'Nouveau message',
        message: `${senderUser.pseudo || 'Un utilisateur'}: ${sanitizedContent.substring(0, 50)}${sanitizedContent.length > 50 ? '...' : ''}`,
        avatar: senderUser.photo,
        timestamp: new Date().toISOString(),
        read: false,
        link: `/matching?conversation=${conversationId}`
      });

      // Envoyer une notification push au destinataire (seulement si pas dans la conv)
      notifyNewMessage(receiverId, {
        senderName: senderUser.pseudo || 'Un utilisateur',
        senderPhoto: senderUser.photo,
        message: sanitizedContent.substring(0, 100),
        conversationId: conversationId
      }).catch(err => logger.error('Erreur notification message:', err));
    } else if (receiverInConversation) {
      logger.info(`🔕 Pas de notification pour ${receiverId} (déjà dans la conv)`);
    }

    res.status(201).json({ message: messageObj });
  } catch (error) {
    logger.error('Erreur sendMessage:', error);
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

    // Déchiffrer les messages
    const decryptedMessages = messages.map(msg => {
      if (msg.encryption?.iv && msg.encryption?.authTag) {
        try {
          msg.content = decrypt(msg.content, msg.encryption.iv, msg.encryption.authTag);
        } catch (error) {
          logger.error(`Erreur déchiffrement message ${msg._id}:`, error);
          msg.content = '[Message chiffré - erreur de déchiffrement]';
        }
      }
      // Ne pas exposer les données de chiffrement au client
      const { encryption, ...msgWithoutEncryption } = msg;
      return msgWithoutEncryption;
    });

    // Inverser pour avoir l'ordre chronologique
    decryptedMessages.reverse();

    res.status(200).json({ messages: decryptedMessages });
  } catch (error) {
    logger.error('Erreur getMessages:', error);
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

    // Récupérer les IDs des messages qui vont être marqués comme lus
    const messagesToMarkRead = await MatchMessage.find({
      conversationId,
      receiverId: userId,
      read: false
    }).select('_id senderId').lean();

    const messageIds = messagesToMarkRead.map(m => m._id.toString());

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

    // 🔌 WebSocket: Notifier l'expéditeur que ses messages ont été lus
    if (messageIds.length > 0) {
      const io = req.app.get('io');
      if (io) {
        // Notifier la conversation (pour ceux qui sont dans le chat)
        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          messageIds,
          readBy: userId
        });

        // Notifier l'utilisateur qui a lu pour décrémenter son badge
        io.to(`user:${userId}`).emit('conversation_updated', {
          conversationId,
          unreadDecrement: messageIds.length
        });

        // Notifier aussi les expéditeurs des messages (pour mettre à jour ✓✓ dans leur liste de conv)
        // Trouver l'autre participant (l'expéditeur des messages qu'on vient de lire)
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId.toString()
        );
        if (otherParticipantId) {
          io.to(`user:${otherParticipantId}`).emit('messages_read', {
            conversationId,
            messageIds,
            readBy: userId
          });
        }

        logger.info(`📖 WebSocket: ${messageIds.length} messages marqués comme lus dans conversation ${conversationId}`);
      }
    }

    res.status(200).json({
      message: 'Messages marqués comme lus.',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Erreur markAsRead:', error);
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
    logger.error('Erreur deleteMessage:', error);
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
    logger.error('Erreur blockConversation:', error);
    res.status(500).json({ error: 'Erreur lors du blocage de la conversation.' });
  }
}

/**
 * Supprimer une conversation (masquage local uniquement)
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

    // Masquer la conversation pour cet utilisateur seulement
    try {
      await conversation.hideForUser(userId);

      // Supprimer les messages uniquement pour cet utilisateur
      await MatchMessage.updateMany(
        { conversationId },
        { $addToSet: { deletedBy: userId } }
      );

      res.status(200).json({ message: 'Conversation supprimée avec succès.' });
    } catch (saveError) {
      logger.error('Erreur lors de la sauvegarde hideForUser:', saveError);
      res.status(500).json({
        error: 'Erreur lors de la suppression de la conversation.',
        details: saveError.message
      });
    }
  } catch (error) {
    logger.error('Erreur deleteConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la conversation.' });
  }
}

/**
 * Récupérer uniquement le compteur total de messages non lus
 * GET /api/match-chat/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.userId;
    const userIdStr = userId.toString();

    // Requête simple et rapide
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
      hiddenBy: { $ne: userId }
    })
      .select('unreadCount')
      .lean();

    // Calculer le total
    const totalUnread = conversations.reduce((sum, conv) => {
      const count = conv.unreadCount?.[userIdStr] || 0;
      return sum + count;
    }, 0);

    res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    logger.error('Erreur getUnreadCount:', error);
    res.status(200).json({ unreadCount: 0 }); // Retourner 0 en cas d'erreur
  }
}

/**
 * Mettre à jour les paramètres d'une conversation
 * PATCH /api/match-chat/conversation/:conversationId/settings
 */
async function updateConversationSettings(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { isMuted, tempMessagesDuration } = req.body;

    // Récupérer la conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.includesUser(userId)) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation.' });
    }

    // Initialiser les settings si nécessaire
    if (!conversation.settings) {
      conversation.settings = {};
    }
    if (!conversation.settings[userId]) {
      conversation.settings[userId] = {};
    }

    // Mettre à jour les paramètres
    if (typeof isMuted === 'boolean') {
      conversation.settings[userId].isMuted = isMuted;
    }
    if (typeof tempMessagesDuration === 'number') {
      conversation.settings[userId].tempMessagesDuration = tempMessagesDuration;
    }

    // Sauvegarder
    conversation.markModified('settings');
    await conversation.save();

    res.status(200).json({
      success: true,
      settings: conversation.settings[userId]
    });
  } catch (error) {
    logger.error('Erreur updateConversationSettings:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres.' });
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
  deleteConversation,
  getUnreadCount,
  updateConversationSettings
};
